import { client } from "../client";
import { groq } from "next-sanity";

export const getNewArrivals = async () => {
	const NEW_ARRIVALS_QUERY = groq`
    *[_type == "product" && isNewArrival == true] | order(_createdAt desc) {
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
		NEW_ARRIVALS_QUERY,
		{},
		{
			next: {
				revalidate: 60,
			},
		},
	);
};
