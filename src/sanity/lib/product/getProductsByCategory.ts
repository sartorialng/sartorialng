import { client } from "../client";
import { groq } from "next-sanity";

interface FilterParams {
	categories?: string[];
	colors?: string[];
}

export const getFilteredProducts = async ({
	categories,
	colors,
}: FilterParams) => {
	let categoryFilter = "";
	let colorFilter = "";

	if (categories && categories.length > 0) {
		const categoryConditions = categories
			.map((cat) => `lower(title) == lower("${cat}")`)
			.join(" || ");
		categoryFilter = `&& references(*[_type == "category" && (${categoryConditions})]._id)`;
	}

	if (colors && colors.length > 0) {
		// Colour rows may be plain references (legacy) or {color, stock} objects.
		colorFilter = `&& count(colors[lower(coalesce(color->title, @->title)) in $colorTitles]) > 0`;
	}

	const FILTERED_PRODUCTS_QUERY = groq`
    *[_type == "product" ${categoryFilter} ${colorFilter}] {
      _id,
      name,
      "slug": slug.current,
      price,
      stock,
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
	  onPreSale,
      preSaleAvailability,
	  onPreOrder,
      preOrderAvailability,
      isComingSoon,
      description,
      detailedDescription,
      isBestSeller,
      isNewArrival,
      images[]{
        alt,
        asset->{url},
        "color": color->{
          _id,
          title,
          hex
        }
      },
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
    }
  `;

	try {
		const products = await client.fetch(
			FILTERED_PRODUCTS_QUERY,
			{ colorTitles: (colors ?? []).map((c) => c.toLowerCase()) },
			{
				next: {
					revalidate: 1800,
				},
			},
		);
		return products || [];
	} catch (error) {
		console.error("Error fetching filtered products:", error);
		return [];
	}
};
