"use client";
import { useMemo } from "react";
import { usePaystackPayment } from "react-paystack";

/**
 * Compact snapshot of the order, sent to Paystack as metadata. Paystack echoes
 * it back on the webhook and on transaction/verify, which is what lets the
 * server fulfil the order even if the customer's browser never comes back.
 * Keep this small — only fields the server needs to build the order.
 */
export interface PaystackOrderMetadata {
	email: string;
	customerName: string;
	firstName?: string;
	clerkUserId?: string | null;
	subtotal: number;
	shipping: number;
	vat: number;
	total: number;
	amountDiscount: number;
	couponCode?: string | null;
	orderNote?: string | null;
	shippingAddress: {
		address?: string;
		city?: string;
		state?: string;
		country?: string;
		postalCode?: string;
		phone?: string;
		secondaryPhone?: string;
	};
	interstateDeliveryType?: string | null;
	gigPark?: string | null;
	items: Array<{
		_id: string;
		name: string;
		price: number;
		quantity: number;
		isFreeGift: boolean;
		imageRef?: string | null;
		selectedColor?: { colorId: string; colorTitle: string } | null;
	}>;
}

export const generatePaystackReference = () =>
	`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const usePaystackCheckout = ({
	email,
	amount,
	reference,
	order,
	onSuccess,
	onClose,
}: {
	email: string;
	amount: number;
	reference: string;
	order: PaystackOrderMetadata;
	onSuccess: (ref: { reference: string }) => void;
	onClose: () => void;
}) => {
	const config = useMemo(
		() => ({
			reference,
			email,
			amount: Math.round(amount * 100),
			publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
			metadata: {
				order,
				custom_fields: [
					{
						display_name: "Customer Name",
						variable_name: "customer_name",
						value: order.customerName,
					},
					{
						display_name: "Phone Number",
						variable_name: "phone_number",
						value: order.shippingAddress?.phone || "",
					},
				],
			},
		}),
		[reference, email, amount, order],
	);

	const initializePayment = usePaystackPayment(config);

	const handlePayment = () => {
		initializePayment({ onSuccess, onClose });
	};

	return handlePayment;
};
