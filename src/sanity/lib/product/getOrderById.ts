import { client } from "../client";
import { groq } from "next-sanity";

export const getOrderById = async (id: string) => {
	const ORDER_BY_ID_QUERY = groq`
      *[_type == "order" && _id == $_id][0] {
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
        orderNote,
        deliveryType
      }
    `;

	try {
		const order = await client.fetch(
			ORDER_BY_ID_QUERY,
			{ _id: id },
			{
				next: {
					revalidate: 300,
				},
			},
		);
		return order;
	} catch (error) {
		console.error("Error fetching order by ID:", error);
		return null;
	}
};
