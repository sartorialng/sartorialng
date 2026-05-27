import { client } from "../client";
import { groq } from "next-sanity";

export const getBestSellers = async () => {
	const query = groq`
    *[_type == "product" && isBestSeller == true] | order(_createdAt desc) {
      _id,
      name,
      "slug": slug.current,
      onSale,
      onCombo,
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
      images[]{ asset->{url}, alt },
      colors[]->{
        _id,
        title
      }
    }
  `;
	return client.fetch(
		query,
		{},
		{
			next: {
				revalidate: 60,
				// revalidate: 3600,
			},
		},
	);
};
