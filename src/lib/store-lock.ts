import { NextResponse, type NextRequest } from "next/server";

/**
 * The pre-sale "waiting room". While the store is locked, every page shows
 * the sale countdown instead, and checkout APIs refuse new orders.
 *
 * SALE_LOCK (server-only):
 * - "auto": locked until NEXT_PUBLIC_SALE_START_DATE, then opens by itself.
 * - "on":   locked regardless of the date (for testing locally).
 * - unset:  never locked.
 *
 * SALE_PREVIEW_SECRET lets the team browse the real store while it is locked:
 * visit any page with ?preview=<secret> to get a cookie, ?preview=off to drop it.
 */
export const WAITING_ROOM_PATH = "/coming-soon";
const PREVIEW_PARAM = "preview";
const PREVIEW_COOKIE = "sartorial_preview";

// Read separately from src/lib/sale.ts, which is a client module.
const startTime = Date.parse(process.env.NEXT_PUBLIC_SALE_START_DATE ?? "");
const SALE_STARTS_AT = isNaN(startTime) ? null : startTime;

/** Pages that still work while locked, besides the waiting room itself. */
const OPEN_PAGES = ["/studio", "/privacy-policy"];

/** Endpoints that would start a new order or payment. */
const BLOCKED_APIS = ["/api/orders/create", "/api/paypal/create-order"];

function isStoreLocked(now = Date.now()) {
	const mode = process.env.SALE_LOCK;
	if (mode === "on") return true;
	if (mode === "auto") return SALE_STARTS_AT !== null && now < SALE_STARTS_AT;
	return false;
}

const matches = (pathname: string, paths: string[]) =>
	paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Runs in the proxy before anything else. Returns a response when the lock
 * decides what happens to this request, or undefined to carry on as normal.
 */
export function handleStoreLock(req: NextRequest): NextResponse | undefined {
	const { pathname, searchParams } = req.nextUrl;
	const locked = isStoreLocked();

	if (!locked) {
		// Nothing to wait for once the store is open.
		if (pathname === WAITING_ROOM_PATH) {
			return NextResponse.redirect(new URL("/", req.url));
		}
		return;
	}

	const secret = process.env.SALE_PREVIEW_SECRET;
	const preview = searchParams.get(PREVIEW_PARAM);
	if (preview !== null && !pathname.startsWith("/api")) {
		const url = req.nextUrl.clone();
		url.searchParams.delete(PREVIEW_PARAM);
		const res = NextResponse.redirect(url);
		if (secret && preview === secret) {
			res.cookies.set(PREVIEW_COOKIE, secret, {
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				path: "/",
				maxAge: 60 * 60 * 24 * 14,
			});
		} else {
			res.cookies.delete(PREVIEW_COOKIE);
		}
		return res;
	}
	if (secret && req.cookies.get(PREVIEW_COOKIE)?.value === secret) return;

	if (pathname.startsWith("/api")) {
		if (!matches(pathname, BLOCKED_APIS)) return;
		return NextResponse.json(
			{ error: "The store is closed until the sale starts." },
			// Not a 5xx: DigitalOcean swaps those for its own error page.
			{ status: 403 },
		);
	}

	if (matches(pathname, OPEN_PAGES)) return;

	// Rewrite rather than redirect: the visitor keeps the URL they came for,
	// so the reload at zero lands them on that page. This has to be a 200:
	// DigitalOcean replaces any 503 from the app with its own error page.
	// no-store keeps Cloudflare from serving the waiting room after opening.
	return NextResponse.rewrite(new URL(WAITING_ROOM_PATH, req.url), {
		headers: { "Cache-Control": "no-store" },
	});
}
