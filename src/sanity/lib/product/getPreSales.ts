import { client } from "../client";
import { groq } from "next-sanity";

export const getPreSale = async () => {
	const PRE_SALE_QUERY = groq`
    *[_type == "product" && onPreSale == true] | order(_createdAt desc) {
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
		PRE_SALE_QUERY,
		{},
		{
			next: {
				revalidate: 1800,
			},
		},
	);
};
