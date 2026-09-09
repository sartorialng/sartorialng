/**
 * The caller's public IP as the edge saw it.
 *
 * `x-real-ip` is read first because Vercel overwrites it with the address it
 * actually accepted the connection from — a value the caller cannot influence.
 * `x-forwarded-for` is NOT safe to trust: it is passed through from the
 * request, so its leading entry is whatever the caller put there. That was
 * verified against production, where a request carrying
 * `x-forwarded-for: 8.8.8.8` was reported as 8.8.8.8 while a forged
 * `x-real-ip` was replaced by the true address.
 *
 * It still falls back to `x-forwarded-for` for environments that set only
 * that. `next dev` sets neither, so this returns null locally rather than a
 * loopback address.
 */
export function clientIpFromRequest(req: Request): string | null {
	const realIp = req.headers.get("x-real-ip")?.trim();
	const forwarded = req.headers.get("x-forwarded-for");
	const first = forwarded?.split(",")[0]?.trim();
	const ip = realIp || first || null;
	if (!ip) return null;

	// Loopback, private and link-local ranges are dev/proxy artefacts, not a
	// shopper's address; sending them to Snap would only hurt matching.
	const isPrivate =
		/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ||
		/^(::1$|::ffff:127\.|f[cd][0-9a-f]{2}:|fe80:)/i.test(ip);

	return isPrivate ? null : ip;
}
