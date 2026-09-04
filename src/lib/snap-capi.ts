import crypto from "crypto";
import type { OrderInput } from "./orders/types";

/**
 * Snap Conversions API (v3) — the server half of our purchase tracking.
 *
 * The browser Pixel already fires PURCHASE, but ad blockers and iOS drop a large
 * share of those. Sending the same conversion server-to-server recovers them.
 * Snap collapses the pair into one conversion when the Pixel's `client_dedup_id`
 * and this request's `event_id` are byte-for-byte identical — both are the order
 * number. See snapPurchase() in lib/snap-events.ts for the browser side.
 *
 * Server-only: reads SNAPCHAT_CAPI_TOKEN, which must never carry a NEXT_PUBLIC_
 * prefix or Next.js would inline it into the client bundle.
 */

const SNAP_PIXEL_ID =
	process.env.SNAPCHAT_PIXEL_ID ?? "31bfe258-9f77-46a0-b0d0-c1a3f9fdd715";

const sha256 = (value: string) =>
	crypto.createHash("sha256").update(value).digest("hex");

const hashEmail = (email?: string | null) => {
	if (!email) return undefined;
	const value = email.trim().toLowerCase();
	return value.includes("@") ? sha256(value) : undefined;
};

/** Snap expects digits only with a country code; local NG formats are promoted. */
const hashPhone = (phone?: string | null) => {
	if (!phone) return undefined;
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 7) return undefined;

	let e164 = digits;
	if (digits.startsWith("0")) e164 = `234${digits.slice(1)}`;
	else if (digits.length === 10 && digits.startsWith("8")) e164 = `234${digits}`;

	return sha256(e164);
};

/**
 * Checked before the send-once claim is taken, so an unconfigured environment
 * never burns the claim and mark an order as reported when nothing was sent.
 */
export const isSnapCapiConfigured = () =>
	Boolean(process.env.SNAPCHAT_CAPI_TOKEN);

/** Snap accepts sc_cookie1 only as a UUID (or a SHA-256 hash). */
const isUuid = (value?: string | null): value is string =>
	typeof value === "string" &&
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const hashName = (name?: string | null) => {
	if (!name) return undefined;
	const value = name.trim().toLowerCase();
	return value ? sha256(value) : undefined;
};

/**
 * Sends one PURCHASE to Snap. Throws on failure so the caller can release its
 * send-once claim and let a later retry try again.
 */
export async function sendSnapPurchaseEvent(
	input: OrderInput,
	orderNumber: string,
): Promise<void> {
	const token = process.env.SNAPCHAT_CAPI_TOKEN;
	if (!token) {
		// Not an error worth failing an order over, but it must never be silent:
		// a missing token and a successful send both used to log nothing, which
		// made "no errors in the logs" impossible to interpret.
		console.warn(
			"⚠️ SNAPCHAT_CAPI_TOKEN is not set — skipping Snap purchase event for order:",
			orderNumber,
		);
		return;
	}

	const [firstName, ...restName] = (input.customerName || "").trim().split(/\s+/);
	const lastName = restName.join(" ");

	const userData: Record<string, unknown> = {
		em: [hashEmail(input.emailAddress)].filter(Boolean),
		ph: [hashPhone(input.shippingAddress?.phone)].filter(Boolean),
		fn: [hashName(input.firstName ?? firstName)].filter(Boolean),
		ln: [hashName(lastName)].filter(Boolean),
		// The _scid cookie is Snap's strongest match signal. Captured in the
		// browser at checkout and carried through Paystack metadata, because the
		// webhook has no access to the shopper's cookies. Snap rejects anything
		// that is not a UUID here, so a mangled cookie is dropped rather than sent.
		...(isUuid(input.snapScid) ? { sc_cookie1: input.snapScid } : {}),
		// Deliberately no client_ip_address: on the webhook path the request comes
		// from Paystack, so the IP we can see is theirs, not the shopper's, and a
		// wrong IP degrades matching rather than helping it.
		...(input.snapUserAgent ? { client_user_agent: input.snapUserAgent } : {}),
	};

	// Drop empty arrays so we never send `"em": []`.
	for (const key of ["em", "ph", "fn", "ln"]) {
		const value = userData[key];
		if (Array.isArray(value) && value.length === 0) delete userData[key];
	}

	const eventTime = input.orderDate
		? Math.floor(new Date(input.orderDate).getTime() / 1000)
		: Math.floor(Date.now() / 1000);

	const payload = {
		data: [
			{
				event_name: "PURCHASE",
				event_time: eventTime,
				// Must equal the Pixel's client_dedup_id for this order. The payment
				// reference is used rather than the order number because the browser
				// may not know the order number yet when it fires its PURCHASE.
				event_id: input.paymentReference,
				action_source: "WEB",
				...(process.env.NEXT_PUBLIC_SITE_URL
					? { event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success` }
					: {}),
				user_data: userData,
				custom_data: {
					currency: input.paymentMethod === "paypal" ? "USD" : "NGN",
					value: String(input.total),
					order_id: orderNumber,
					content_ids: input.items.map((item) => item._id),
					num_items: input.items.reduce((sum, item) => sum + item.quantity, 0),
				},
			},
		],
	};

	const response = await fetch(
		`https://tr.snapchat.com/v3/${SNAP_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			// Never let a slow tracking call hold up order fulfilment.
			signal: AbortSignal.timeout(8000),
		},
	);

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`Snap CAPI responded ${response.status}: ${body.slice(0, 300)}`);
	}

	// Positive confirmation, so "no errors" is never the only evidence we have.
	console.log(
		"✅ Snap Conversions API purchase sent for order:",
		orderNumber,
		"| dedup event_id:",
		input.paymentReference,
	);
}
