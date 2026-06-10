import { client } from "../client";
import { groq } from "next-sanity";

export const getAllProducts = async () => {
	const ALL_PRODUCTS_QUERY = groq`
    *[_type == "product"] | order(_createdAt desc) {
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
      isComingSoon,
      images[]{ asset->{url}, alt },
      colors[]->{
        _id,
        title
      },
      categories[]->{
        _id,
        title,
        "slug": slug.current
      }
    }
  `;
	return client.fetch(
		ALL_PRODUCTS_QUERY,
		{},
		{
			next: {
				revalidate: 3600,
			},
		},
	);
};
