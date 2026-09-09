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

/** Snap requires a UUID for sc_click_id (its validator warns on anything else). */
const isUuid = (value?: string | null): value is string =>
	typeof value === "string" &&
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * The Pixel SDK used to set _scid as a UUID; today it is a 32-character
 * base64url-style token (e.g. "WW7v37_zuv1SXuKUBc2dhjNzq2dDbsqn"). Snap's
 * validator accepts both without warning. A UUID-only check here silently
 * dropped sc_cookie1 from every production event, so this only rejects
 * values that cannot be a cookie at all.
 */
const isScid = (value?: string | null): value is string =>
	typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);

const hashName = (name?: string | null) => {
	if (!name) return undefined;
	const value = name.trim().toLowerCase();
	return value ? sha256(value) : undefined;
};

/**
 * City and state, hashed the way Snap documents: lower case with punctuation
 * and spaces removed, so "Victoria Island" and "victoria island" agree.
 */
const hashPlace = (place?: string | null) => {
	if (!place) return undefined;
	const value = place.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
	return value ? sha256(value) : undefined;
};

/**
 * Nigerian codes are five or six digits and pass through unchanged. A US
 * ZIP+4 is cut to the first five digits, which is the form Snap asks for.
 */
const hashZip = (zip?: string | null) => {
	if (!zip) return undefined;
	const value = zip.trim().toLowerCase().replace(/\s+/g, "");
	if (!value) return undefined;
	const zipPlusFour = value.match(/^(\d{5})-?\d{4}$/);
	return sha256(zipPlusFour ? zipPlusFour[1] : value);
};

/**
 * Snap wants an ISO 3166 alpha-2 code, but the checkout stores the display
 * name the shopper picked. Every entry in COUNTRIES (src/data/shipping.ts) is
 * mapped here; a country missing from this map is dropped rather than sent as
 * a name Snap cannot read.
 */
const COUNTRY_CODES: Record<string, string> = {
	nigeria: "ng",
	ghana: "gh",
	kenya: "ke",
	"south africa": "za",
	uganda: "ug",
	tanzania: "tz",
	rwanda: "rw",
	senegal: "sn",
	"cote d'ivoire": "ci",
	cameroon: "cm",
	"united states": "us",
	canada: "ca",
	"united kingdom": "gb",
	ireland: "ie",
	france: "fr",
	germany: "de",
	netherlands: "nl",
	belgium: "be",
	italy: "it",
	spain: "es",
	portugal: "pt",
	sweden: "se",
	norway: "no",
	switzerland: "ch",
	austria: "at",
	denmark: "dk",
	finland: "fi",
	"united arab emirates": "ae",
	"saudi arabia": "sa",
	qatar: "qa",
	kuwait: "kw",
	india: "in",
	pakistan: "pk",
	bangladesh: "bd",
	"sri lanka": "lk",
	china: "cn",
	japan: "jp",
	"south korea": "kr",
	australia: "au",
	"new zealand": "nz",
	brazil: "br",
	argentina: "ar",
	mexico: "mx",
	colombia: "co",
	egypt: "eg",
	morocco: "ma",
	tunisia: "tn",
	algeria: "dz",
	israel: "il",
	turkey: "tr",
};

const hashCountry = (country?: string | null) => {
	if (!country) return undefined;
	// The list uses a curly apostrophe in "Côte d'Ivoire"; accents and both
	// apostrophe forms are folded so the lookup key is stable either way.
	const key = country
		.trim()
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/\s+/g, " ");
	if (!key) return undefined;

	const code = COUNTRY_CODES[key] ?? (/^[a-z]{2}$/.test(key) ? key : undefined);
	return code ? sha256(code) : undefined;
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
		// Location signals. Snap grades "first name, surname and postcode"
		// coverage as one figure, so fn and ln alone scored 0% while zp was
		// missing. Postcode is optional at checkout and most Nigerian shoppers
		// leave it blank, but city, state and country are captured on nearly
		// every order and are match signals in their own right.
		ct: [hashPlace(input.shippingAddress?.city)].filter(Boolean),
		st: [hashPlace(input.shippingAddress?.state)].filter(Boolean),
		zp: [hashZip(input.shippingAddress?.postalCode)].filter(Boolean),
		country: [hashCountry(input.shippingAddress?.country)].filter(Boolean),
		// The _scid cookie is Snap's strongest match signal. Captured in the
		// browser at checkout and carried through Paystack metadata, because the
		// webhook has no access to the shopper's cookies.
		...(isScid(input.snapScid) ? { sc_cookie1: input.snapScid } : {}),
		// IP and user agent must be the shopper's, never the request's: on the
		// webhook path the request comes from Paystack. The browser callback
		// reads them off its own headers; the checkout puts the same values into
		// the Paystack metadata for the webhook. Snap grades Purchase events on
		// IP coverage and was scoring us 0% while this was omitted.
		...(input.snapClientIp ? { client_ip_address: input.snapClientIp } : {}),
		...(input.snapUserAgent ? { client_user_agent: input.snapUserAgent } : {}),
		// The ScCid from the ad's landing URL — ties the purchase to the swipe-up.
		// Snap warns on anything that is not a UUID here, so a stray value from
		// a hand-typed URL is dropped rather than sent.
		...(isUuid(input.snapClickId) ? { sc_click_id: input.snapClickId } : {}),
	};

	// Drop empty arrays so we never send `"em": []`.
	for (const key of ["em", "ph", "fn", "ln", "ct", "st", "zp", "country"]) {
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
		// Set SNAPCHAT_TEST_EVENT_CODE to the code shown under Events Manager →
		// Test events and Snap routes these there instead of live reporting.
		// Leave it unset in production.
		...(process.env.SNAPCHAT_TEST_EVENT_CODE
			? { test_event_code: process.env.SNAPCHAT_TEST_EVENT_CODE }
			: {}),
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

	const rawBody = await response.text().catch(() => "");
	if (!response.ok) {
		throw new Error(`Snap CAPI responded ${response.status}: ${rawBody.slice(0, 300)}`);
	}

	// Snap answers 200 even when it rejects the batch; the verdict is in the
	// body ({ status: "VALID" | "INVALID", reason }). Treat anything but VALID
	// as a failure so the send-once claim is released and a retry can re-send.
	let verdict: { status?: string; reason?: string } = {};
	try {
		verdict = JSON.parse(rawBody);
	} catch {
		// Non-JSON 200 — assume accepted rather than re-send forever.
	}
	if (verdict.status && verdict.status !== "VALID") {
		throw new Error(
			`Snap CAPI rejected the event: ${verdict.status} ${verdict.reason ?? ""}`.trim(),
		);
	}

	// Positive confirmation, so "no errors" is never the only evidence we have.
	// The signal summary makes a thin event (no IP, no cookie) visible in logs.
	console.log(
		"✅ Snap Conversions API purchase sent for order:",
		orderNumber,
		"| dedup event_id:",
		input.paymentReference,
		"| signals:",
		Object.keys(userData).join(","),
	);
}
