import { adminClient } from "@/sanity/lib/sanity.admin";
import { sendCreatorApprovalEmail } from "@/lib/creators/creatorEmail";
import { NextResponse } from "next/server";

const VALID_TRANSITIONS: Record<string, string[]> = {
	pending: ["approved", "rejected"],
	approved: [],
	rejected: [],
};

export async function PATCH(req: Request) {
	try {
		const { applicationId, status } = await req.json();

		if (!applicationId || !status) {
			return NextResponse.json(
				{ error: "Missing applicationId or status" },
				{ status: 400 },
			);
		}

		const allowedStatuses = ["approved", "rejected"];
		if (!allowedStatuses.includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status value" },
				{ status: 400 },
			);
		}

		const application = await adminClient.fetch(
			`*[_type == "creatorApplication" && _id == $id][0]{_id, status, emailAddress}`,
			{ id: applicationId },
		);

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 },
			);
		}

		const allowed = VALID_TRANSITIONS[application.status] ?? [];
		if (!allowed.includes(status)) {
			return NextResponse.json(
				{
					error: `Cannot transition from "${application.status}" to "${status}"`,
				},
				{ status: 400 },
			);
		}

		await adminClient
			.patch(applicationId)
			.set({ status, reviewedAt: new Date().toISOString() })
			.commit();

		if (status === "approved") {
			await sendCreatorApprovalEmail(application.emailAddress);
		}

		return NextResponse.json({ success: true, status });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to update status",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
