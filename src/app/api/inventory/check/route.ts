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
				quantity: number;
				submittedPrice: number | null;
			}
		>();

		for (const item of body) {
			const productId = item?.product?._id;
			if (!productId) continue;
			const colorId = item?.selectedColor?._id ?? null;
			const key = `${productId}::${colorId ?? ""}`;
			const quantity = Math.max(1, Number(item?.quantity) || 1);
			const existing = requested.get(key);
			if (existing) {
				existing.quantity += quantity;
			} else {
				requested.set(key, {
					productId,
					colorId,
					colorTitle: item?.selectedColor?.title ?? null,
					name: item?.product?.name ?? "Unknown product",
					quantity,
					submittedPrice: item?.product
						? effectivePrice(item.product)
						: null,
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
				group.submittedPrice !== null &&
				Math.abs(group.submittedPrice - currentPrice) > 0.01
			) {
				priceChanged = true;
				problems.push(
					`The price of "${label}" is now ₦${currentPrice.toLocaleString()}.`,
				);
			}

			// Pre-sale and pre-order items are deliberately sold before the
			// stock exists, so no count is expected for them.
			if (product.onPreSale === true || product.onPreOrder === true) {
				continue;
			}

			const available = getColorStock(product, group.colorId);

			// No count recorded anywhere, or a colour that is no longer on the
			// product. Refuse rather than guess — this is how a basket saved
			// before a colour was removed gets stopped, and it matches how the
			// gate behaved before per-colour stock existed.
			if (available === null) {
				problems.push(`"${label}" is not available for purchase.`);
				continue;
			}

			if (available <= 0) {
				problems.push(`"${label}" is sold out.`);
			} else if (group.quantity > available) {
				insufficientStock = true;
				problems.push(
					`Only ${available} of "${label}" left — you have ${group.quantity} in your cart.`,
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
