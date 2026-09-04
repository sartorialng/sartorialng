import { Resend } from "resend";

/**
 * One Resend client for the whole app. Every route used to construct its own,
 * which is harmless but means there is no single place to add retries or
 * logging — this module is that place.
 *
 * Built lazily because the constructor throws when `RESEND_API_KEY` is unset:
 * at module scope that turns a missing env var into an import-time crash for
 * every route that sends mail, and makes the templates impossible to render
 * offline.
 */
let client: Resend | null = null;
const getResend = () => (client ??= new Resend(process.env.RESEND_API_KEY));

type SendOptions = Parameters<Resend["emails"]["send"]>[0];

export type SendEmailResult =
	| { ok: true; id?: string }
	| { ok: false; error: unknown };

/**
 * Resend reports most failures by *returning* `{ error }` rather than throwing:
 * rate limits (the free tier allows 2 requests/second), unverified recipients
 * and validation errors all come back this way. Code that only wraps the call
 * in try/catch silently treats those as successes, which is how creator emails
 * went missing while the API still answered 201.
 *
 * Never throws — callers decide what a failed send means for them.
 */
export const sendEmail = async (
	options: SendOptions,
	label = "email",
): Promise<SendEmailResult> => {
	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			const { data, error } = await getResend().emails.send(options);

			if (!error) return { ok: true, id: data?.id };

			if (attempt === 1 && isRetryable(error)) {
				await sleep(1200);
				continue;
			}

			console.error(`✉️ ${label} rejected by Resend`, {
				to: options.to,
				error,
			});
			return { ok: false, error };
		} catch (error) {
			if (attempt === 1) {
				await sleep(1200);
				continue;
			}

			console.error(`✉️ ${label} failed to send`, {
				to: options.to,
				error,
			});
			return { ok: false, error };
		}
	}

	// Unreachable: the loop always returns on its second pass.
	return { ok: false, error: new Error("send failed") };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Rate limits and transient Resend outages are worth one immediate retry. */
const isRetryable = (error: unknown) => {
	const err = error as { statusCode?: number; name?: string };
	return (
		err?.statusCode === 429 ||
		(typeof err?.statusCode === "number" && err.statusCode >= 500) ||
		/rate_limit|application_error/i.test(err?.name || "")
	);
};

/** For interpolating user-supplied values into email HTML. */
export const escapeHtml = (value: unknown) =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
