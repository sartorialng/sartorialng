import { client } from "../client";
import { groq } from "next-sanity";

export const getProductBySlug = async (slug: string) => {
	const PRODUCT_BY_SLUG_QUERY = groq`
    *[_type == "product" && slug.current == $slug][0] {
      _id,
      name,
      "slug": slug.current,
      onSale,
      onCombo,
      discountValue,
      price,
      salePrice,
      stock,
      description,
      detailedDescription,
      isBestSeller,
      isNewArrival,
      onPreSale,
      preSaleAvailability,
      onPreOrder,
      preOrderAvailability,
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
        name
      }
    }
  `;

	return client.fetch(
		PRODUCT_BY_SLUG_QUERY,
		{ slug },
		{
			next: {
				revalidate: 10,
			},
		},
	);
};
