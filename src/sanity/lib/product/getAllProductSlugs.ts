import { client } from "../client";
import { groq } from "next-sanity";

export const getAllProductSlugs = async (): Promise<{ slug: string }[]> => {
	const query = groq`*[_type == "product" && defined(slug.current)]{ "slug": slug.current }`;
	return client.fetch(
		query,
		{},
		// {
		// 	{ next: { revalidate: 3600 }
		// },
	);
};
