import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCreatorApprovalEmail = async (emailAddress: string) => {
	await resend.emails.send({
		from: "Sartorial <noreply@sartorial.ng>",
		to: emailAddress,
		subject: "You're in! Welcome to the Sartorial Creator list 🎉",
		html: `
			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
				<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

					<div style="background-color: #2c5b42; padding: 30px; text-align: center;">
						<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Sartorial</h1>
					</div>

					<div style="padding: 40px; text-align: center;">
						<h2 style="color: #2c5b42; font-size: 22px; margin-bottom: 16px;">You're in!</h2>
						<p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 0;">
							Welcome to the Sartorial Creator list. We'll be in touch soon with next steps, early access, and collaboration opportunities.
						</p>
					</div>

					<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
						<p style="margin: 5px 0;">Questions? Reply to this email or contact us at info@sartorial.ng</p>
						<p style="margin: 5px 0;">&copy; 2026 Sartorial. All rights reserved.</p>
					</div>
				</div>
			</div>
		`,
	});
};
