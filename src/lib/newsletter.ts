// Shared by the newsletter popup, the footer form and the checkout checkbox.
// Safe to import from both client and server code.

export type NewsletterSource = "popup" | "footer" | "checkout";

export type NewsletterPayload = {
	fullName?: string;
	firstName?: string;
	lastName?: string;
	email: string;
	phone?: string;
	source: NewsletterSource;
	// Honeypot: a hidden field real visitors never fill in.
	company?: string;
};

export type NewsletterResult = {
	status: "subscribed" | "already_subscribed";
};

/** Set once someone subscribes from any form, so the popup never shows again. */
export const NEWSLETTER_SUBSCRIBED_KEY = "sartorial_newsletter_subscribed";

/**
 * Brevo only accepts phone numbers in international format (+2348012345678).
 * Nigerian local numbers (08012345678) are converted; anything else must
 * already carry a country code. Returns null when the number can't be used.
 */
export function normalisePhone(raw: string | undefined | null): string | null {
	if (!raw) return null;
	let phone = raw.replace(/[\s\-().]/g, "");
	if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
	if (/^0\d{10}$/.test(phone)) return `+234${phone.slice(1)}`;
	if (/^234\d{10}$/.test(phone)) return `+${phone}`;
	if (/^\+\d{8,15}$/.test(phone)) return phone;
	return null;
}

export function markNewsletterSubscribed() {
	try {
		window.localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, "true");
	} catch {
		// Storage can be blocked (private mode); the popup just shows again.
	}
}

export function isNewsletterSubscribed() {
	try {
		return window.localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY) === "true";
	} catch {
		return false;
	}
}

export async function subscribeToNewsletter(
	payload: NewsletterPayload,
): Promise<NewsletterResult> {
	const res = await fetch("/api/newsletter", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		// Lets the checkout request finish even if the page navigates away.
		keepalive: true,
	});

	const data = await res.json().catch(() => ({}));

	if (!res.ok) {
		throw new Error(data?.error || "Could not subscribe. Please try again.");
	}

	markNewsletterSubscribed();
	return data as NewsletterResult;
}
