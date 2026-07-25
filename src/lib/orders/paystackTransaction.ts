import type { OrderInput, OrderLineInput } from "./types";

export interface PaystackTransaction {
	status: string;
	reference: string;
	amount: number;
	paid_at?: string;
	customer?: { email?: string; customer_code?: string; id?: number };
	metadata?: any;
}

/**
 * Asks Paystack directly whether this reference was actually paid. Everything
 * that writes a `paid` order goes through here first — without it the create
 * endpoint would mint paid orders for any reference a caller invents.
 */
export const verifyPaystackTransaction = async (
	reference: string,
): Promise<PaystackTransaction> => {
	const res = await fetch(
		`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
			},
			cache: "no-store",
		},
	);

	const body = await res.json();

	if (!res.ok || !body?.status) {
		throw new Error(
			`Paystack verification failed for ${reference}: ${body?.message || res.status}`,
		);
	}

	return body.data as PaystackTransaction;
};

const toNumber = (value: unknown) => {
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
};

const normaliseItems = (rawItems: any[]): OrderLineInput[] =>
	(rawItems || [])
		.filter((item) => item && item._id)
		.map((item) => ({
			_id: item._id,
			name: item.name || "Item",
			price: toNumber(item.price),
			quantity: toNumber(item.quantity) || 1,
			isFreeGift: item.isFreeGift === true,
			imageRef: item.imageRef || item.image?.asset?._ref || null,
			selectedColor: item.selectedColor
				? {
						colorId: item.selectedColor.colorId,
						colorTitle: item.selectedColor.colorTitle,
					}
				: null,
		}));

/**
 * Rebuilds the order payload from a Paystack transaction, so the webhook and
 * the verify endpoint can fulfil an order without the browser ever coming back.
 *
 * Handles both the current compact `metadata.order` shape and the older
 * `metadata.formData` + `metadata.items` shape, so transactions started before
 * a deploy still fulfil correctly.
 */
export const orderInputFromPaystackTransaction = (
	tx: PaystackTransaction,
): OrderInput | null => {
	const metadata = tx.metadata || {};
	const email = metadata.order?.email || tx.customer?.email;

	if (metadata.order) {
		const order = metadata.order;
		const items = normaliseItems(order.items);
		if (!items.length || !email) return null;

		return {
			paymentReference: tx.reference,
			paymentMethod: "paystack",
			emailAddress: email,
			customerName: order.customerName || email,
			firstName: order.firstName || null,
			clerkUserId: order.clerkUserId || null,
			items,
			subtotal: toNumber(order.subtotal),
			shipping: toNumber(order.shipping),
			vat: toNumber(order.vat),
			total: toNumber(order.total) || tx.amount / 100,
			amountDiscount: toNumber(order.amountDiscount),
			couponCode: order.couponCode || null,
			orderNote: order.orderNote || null,
			shippingAddress: order.shippingAddress || {},
			interstateDeliveryType: order.interstateDeliveryType || null,
			gigPark: order.gigPark || null,
			orderDate: tx.paid_at || null,
		};
	}

	// Legacy shape.
	const formData = metadata.formData;
	const items = normaliseItems(metadata.items);
	if (!formData || !items.length || !email) return null;

	const useShipping = formData.shipToDifferentAddress;

	return {
		paymentReference: tx.reference,
		paymentMethod: "paystack",
		emailAddress: email,
		customerName:
			formData.clerkUserName ||
			`${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
			email,
		firstName: formData.firstName || null,
		clerkUserId: formData.clerkUserId || null,
		items,
		subtotal: toNumber(formData.subtotal),
		shipping: toNumber(formData.shippingCost),
		vat: toNumber(formData.vat),
		total: toNumber(formData.total) || tx.amount / 100,
		amountDiscount: toNumber(formData.amountDiscount),
		couponCode: formData.couponCode || null,
		orderNote: formData.orderNote || null,
		shippingAddress: {
			address: useShipping ? formData.shippingAddress : formData.address,
			city: useShipping ? formData.shippingArea : formData.area,
			state: useShipping ? formData.shippingState : formData.state,
			country: useShipping ? formData.shippingCountry : formData.country,
			postalCode: useShipping
				? formData.shippingPostalCode
				: formData.postalCode,
			phone: useShipping ? formData.shippingPhoneNo : formData.phoneNo,
			secondaryPhone: useShipping
				? formData.shippingSecondaryPhoneNo
				: formData.secondaryPhoneNo,
		},
		interstateDeliveryType: formData.interstateDeliveryType || null,
		gigPark: useShipping ? formData.shippingGigPark : formData.gigPark,
		orderDate: tx.paid_at || null,
	};
};
