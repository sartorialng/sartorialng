export interface OrderLineInput {
	_id: string;
	name: string;
	price: number;
	quantity: number;
	isFreeGift?: boolean;
	imageRef?: string | null;
	selectedColor?: { colorId: string; colorTitle: string } | null;
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
	vat: number;
	total: number;
	amountDiscount?: number;
	couponCode?: string | null;
	orderNote?: string | null;
	shippingAddress: OrderShippingAddress;
	interstateDeliveryType?: "pickup" | "doorstep" | null;
	gigPark?: string | null;
	/** Falls back to now. The webhook passes Paystack's `paid_at`. */
	orderDate?: string | null;
}

export interface FulfillResult {
	success: boolean;
	alreadyFulfilled: boolean;
	order: { _id: string; orderNumber: string };
}
