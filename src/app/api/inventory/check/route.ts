import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";
import { getColorStock } from "@/lib/stock";

type CartLine = {
	product?: {
		_id?: string;
		name?: string;
		price?: number | null;
		salePrice?: number | null;
		onSale?: boolean | null;
	} | null;
	quantity?: number;
	selectedColor?: { _id?: string; title?: string } | null;
	/** Gift lines carry no colour and are not paid for, so they are checked
	 *  for availability but never for price. */
	isFreeGift?: boolean;
	/**
	 * Which half of the check this line is for. A combo sends itself as
	 * "price" (its bundle price is what gets charged) and each of its bags as
	 * "stock" (the combo document holds no stock of its own). Default "both".
	 */
	check?: "both" | "price" | "stock";
	/** The combo a "stock" line belongs to, so a problem can name it. */
	comboName?: string | null;
};

type ProductAvailability = {
	_id: string;
	name: string | null;
	stock: number | null;
	price: number | null;
	salePrice: number | null;
	onSale: boolean | null;
	onPreSale: boolean | null;
	onPreOrder: boolean | null;
	colors: Array<{
		_key: string | null;
		_id: string | null;
		title: string | null;
		stock: number | null;
	}> | null;
};

/** What a line should cost, from whichever record we are looking at. */
const effectivePrice = (source: {
	onSale?: boolean | null;
	price?: number | null;
	salePrice?: number | null;
}) => (source.onSale ? (source.salePrice ?? 0) : (source.price ?? 0));

/**
 * What is on the shelf for one line.
 *
 * A line with a colour goes against that colour's own count. A line without
 * one — a free gift, or a product that never had colours — goes against the
 * product-level count, except where the product keeps its stock per colour, in
 * which case the total across colours is what is actually available to send.
 * Reading the product-level field there would compare against a number nobody
 * maintains.
 */
const availableForLine = (
	product: ProductAvailability,
	colorId: string | null,
) => {
	if (colorId) return getColorStock(product, colorId);

	const perColour = (product.colors ?? [])
		.map((c) => c?.stock)
		.filter((s): s is number => typeof s === "number" && Number.isFinite(s));

	if (perColour.length > 0) return perColour.reduce((a, b) => a + b, 0);

	return getColorStock(product, null);
};

/**
 * The last check before the payment modal opens.
 *
 * The basket holds a copy of each product taken when it was added, which can be
 * months old, so both the stock and the price it carries are re-read from
 * Sanity here and the sale is stopped if either has moved.
 */
export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as CartLine[];

		if (!Array.isArray(body) || body.length === 0) {
			return NextResponse.json(
				{ error: "Invalid or empty cart items" },
				{ status: 400 },
			);
		}

		// The same product in the same colour can sit on several cart lines, so
		// add the quantities up before comparing against stock.
		const requested = new Map<
			string,
			{
				productId: string;
				colorId: string | null;
				colorTitle: string | null;
				name: string;
				comboName: string | null;
				quantity: number;
				submittedPrice: number | null;
				checkPrice: boolean;
				checkStock: boolean;
				isFreeGift: boolean;
			}
		>();

		for (const item of body) {
			const productId = item?.product?._id;
			if (!productId) continue;
			const colorId = item?.selectedColor?._id ?? null;
			const key = `${productId}::${colorId ?? ""}`;
			const quantity = Math.max(1, Number(item?.quantity) || 1);
			const isFreeGift = item?.isFreeGift === true;
			const mode = item?.check ?? "both";
			// Gifts are not paid for, so they never carry a price to check.
			const wantsPrice = mode !== "stock" && !isFreeGift;
			const wantsStock = mode !== "price";

			const existing = requested.get(key);
			if (existing) {
				if (wantsStock) existing.quantity += quantity;
				existing.checkStock = existing.checkStock || wantsStock;
				// A paid line in the same group still has to clear the price
				// check, so the group only stays unpriced while every line is.
				if (wantsPrice && !existing.checkPrice) {
					existing.checkPrice = true;
					existing.submittedPrice = item?.product
						? effectivePrice(item.product)
						: null;
				}
				if (!isFreeGift) existing.isFreeGift = false;
				if (!existing.comboName && item?.comboName) {
					existing.comboName = item.comboName;
				}
			} else {
				requested.set(key, {
					productId,
					colorId,
					colorTitle: item?.selectedColor?.title ?? null,
					name: item?.product?.name ?? "Unknown product",
					comboName: item?.comboName ?? null,
					quantity: wantsStock ? quantity : 0,
					submittedPrice:
						wantsPrice && item?.product
							? effectivePrice(item.product)
							: null,
					checkPrice: wantsPrice,
					checkStock: wantsStock,
					isFreeGift,
				});
			}
		}

		if (requested.size === 0) {
			return NextResponse.json(
				{ error: "No valid product IDs found in cart" },
				{ status: 400 },
			);
		}

		const ids = [...new Set([...requested.values()].map((r) => r.productId))];

		const products = await adminClient.fetch<ProductAvailability[]>(
			`*[_type == "product" && _id in $ids]{
				_id,
				name,
				stock,
				price,
				salePrice,
				onSale,
				onPreSale,
				onPreOrder,
				colors[]{
					_key,
					"_id": coalesce(color->_id, @->_id),
					"title": coalesce(color->title, @->title),
					stock
				}
			}`,
			{ ids },
		);

		const productMap = new Map(products.map((p) => [p._id, p]));

		const problems: string[] = [];
		let insufficientStock = false;
		let priceChanged = false;

		for (const group of requested.values()) {
			const product = productMap.get(group.productId);

			if (!product) {
				problems.push(`"${group.name}" is no longer available.`);
				continue;
			}

			const colorTitle =
				product.colors?.find((c) => c._id === group.colorId)?.title ??
				group.colorTitle;
			const label = colorTitle
				? `${product.name ?? group.name} (${colorTitle})`
				: (product.name ?? group.name);

			// Price first, so a stale basket cannot pay an old price even for
			// something that is still in stock.
			const currentPrice = effectivePrice(product);
			if (
				group.checkPrice &&
				group.submittedPrice !== null &&
				Math.abs(group.submittedPrice - currentPrice) > 0.01
			) {
				priceChanged = true;
				problems.push(
					`The price of "${label}" is now ₦${currentPrice.toLocaleString()}.`,
				);
			}

			// A combo sends itself for the price only — the bags it is made of
			// carry the stock, and arrive as their own lines.
			if (!group.checkStock) continue;

			// Pre-sale and pre-order items are deliberately sold before the
			// stock exists, so no count is expected for them.
			if (product.onPreSale === true || product.onPreOrder === true) {
				continue;
			}

			const available = availableForLine(product, group.colorId);

			// No count recorded anywhere, or a colour that is no longer on the
			// product. Refuse rather than guess — this is how a basket saved
			// before a colour was removed gets stopped, and it matches how the
			// gate behaved before per-colour stock existed.
			if (available === null) {
				problems.push(`"${label}" is not available for purchase.`);
				continue;
			}

			if (available <= 0) {
				problems.push(
					group.isFreeGift
						? `The free gift "${label}" is sold out, so this combo cannot be ordered right now.`
						: group.comboName
							? `"${group.comboName}" cannot be ordered — ${label} is sold out.`
							: `"${label}" is sold out.`,
				);
			} else if (group.quantity > available) {
				insufficientStock = true;
				problems.push(
					group.comboName
						? `Only ${available} of ${label} left, and "${group.comboName}" needs ${group.quantity}.`
						: `Only ${available} of "${label}" left — you have ${group.quantity} in your cart.`,
				);
			}
		}

		if (problems.length > 0) {
			return NextResponse.json(
				{
					allInStock: false,
					insufficientStock,
					priceChanged,
					outOfStockItems: problems,
					message: problems.join(" "),
				},
				{ status: 200 },
			);
		}

		return NextResponse.json({
			allInStock: true,
			message: "All items are available.",
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to validate items",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
