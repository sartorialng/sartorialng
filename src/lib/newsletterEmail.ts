import { escapeHtml, sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/emailLayout";

const FROM = "Sartorial <welcome@sartorial.ng>";
const SHOP_URL = "https://sartorial.ng";
const NEW_ARRIVALS_URL = "https://sartorial.ng/#new-arrivals";
const INSTAGRAM_URL = "https://www.instagram.com/sartorialhq";

const LINK = "color: #2c5b42; font-weight: bold;";

/**
 * Split from the send, like the creator and order emails, so the template can
 * be rendered and checked without posting anything to Resend.
 */
export const buildNewsletterWelcomeHtml = (firstName?: string) =>
	brandedEmail({
		heading: firstName
			? `Welcome to the list, ${escapeHtml(firstName)}!`
			: "Welcome to the list!",
		intro: "Thank you for subscribing. You'll now get early access, promos, sales and exclusive discount codes, by email and on WhatsApp.",
		note: `Keep an eye on your inbox, and follow us on Instagram at <a href="${INSTAGRAM_URL}" target="_blank" style="${LINK}">@sartorialhq</a> for new drops. Changed your mind? Every newsletter has an unsubscribe link at the bottom.`,
		cta: { label: "Shop New Arrivals", href: NEW_ARRIVALS_URL },
	});

const buildNewsletterWelcomeText = (firstName?: string) =>
	[
		firstName ? `Hi ${firstName},` : "Hi,",
		"",
		"Thank you for subscribing to the Sartorial mailing list. You'll now get early access, promos, sales and exclusive discount codes, by email and on WhatsApp.",
		"",
		`Shop new arrivals: ${NEW_ARRIVALS_URL}`,
		`Follow us on Instagram: ${INSTAGRAM_URL}`,
		"",
		"Changed your mind? Every newsletter has an unsubscribe link at the bottom.",
		"",
		`Sartorial · ${SHOP_URL}`,
	].join("\n");

/** Never throws: a failed welcome email must not undo the subscription. */
export const sendNewsletterWelcomeEmail = (email: string, firstName?: string) =>
	sendEmail(
		{
			from: FROM,
			to: [email],
			subject: "Welcome to Sartorial! You're on the list",
			html: buildNewsletterWelcomeHtml(firstName),
			text: buildNewsletterWelcomeText(firstName),
		},
		"newsletter welcome",
	);
