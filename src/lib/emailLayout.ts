import { escapeHtml } from "./email";

const GREEN = "#2c5b42";

type DetailRow = { label: string; value?: string | null };

type BrandedEmailOptions = {
	/** Large green headline inside the card. */
	heading: string;
	/** Optional sentence under the heading. */
	intro?: string;
	/** Optional label/value block, rendered as a table. */
	details?: DetailRow[];
	/** Optional trailing paragraph, below the details. */
	note?: string;
	cta?: { label: string; href: string };
};

/**
 * The house email chrome, lifted out of `buildOrderConfirmationHtml`: grey
 * page, white card, green Sartorial header bar, contact footer. Everything the
 * brand sends should go through here so a transactional alert doesn't land
 * looking like raw HTML next to the order confirmation.
 */
export const brandedEmail = ({
	heading,
	intro,
	details,
	note,
	cta,
}: BrandedEmailOptions) => `
	<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
		<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

			<!-- Header -->
			<div style="background-color: ${GREEN}; padding: 30px; text-align: center;">
				<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Sartorial</h1>
			</div>

			<!-- Intro -->
			<div style="padding: 40px 40px ${details || note || cta ? "0" : "40px"}; text-align: center;">
				<h2 style="color: ${GREEN}; font-size: 22px; margin: 0 0 ${intro ? "12px" : "0"};">${heading}</h2>
				${
					intro
						? `<p style="font-size: 16px; line-height: 1.6; color: #555; margin: 0;">${intro}</p>`
						: ""
				}
			</div>

			${details?.length ? detailsBlock(details) : ""}

			${
				note
					? `<div style="padding: 0 40px 8px; text-align: center;">
				<p style="font-size: 14px; line-height: 1.6; color: #888; margin: 0;">${note}</p>
			</div>`
					: ""
			}

			${
				cta
					? `<div style="padding: 32px 40px 40px; text-align: center;">
				<a href="${cta.href}" target="_blank" style="background-color: ${GREEN}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">${escapeHtml(cta.label)}</a>
			</div>`
					: `<div style="padding-bottom: 32px;"></div>`
			}

			<!-- Footer -->
			<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
				<p style="margin: 5px 0;">Questions? Reply to this email or contact us at info@sartorial.ng</p>
				<p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Sartorial. All rights reserved.</p>
			</div>
		</div>
	</div>
`;

/** Label/value table styled like the order summary panel. */
const detailsBlock = (details: DetailRow[]) => `
			<div style="padding: 24px 40px; background-color: #f4f7f5; margin: 32px 40px 0; border-radius: 4px;">
				<table style="width: 100%; border-collapse: collapse;">
					${details
						.map(
							({ label, value }) => `
					<tr>
						<td style="font-size: 13px; color: #666; padding: 6px 0; white-space: nowrap;">${escapeHtml(label)}</td>
						<td style="font-size: 13px; color: #333; text-align: right; padding: 6px 0; word-break: break-word;">${escapeHtml(value) || "—"}</td>
					</tr>`,
						)
						.join("")}
				</table>
			</div>
`;
