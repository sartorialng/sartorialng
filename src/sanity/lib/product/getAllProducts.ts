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
      freeShipping,
      comboItems[]{
        _key,
        quantity,
        "colorOptionIds": colorOptions[]->_id,
        product->{
          _id,
          name,
          "slug": slug.current,
          stock,
          colors[]{
            _key,
            "_id": coalesce(color->_id, @->_id),
            "title": coalesce(color->title, @->title),
            stock
          }
        }
      },
      freeGift->{
        _id,
        name,
        "slug": slug.current,
        price,
        images[]{ asset->{url}, alt }
      },
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
      isGift,
      isRecommendedGift,
      images[]{ asset->{url}, alt },
      colors[]{
        _key,
        "_id": coalesce(color->_id, @->_id),
        "title": coalesce(color->title, @->title),
        stock
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
				revalidate: 900,
			},
		},
	);
};
