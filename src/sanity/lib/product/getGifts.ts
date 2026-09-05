import { client } from "../client";
import { groq } from "next-sanity";

export const getGifts = async () => {
	const GIFTS_QUERY = groq`
	*[_type == "product" && isGift == true] | order(_createdAt desc) {
	  _id,
	  name,
	  "slug": slug.current,
	  onSale,
	  onCombo,
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
	  colors[]->{
		_id,
		title
	  }
	}
  `;
	return client.fetch(
		GIFTS_QUERY,
		{},
		{
			next: {
				revalidate: 1800,
			},
		},
	);
};
