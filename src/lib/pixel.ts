export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID!;

declare global {
	interface Window {
		fbq: (...args: unknown[]) => void;
	}
}

export const pageview = () => {
	window.fbq("track", "PageView");
};

export const viewContent = (product: {
	id: string;
	name: string;
	price: number;
	currency?: string;
}) => {
	window.fbq("track", "ViewContent", {
		content_ids: [product.id],
		content_name: product.name,
		content_type: "product",
		value: product.price,
		currency: product.currency ?? "NGN",
	});
};

export const addToCart = (product: {
	id: string;
	name: string;
	price: number;
	quantity: number;
	currency?: string;
}) => {
	window.fbq("track", "AddToCart", {
		content_ids: [product.id],
		content_name: product.name,
		content_type: "product",
		value: product.price * product.quantity,
		currency: product.currency ?? "NGN",
		num_items: product.quantity,
	});
};

export const initiateCheckout = (cartTotal: number, itemCount: number) => {
	window.fbq("track", "InitiateCheckout", {
		value: cartTotal,
		currency: "NGN",
		num_items: itemCount,
	});
};

export const purchase = (order: {
	orderId: string;
	total: number;
	items: { id: string; quantity: number; price: number }[];
	currency?: string;
}) => {
	window.fbq("track", "Purchase", {
		transaction_id: order.orderId,
		value: order.total,
		currency: order.currency ?? "NGN",
		content_type: "product",
		content_ids: order.items.map((i) => i.id),
		num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
	});
};
