export interface OrderComponentInput {
	productId: string;
	name: string;
	colorId: string;
	colorTitle: string;
	quantity: number;
}

export interface OrderLineInput {
	_id: string;
	name: string;
	price: number;
	quantity: number;
	isFreeGift?: boolean;
	imageRef?: string | null;
	selectedColor?: { colorId: string; colorTitle: string } | null;
	/** Set on combo lines: which bag was bought in which colour. Stock comes
	 *  off these rather than the combo, and a cancellation puts it back to
	 *  them, so this is what makes a combo fulfil correctly. */
	components?: OrderComponentInput[] | null;
}

export interface OrderShippingAddress {
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	phone?: string;
	secondaryPhone?: string;
}

/**
 * The normalised shape every fulfilment path funnels into. The browser builds
 * one of these from the checkout form; the webhook and the verify endpoint
 * rebuild one from the Paystack transaction. Whichever arrives first wins.
 */
export interface OrderInput {
	paymentReference: string;
	paymentMethod: "paystack" | "paypal";
	emailAddress: string;
	customerName: string;
	firstName?: string | null;
	clerkUserId?: string | null;
	items: OrderLineInput[];
	subtotal: number;
	shipping: number;
	/** Legacy — VAT is folded into product prices, so new orders omit this.
	 *  Still carried for checkouts started before that change. */
	vat?: number;
	total: number;
	amountDiscount?: number;
	couponCode?: string | null;
	orderNote?: string | null;
	shippingAddress: OrderShippingAddress;
	interstateDeliveryType?: "pickup" | "doorstep" | null;
	gigPark?: string | null;
	/** Falls back to now. The webhook passes Paystack's `paid_at`. */
	orderDate?: string | null;
	/** Snap _scid cookie + UA, captured in the browser at checkout so the
	 *  server-side Conversions API event can still match the shopper. */
	snapScid?: string | null;
	snapUserAgent?: string | null;
	/** The shopper's public IP. The browser callback reads it off its own
	 *  request headers; the webhook gets it from Paystack metadata, where the
	 *  checkout put it after asking /api/snap/client. */
	snapClientIp?: string | null;
	/** Snap's `ScCid` landing-page parameter, kept for 28 days after an ad
	 *  swipe-up so the purchase can be attributed to the click. */
	snapClickId?: string | null;
}

export interface FulfillResult {
	success: boolean;
	alreadyFulfilled: boolean;
	order: { _id: string; orderNumber: string };
}
