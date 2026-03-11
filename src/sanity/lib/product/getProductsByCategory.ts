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
		const colorConditions = colors
			.map((color) => `lower(title) == lower("${color}")`)
			.join(" || ");
		colorFilter = `&& count((colors[]->title)[lower(@) in [${colors.map((c) => `lower("${c}")`).join(", ")}]]) > 0`;
	}

	const FILTERED_PRODUCTS_QUERY = groq`
    *[_type == "product" ${categoryFilter} ${colorFilter}] {
      _id,
      name,
      "slug": slug.current,
      price,
      stock,
	  onPreSale,
      preSaleAvailability,
	  onPreOrder,
      preOrderAvailability,
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
      colors[]->{
        _id,
        title,
        hex
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
			{},
			{
				next: {
					revalidate: 30,
				},
			},
		);
		return products || [];
	} catch (error) {
		console.error("Error fetching filtered products:", error);
		return [];
	}
};
