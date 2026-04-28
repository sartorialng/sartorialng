import { client } from "../client";
import { groq } from "next-sanity";

export const getMyOrders = async (userId: string) => {
	const MY_ORDERS_QUERY = groq`
      *[_type == "order" && clerkUserId == $userId] | order(orderDate desc) {
        _id,
        orderNumber,
        orderDate,
        status,
        totalPrice,
        currency,
        products[]{
          quantity,
          selectedColor,
          product->{
            name,
            price,
            images[]{ asset->{url}, alt }
          }
        }
      }
    `;
	return client.fetch(
		MY_ORDERS_QUERY,
		{ userId },
		{
			next: {
				revalidate: 10,
			},
		},
	);
};
