declare global {
	interface Window {
		snaptr: (...args: unknown[]) => void;
	}
}

function getSnapUuid(): string | undefined {
	if (typeof document === "undefined") return undefined;
	const match = document.cookie.match(/_scid=([^;]+)/);
	return match ? decodeURIComponent(match[1]) : undefined;
}

function fireSnap(event: string, params?: Record<string, unknown>) {
	if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
	window.snaptr("track", event, {
		uuid_c1: getSnapUuid(),
		...params,
	});
}

export function snapViewContent(params: {
	item_ids: string[];
	item_name?: string;
	price?: number;
	currency?: string;
}) {
	fireSnap("VIEW_CONTENT", {
		item_ids: params.item_ids,
		item_name: params.item_name,
		price: params.price,
		currency: params.currency ?? "NGN",
	});
}

export function snapAddToCart(params: {
	item_ids: string[];
	item_name?: string;
	price?: number;
	currency?: string;
	number_items?: number;
}) {
	fireSnap("ADD_CART", {
		item_ids: params.item_ids,
		item_name: params.item_name,
		price: params.price,
		currency: params.currency ?? "NGN",
		number_items: params.number_items ?? 1,
	});
}

export function snapInitiateCheckout(params: {
	price?: number;
	currency?: string;
	number_items?: number;
}) {
	fireSnap("START_CHECKOUT", {
		price: params.price,
		currency: params.currency ?? "NGN",
		number_items: params.number_items,
	});
}

export function snapPurchase(params: {
	transaction_id: string;
	item_ids: string[];
	price: number;
	currency?: string;
	number_items?: number;
}) {
	fireSnap("PURCHASE", {
		transaction_id: params.transaction_id,
		item_ids: params.item_ids,
		price: params.price,
		currency: params.currency ?? "NGN",
		number_items: params.number_items,
	});
}
