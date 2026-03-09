import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		if (!Array.isArray(body) || body.length === 0) {
			return NextResponse.json(
				{ error: "Invalid or empty cart items" },
				{ status: 400 },
			);
		}

		const productIds: string[] = body
			.map((item: any) => item?.product?._id)
			.filter(Boolean);

		if (productIds.length === 0) {
			return NextResponse.json(
				{ error: "No valid product IDs found in cart" },
				{ status: 400 },
			);
		}

		const products = await adminClient.fetch(
			`*[_type == "product" && _id in $ids]{
				_id,
				name,
				stock,
				onPreSale,
				onPreOrder
			}`,
			{ ids: productIds },
		);

		const productMap = new Map(products.map((p: any) => [p._id, p]));

		const outOfStockItems: string[] = [];

		for (const item of body) {
			const productId = item?.product?._id;
			const productName = item?.product?.name ?? "Unknown product";
			const sanityProduct = productMap.get(productId) as any;

			if (!sanityProduct) {
				outOfStockItems.push(productName);
				continue;
			}

			const { stock, onPreSale, onPreOrder } = sanityProduct;

			const isAvailable =
				(stock != null && stock > 0) ||
				onPreSale === true ||
				onPreOrder === true;

			if (!isAvailable) {
				outOfStockItems.push(productName);
			}
		}

		if (outOfStockItems.length > 0) {
			const itemList = outOfStockItems.join(", ");
			const message =
				outOfStockItems.length === 1
					? `"${itemList}" is currently out of stock.`
					: `The following items are currently out of stock: ${itemList}.`;

			return NextResponse.json(
				{
					allInStock: false,
					outOfStockItems,
					message,
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
