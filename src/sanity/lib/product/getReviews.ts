import { client } from "../client";
import { groq } from "next-sanity";

export const getAllReviews = async () => {
	const ALL_REVIEWS_QUERY = groq`
    *[_type == "review" && isApproved == true] | order(date desc) {
      _id,
      customerName,
      rating,
      comment,
      date
    }
  `;
	return client.fetch(
		ALL_REVIEWS_QUERY,
		{},
		{
			next: {
				revalidate: 10,
			},
		},
	);
};
