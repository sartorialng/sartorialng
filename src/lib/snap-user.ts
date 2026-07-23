/**
 * Snap Pixel user parameters (advanced matching).
 *
 * Snapchat matches browser events back to real Snapchat accounts using identity
 * signals sent alongside each event. Values are SHA-256 hashed inside Snap's SDK
 * before leaving the browser, so plaintext is passed here on purpose.
 *
 * Identity is captured wherever the shopper gives it to us (checkout form, Clerk)
 * and persisted, so later events on the same browser — including add-to-carts that
 * would otherwise look anonymous — still carry user parameters.
 */

const STORAGE_KEY = "snap_user_params";

export type SnapUserInput = {
	email?: string | null;
	phone?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	city?: string | null;
	state?: string | null;
	postalCode?: string | null;
	country?: string | null;
};

type StoredSnapUser = {
	user_email?: string;
	user_phone_number?: string;
	firstname?: string;
	lastname?: string;
	geo_city?: string;
	geo_region?: string;
	geo_postal_code?: string;
	geo_country?: string;
};

function normalizeEmail(email?: string | null): string | undefined {
	if (!email) return undefined;
	const value = email.trim().toLowerCase();
	return value.includes("@") ? value : undefined;
}

/**
 * Snap expects digits only, with country code and no symbols.
 * Local Nigerian formats (0801..., 801...) are promoted to 234.
 */
function normalizePhone(phone?: string | null): string | undefined {
	if (!phone) return undefined;
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 7) return undefined;

	if (digits.startsWith("234")) return digits;
	if (digits.startsWith("0")) return `234${digits.slice(1)}`;
	if (digits.length === 10 && digits.startsWith("8")) return `234${digits}`;
	return digits;
}

function normalizeName(name?: string | null): string | undefined {
	if (!name) return undefined;
	const value = name.trim().toLowerCase();
	return value || undefined;
}

function normalizeCountry(country?: string | null): string | undefined {
	if (!country) return undefined;
	const value = country.trim().toLowerCase();
	if (value === "nigeria") return "ng";
	// Already an ISO-3166 alpha-2 code.
	return value.length === 2 ? value : undefined;
}

function read(): StoredSnapUser {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as StoredSnapUser) : {};
	} catch {
		return {};
	}
}

/**
 * Merges newly seen identity into whatever we already know about this browser.
 * Partial input is fine — an email-only call keeps a previously captured phone.
 */
export function setSnapUser(input: SnapUserInput): StoredSnapUser {
	if (typeof window === "undefined") return {};

	const incoming: StoredSnapUser = {
		user_email: normalizeEmail(input.email),
		user_phone_number: normalizePhone(input.phone),
		firstname: normalizeName(input.firstName),
		lastname: normalizeName(input.lastName),
		geo_city: normalizeName(input.city),
		geo_region: normalizeName(input.state),
		geo_postal_code: input.postalCode?.trim() || undefined,
		geo_country: normalizeCountry(input.country),
	};

	const merged = { ...read() };
	for (const [key, value] of Object.entries(incoming)) {
		if (value) merged[key as keyof StoredSnapUser] = value;
	}

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
	} catch {
		// Storage unavailable (private mode / quota) — params still apply in-memory
		// for the current page via the returned value.
	}

	return merged;
}

/** User parameters for the current browser, safe to spread into any snaptr call. */
export function getSnapUserParams(): StoredSnapUser {
	return read();
}

/** True once we have at least one signal Snapchat can actually match on. */
export function hasSnapUserIdentity(): boolean {
	const params = read();
	return Boolean(params.user_email || params.user_phone_number);
}

export function clearSnapUser() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// no-op
	}
}
