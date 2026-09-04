/**
 * Sanity answers a `create()` against an existing `_id` with a 409. Flows that
 * derive their document ID deterministically use that as their idempotency
 * signal, so they need to tell a conflict apart from a real failure.
 */
export const isConflict = (error: unknown) => {
	const err = error as { statusCode?: number; message?: string };
	return (
		err?.statusCode === 409 ||
		/already exists|document already exists|conflict/i.test(err?.message || "")
	);
};
