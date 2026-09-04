import { sendEmail } from "@/lib/email";
import { brandedEmail } from "@/lib/emailLayout";

const FROM = "Sartorial <noreply@sartorial.ng>";

type ApplicationAlert = {
	emailAddress: string;
	instagramHandle?: string;
	tiktokHandle?: string;
	studioUrl: string;
};

/**
 * Split from the send the same way `buildOrderConfirmationHtml` is, so the
 * template can be rendered and eyeballed without posting anything to Resend.
 */
export const buildCreatorApplicationAlertHtml = ({
	emailAddress,
	instagramHandle,
	tiktokHandle,
	studioUrl,
}: ApplicationAlert) =>
	brandedEmail({
		heading: "New Creator Application",
		intro: "Someone just applied to join the Sartorial Creator list.",
		details: [
			{ label: "Email", value: emailAddress },
			{ label: "Instagram", value: instagramHandle },
			{ label: "TikTok", value: tiktokHandle },
			{
				label: "Submitted",
				value: new Date().toLocaleString("en-NG", {
					timeZone: "Africa/Lagos",
				}),
			},
		],
		cta: { label: "Review in Studio", href: studioUrl },
	});

export const sendCreatorApplicationAlert = (alert: ApplicationAlert) =>
	sendEmail(
		{
			from: FROM,
			to: [process.env.RESEND_TO_EMAIL!],
			subject: "🌟 New Sartorial Creator Application",
			html: buildCreatorApplicationAlertHtml(alert),
		},
		"creator application alert",
	);

export const buildCreatorApprovalHtml = () =>
	brandedEmail({
		heading: "You're in!",
		intro:
			"Welcome to the Sartorial Creator list. We'll be in touch soon with next steps, early access, and collaboration opportunities.",
		cta: { label: "Explore Sartorial", href: "https://sartorial.ng" },
	});

export const sendCreatorApprovalEmail = (emailAddress: string) =>
	sendEmail(
		{
			from: FROM,
			to: emailAddress,
			subject: "You're in! Welcome to the Sartorial Creator list 🎉",
			html: buildCreatorApprovalHtml(),
		},
		"creator approval email",
	);
