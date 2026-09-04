import { createHash } from "crypto";

export const normalizeEmail = (raw: unknown) =>
	String(raw ?? "")
		.trim()
		.toLowerCase();

/**
 * Same trick as `orderDocIdForReference`: deriving the document ID from the
 * applicant's email makes the submit endpoint idempotent, so a duplicate
 * application is a 409 from Sanity rather than an extra read before every
 * write. Hashed rather than character-substituted because sanitising
 * `a.b@x.com` and `a-b@x.com` would collapse two different people onto one ID.
 */
export const creatorDocIdForEmail = (email: string) =>
	`creator-${createHash("sha256").update(normalizeEmail(email)).digest("hex").slice(0, 32)}`;
