import { getSnapUserParams } from "./snap-user";

declare global {
	interface Window {
		snaptr: (...args: unknown[]) => void;
	}
}

/** Snap's first-party cookie, set by the Pixel SDK on this domain. */
export function getSnapScid(): string | undefined {
	if (typeof document === "undefined") return undefined;
	const match = document.cookie.match(/_scid=([^;]+)/);
	return match ? decodeURIComponent(match[1]) : undefined;
}

const CLICK_ID_KEY = "snap_click_id";
/** Snap attributes a swipe-up for up to 28 days, so keep the id that long. */
const CLICK_ID_TTL_MS = 28 * 24 * 60 * 60 * 1000;

/**
 * A shopper arriving from a Snap ad lands with `?ScCid=…`. The Pixel SDK
 * picks it up for its own events, but the server-side purchase can only carry
 * it if we remember it ourselves.
 */
export function rememberSnapClickId(clickId: string | null | undefined) {
	if (!clickId || typeof window === "undefined") return;
	try {
		window.localStorage.setItem(
			CLICK_ID_KEY,
			JSON.stringify({ id: clickId, at: Date.now() }),
		);
	} catch {
		// Storage unavailable — the click id just won't survive this page.
	}
}

export function getSnapClickId(): string | undefined {
	if (typeof window === "undefined") return undefined;
	try {
		const raw = window.localStorage.getItem(CLICK_ID_KEY);
		if (!raw) return undefined;
		const { id, at } = JSON.parse(raw) as { id?: string; at?: number };
		if (!id || !at || Date.now() - at > CLICK_ID_TTL_MS) return undefined;
		return id;
	} catch {
		return undefined;
	}
}

/**
 * A per-event id Snap uses to deduplicate a browser event against the matching
 * server (Conversions API) event. For events with no natural key (page views,
 * add-to-carts) a random id gives Snap the dedup-ID coverage it grades on; for
 * conversions we pass the order number so the pair actually collapses to one.
 */
export function snapDedupId(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fireSnap(event: string, params?: Record<string, unknown>) {
	if (typeof window === "undefined" || typeof window.snaptr !== "function") return;
	window.snaptr("track", event, {
		uuid_c1: getSnapScid(),
		client_dedup_id: snapDedupId(),
		...getSnapUserParams(),
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

export function snapSignUp(params?: { sign_up_method?: string }) {
	fireSnap("SIGN_UP", {
		sign_up_method: params?.sign_up_method,
	});
}

export function snapPurchase(params: {
	transaction_id: string;
	/**
	 * Must be byte-for-byte identical to the `event_id` the server sends for this
	 * order, or Snap counts the conversion twice. Pass the *payment reference*,
	 * not the order number: the order number can still be undefined here when the
	 * order write is slow, whereas both sides always agree on the reference.
	 */
	dedup_id: string;
	item_ids: string[];
	price: number;
	currency?: string;
	number_items?: number;
}) {
	fireSnap("PURCHASE", {
		transaction_id: params.transaction_id,
		client_dedup_id: params.dedup_id,
		item_ids: params.item_ids,
		price: params.price,
		currency: params.currency ?? "NGN",
		number_items: params.number_items,
	});
}
