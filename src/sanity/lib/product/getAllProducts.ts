import { client } from "../client";
import { groq } from "next-sanity";

export const getAllProducts = async () => {
	const ALL_PRODUCTS_QUERY = groq`
    *[_type == "product"] | order(_createdAt desc) {
      _id,
      name,
      "slug": slug.current,
      price,
      stock,
      isBestSeller,
      isNewArrival,
      images[]{ asset->{url}, alt },
      colors[]->{
        _id,
        title
      }
    }
  `;
	return client.fetch(
		ALL_PRODUCTS_QUERY,
		{},
		{
			next: {
				revalidate: 60,
			},
		},
	);
};
