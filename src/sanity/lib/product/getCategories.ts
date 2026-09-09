import { client } from "../client";
import { groq } from "next-sanity";

export interface StoreCategory {
	_id: string;
	title: string;
	slug: string | null;
	menuLabel: string | null;
	comingSoon: boolean | null;
	displayOrder: number | null;
	image: {
		asset?: { _ref: string };
		alt?: string;
		hotspot?: unknown;
		crop?: unknown;
	} | null;
}

// A projection fragment, not a query: typegen cannot parse it standalone, so
// it is a plain template string and only the queries below carry the groq tag.
const CATEGORY_FIELDS = `
	_id,
	title,
	"slug": slug.current,
	menuLabel,
	comingSoon,
	displayOrder,
	image
`;

const STOREFRONT_CATEGORIES_QUERY = groq`
	*[_type == "category" && showOnHomepage == true]
		| order(coalesce(displayOrder, 999) asc, title asc) {
		${CATEGORY_FIELDS}
	}
`;

const ALL_CATEGORIES_QUERY = groq`
	*[_type == "category"]
		| order(coalesce(displayOrder, 999) asc, title asc) {
		${CATEGORY_FIELDS}
	}
`;

export const getStorefrontCategories = async (): Promise<StoreCategory[]> => {
	try {
		const categories = await client.fetch<StoreCategory[]>(
			STOREFRONT_CATEGORIES_QUERY,
			{},
			{
				next: {
					revalidate: 300,
				},
			},
		);
		return categories || [];
	} catch (error) {
		console.error("Error fetching storefront categories:", error);
		return [];
	}
};

export const getAllCategories = async (): Promise<StoreCategory[]> => {
	try {
		const categories = await client.fetch<StoreCategory[]>(
			ALL_CATEGORIES_QUERY,
			{},
			{
				next: {
					revalidate: 300,
				},
			},
		);
		return categories || [];
	} catch (error) {
		console.error("Error fetching categories:", error);
		return [];
	}
};
