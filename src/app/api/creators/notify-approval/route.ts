import { adminClient } from "@/sanity/lib/sanity.admin";
import { sendCreatorApprovalEmail } from "@/lib/creators/creatorEmail";
import { after, NextResponse } from "next/server";

type ApplicationSnapshot = {
	_id: string;
	_rev: string;
	status?: string;
	emailAddress?: string;
	approvalEmailSentAt?: string;
};

/**
 * Sends the welcome email for an already-approved application.
 *
 * The status change itself happens in the Studio, signed with the editor's own
 * Sanity credentials, so this route never grants anyone the power to approve.
 * It refuses unless the document is genuinely `approved`, which means the worst
 * an anonymous caller can do is send an email the applicant had already earned
 * — and the send-once claim below stops even that from arriving twice.
 */
export async function POST(req: Request) {
	try {
		const { applicationId } = await req.json();

		if (!applicationId) {
			return NextResponse.json(
				{ error: "Missing applicationId" },
				{ status: 400 },
			);
		}

		const application = await adminClient.fetch<ApplicationSnapshot | null>(
			`*[_type == "creatorApplication" && _id == $id][0]{_id, _rev, status, emailAddress, approvalEmailSentAt}`,
			{ id: applicationId },
		);

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 },
			);
		}

		if (application.status !== "approved") {
			return NextResponse.json(
				{
					error: `Application is "${application.status ?? "unknown"}", not approved`,
				},
				{ status: 409 },
			);
		}

		if (!application.emailAddress) {
			return NextResponse.json(
				{ error: "Application has no email address" },
				{ status: 422 },
			);
		}

		const claimed = await claimApprovalEmail(application);
		if (!claimed) {
			return NextResponse.json({ success: true, alreadySent: true });
		}

		const { _id, emailAddress } = application;

		// Studio waits on this response, so the send happens after it: an
		// approval should feel instant, and a slow Resend call is not a reason
		// to hold the editor's UI.
		after(async () => {
			const result = await sendCreatorApprovalEmail(emailAddress);

			if (!result.ok) {
				// Release the claim so the "Resend approval email" action
				// reappears — a failed send used to be unrecoverable.
				await adminClient
					.patch(_id)
					.unset(["approvalEmailSentAt"])
					.commit()
					.catch(() => {});
				console.error("⚠️ Creator approval email failed for:", emailAddress);
			}
		});

		return NextResponse.json({ success: true, queued: true }, { status: 202 });
	} catch (error) {
		console.error("Creator approval notification failed", error);
		return NextResponse.json(
			{
				error: "Failed to send approval email",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * Optimistic-lock claim, the same shape as `claimConfirmationEmail` in
 * `src/lib/orders/fulfillOrder.ts`: whoever wins the revision check sends the
 * email, everyone else backs off.
 */
const claimApprovalEmail = async (application: ApplicationSnapshot) => {
	if (application.approvalEmailSentAt) return false;

	try {
		await adminClient
			.patch(application._id)
			.ifRevisionId(application._rev)
			.set({ approvalEmailSentAt: new Date().toISOString() })
			.commit();
		return true;
	} catch {
		// Lost the race — another caller is sending it.
		return false;
	}
};
