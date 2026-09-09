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
      images[]{ asset->{url}, alt },
      colors[]{
        _key,
        "_id": coalesce(color->_id, @->_id),
        "title": coalesce(color->title, @->title),
        stock
      }
    }
  `;
	return client.fetch(
		query,
		{},
		{
			next: {
				revalidate: 900,
			},
		},
	);
};
