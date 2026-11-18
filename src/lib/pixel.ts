export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID!;

declare global {
	interface Window {
		fbq: (...args: unknown[]) => void;
	}
}

/**
 * The base code loads `afterInteractive`, so an event fired from a mount effect
 * can run before `window.fbq` exists. Wait for it briefly rather than throw or
 * drop the event; give up after ~10s (pixel blocked by an ad blocker, etc.).
 *
 * `eventId` is sent as Meta's `eventID`, so a future Conversions API event with
 * the same id is deduplicated against this browser one.
 */
function track(
	event: string,
	params: Record<string, unknown>,
	eventId?: string,
) {
	if (typeof window === "undefined" || !FB_PIXEL_ID) return;

	const send = () => {
		try {
			if (eventId) {
				window.fbq("track", event, params, { eventID: eventId });
			} else {
				window.fbq("track", event, params);
			}
		} catch {
			// Tracking only — never let it break the page.
		}
	};

	if (typeof window.fbq === "function") {
		send();
		return;
	}

	let attempts = 0;
	const interval = setInterval(() => {
		if (typeof window.fbq === "function") {
			clearInterval(interval);
			send();
		} else if (++attempts >= 20) {
			clearInterval(interval);
		}
	}, 500);
}

export const viewContent = (product: {
	id: string;
	name: string;
	price: number;
	currency?: string;
}) => {
	track("ViewContent", {
		content_ids: [product.id],
		content_name: product.name,
		content_type: "product",
		value: product.price,
		currency: product.currency ?? "NGN",
	});
};

/** `price` is the unit price; the event value is price × quantity. */
export const addToCart = (product: {
	id: string;
	name: string;
	price: number;
	quantity: number;
	currency?: string;
}) => {
	track("AddToCart", {
		content_ids: [product.id],
		content_name: product.name,
		content_type: "product",
		contents: [{ id: product.id, quantity: product.quantity }],
		value: product.price * product.quantity,
		currency: product.currency ?? "NGN",
		num_items: product.quantity,
	});
};

export const initiateCheckout = (checkout: {
	value: number;
	contentIds: string[];
	numItems: number;
	currency?: string;
}) => {
	track("InitiateCheckout", {
		content_ids: checkout.contentIds,
		content_type: "product",
		value: checkout.value,
		currency: checkout.currency ?? "NGN",
		num_items: checkout.numItems,
	});
};

export const purchase = (order: {
	orderId: string;
	/** Payment reference — reused as the dedup id for a future server event. */
	eventId: string;
	total: number;
	items: { id: string; quantity: number; price: number }[];
	currency?: string;
}) => {
	track(
		"Purchase",
		{
			order_id: order.orderId,
			value: order.total,
			currency: order.currency ?? "NGN",
			content_type: "product",
			content_ids: order.items.map((i) => i.id),
			contents: order.items.map((i) => ({
				id: i.id,
				quantity: i.quantity,
				item_price: i.price,
			})),
			num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
		},
		order.eventId,
	);
};
