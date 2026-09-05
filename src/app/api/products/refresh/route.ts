import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the current version of a set of products.
 *
 * The wishlist and the basket both keep a full copy of the product in the
 * shopper's browser, which can be months old by the time they come back. That
 * snapshot decides what the page shows and what price the order is built from,
 * so it has to be refreshed against Sanity before either is trusted.
 *
 * The projection deliberately mirrors `getAllProducts`, because that is the
 * shape the stored copies were made from.
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const ids: string[] = Array.isArray(body?.ids)
			? body.ids.filter(
					(id: unknown): id is string =>
						typeof id === "string" && id.length > 0,
				)
			: [];

		if (ids.length === 0) {
			return NextResponse.json({ products: [] });
		}

		const products = await adminClient.fetch(
			`*[_type == "product" && _id in $ids] {
				_id,
				name,
				"slug": slug.current,
				onSale,
				onCombo,
				freeGift->{
					_id,
					name,
					"slug": slug.current,
					price,
					images[]{ asset->{url}, alt }
				},
				discountValue,
				price,
				salePrice,
				stock,
				isBestSeller,
				isNewArrival,
				onPreSale,
				preSaleAvailability,
				onPreOrder,
				preOrderAvailability,
				isComingSoon,
				isGift,
				isRecommendedGift,
				images[]{ asset->{url}, alt },
				colors[]{
					_key,
					"_id": coalesce(color->_id, @->_id),
					"title": coalesce(color->title, @->title),
					stock
				},
				categories[]->{
					_id,
					title,
					"slug": slug.current
				}
			}`,
			{ ids },
		);

		return NextResponse.json({ products });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to refresh products",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
