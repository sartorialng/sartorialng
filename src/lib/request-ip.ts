/**
 * The caller's public IP as the edge saw it. On Vercel `x-forwarded-for` is
 * written by the platform (a caller cannot spoof it) and its first entry is
 * the client; `x-real-ip` carries the same value. `next dev` sets neither,
 * so this returns null locally rather than a loopback address.
 */
export function clientIpFromRequest(req: Request): string | null {
	const forwarded = req.headers.get("x-forwarded-for");
	const first = forwarded?.split(",")[0]?.trim();
	const ip = first || req.headers.get("x-real-ip")?.trim() || null;
	if (!ip) return null;

	// Loopback, private and link-local ranges are dev/proxy artefacts, not a
	// shopper's address; sending them to Snap would only hurt matching.
	const isPrivate =
		/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ||
		/^(::1$|::ffff:127\.|f[cd][0-9a-f]{2}:|fe80:)/i.test(ip);

	return isPrivate ? null : ip;
}
