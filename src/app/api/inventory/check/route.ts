import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";
import { getColorStock } from "@/lib/stock";

type CartLine = {
	product?: { _id?: string; name?: string } | null;
	quantity?: number;
	selectedColor?: { _id?: string; title?: string } | null;
};

type ProductAvailability = {
	_id: string;
	name: string | null;
	stock: number | null;
	onPreSale: boolean | null;
	onPreOrder: boolean | null;
	colors: Array<{
		_key: string | null;
		_id: string | null;
		title: string | null;
		stock: number | null;
	}> | null;
};

/**
 * Pre-payment gate. Checks the requested quantity of every product + colour in
 * the cart against the live count in Sanity (per colour where the colour has
 * its own count, otherwise the product-level count).
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

		for (const group of requested.values()) {
			const product = productMap.get(group.productId);

			if (!product) {
				problems.push(`"${group.name}" is no longer available.`);
				continue;
			}

			if (product.onPreSale === true || product.onPreOrder === true) {
				continue;
			}

			const available = getColorStock(product, group.colorId);
			if (available === null) continue;

			const colorTitle =
				product.colors?.find((c) => c._id === group.colorId)?.title ??
				group.colorTitle;
			const label = colorTitle
				? `${product.name ?? group.name} (${colorTitle})`
				: (product.name ?? group.name);

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
