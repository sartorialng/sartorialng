import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField } from "sanity";
import { defineType } from "sanity";

const orderType = defineType({
	name: "order",
	title: "Order",
	type: "document",
	icon: BasketIcon,
	fields: [
		defineField({
			name: "orderNumber",
			title: "Order Number",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "paystackReference",
			title: "Paystack Transaction Reference",
			type: "string",
		}),
		defineField({
			name: "paypalOrderId",
			title: "PayPal Order ID",
			type: "string",
		}),
		defineField({
			name: "clerkUserId",
			title: "Store User ID",
			type: "string",
		}),
		defineField({
			name: "customerName",
			title: "Customer Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "email",
			title: "Customer Email",
			type: "string",
			validation: (Rule) => Rule.required().email(),
		}),
		defineField({
			name: "products",
			title: "Products",
			type: "array",
			of: [
				defineArrayMember({
					type: "object",
					fields: [
						defineField({
							name: "product",
							title: "Product Bought",
							type: "reference",
							to: [{ type: "product" }],
						}),
						defineField({
							name: "quantity",
							title: "Quantity Purchased",
							type: "number",
						}),
						defineField({
							name: "selectedColor",
							title: "Selected Color",
							type: "object",
							fields: [
								{
									name: "colorId",
									title: "Color ID",
									type: "string",
								},
								{
									name: "colorTitle",
									title: "Color Name",
									type: "string",
								},
							],
						}),
					],
					preview: {
						select: {
							product: "product.name",
							quantity: "quantity",
							colorTitle: "selectedColor.colorTitle",
							image: "product.image",
							price: "product.price",
							currency: "product.currency",
						},
						prepare(select) {
							return {
								title: `${select.product} x ${select.quantity}${select.colorTitle ? ` - ${select.colorTitle}` : ""}`,
								subtitle: `${select.price * select.quantity}`,
								media: select.image,
							};
						},
					},
				}),
			],
		}),
		defineField({
			name: "totalPrice",
			title: "Total Price",
			type: "number",
			validation: (Rule) => Rule.required().min(0),
		}),
		defineField({
			name: "currency",
			title: "Currency",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "amountDiscount",
			title: "Amount Discount",
			type: "number",
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "status",
			title: "Order Status",
			type: "string",
			options: {
				list: [
					{ title: "Pending", value: "pending" },
					{ title: "Paid", value: "paid" },
					{ title: "Shipped", value: "shipped" },
					{ title: "Delivered", value: "delivered" },
					{ title: "Cancelled", value: "cancelled" },
				],
			},
		}),
		defineField({
			name: "shippingAddress",
			title: "Shipping Address",
			type: "object",
			fields: [
				{ name: "address", title: "Street Address", type: "string" },
				{ name: "city", title: "City/Area", type: "string" },
				{ name: "state", title: "State", type: "string" },
				{ name: "country", title: "Country", type: "string" },
				{ name: "postalCode", title: "Postal Code", type: "string" },
				{ name: "phone", title: "Phone Number", type: "string" },
				{
					name: "secondaryPhone",
					title: "Secondary Phone Number",
					type: "string",
				},
			],
		}),
		defineField({
			name: "paymentMethod",
			title: "Payment Method",
			type: "string",
			options: {
				list: [
					{ title: "Paystack", value: "paystack" },
					{ title: "PayPal", value: "paypal" },
				],
			},
		}),
		defineField({
			name: "shippingCost",
			title: "Shipping Cost",
			type: "number",
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "vat",
			title: "VAT",
			type: "number",
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "subtotal",
			title: "Subtotal",
			type: "number",
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "orderDate",
			title: "Order Date",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "orderNote",
			title: "Order Note",
			type: "string",
		}),
		defineField({
			name: "deliveryType",
			title: "Delivery Type (Inter-State)",
			type: "string",
			options: {
				list: [
					{ title: "Pickup", value: "pickup" },
					{ title: "Doorstep Delivery", value: "doorstep" },
				],
			},
		}),
	],
	preview: {
		select: {
			name: "customerName",
			amount: "totalPrice",
			currency: "currency",
			orderId: "orderNumber",
			email: "email",
		},
		prepare(select) {
			const orderIdSnippet = `${select.orderId.slice(0, 5)}...${select.orderId.slice(-5)}`;
			return {
				title: `${select.name} (${orderIdSnippet})`,
				subtitle: `${select.amount} ${select.currency}, ${select.email}`,
				media: BasketIcon,
			};
		},
	},
});

export default orderType;
