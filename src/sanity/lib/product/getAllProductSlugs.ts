import { client } from "../client";
import { groq } from "next-sanity";

export const getAllProductSlugs = async (): Promise<{ slug: string }[]> => {
	const ALL_PRODUCT_SLUGS_QUERY = groq`*[_type == "product" && defined(slug.current)]{ "slug": slug.current }`;
	return client.fetch(
		ALL_PRODUCT_SLUGS_QUERY,
		{},
		// {
		// 	{ next: { revalidate: 3600 }
		// },
	);
};
