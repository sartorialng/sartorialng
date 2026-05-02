import { client } from "../client";
import { groq } from "next-sanity";

export const getAllOrders = async () => {
	const ALL_ORDERS_QUERY = groq`
    *[_type == "order"] | order(orderDate desc) {
      _id,
      orderNumber,
      paymentMethod,
      paystackReference,
      paypalOrderId,
      orderDate,
      customerName,
      email,
      status,
      totalPrice,
      currency,
      amountDiscount,
      clerkUserId,
      products[]{
        quantity,
        selectedColor,
        product->{
          name,
          price,
          images[]{ asset->{url}, alt }
        }
      },
      shippingAddress,
      shippingCost,
      vat,
      subtotal,
      orderNote
    }
  `;

	return client.fetch(
		ALL_ORDERS_QUERY,
		{},
		{
			next: {
				revalidate: 300,
			},
		},
	);
};
