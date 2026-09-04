import { adminClient } from "@/sanity/lib/sanity.admin";
import { sendCreatorApplicationAlert } from "@/lib/creators/creatorEmail";
import { isConflict } from "@/lib/sanity/errors";
import {
	creatorDocIdForEmail,
	normalizeEmail,
} from "@/lib/creators/creatorApplication";
import { joinCreatorSchema } from "@/lib/validation-schemas";
import { after, NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		let values: {
			emailAddress: string;
			instagramHandle?: string;
			tiktokHandle?: string;
		};

		try {
			// Normalise before validating: an address pasted with a stray space or
			// typed in caps belongs to the same applicant, and yup's `.email()`
			// checks whatever it is handed.
			values = await joinCreatorSchema.validate(
				{
					emailAddress: normalizeEmail(body?.emailAddress),
					instagramHandle: body?.instagramHandle,
					tiktokHandle: body?.tiktokHandle,
				},
				{ stripUnknown: true },
			);
		} catch (validationError) {
			return NextResponse.json(
				{
					error:
						validationError instanceof Error
							? validationError.message
							: "Invalid application",
				},
				{ status: 400 },
			);
		}

		const emailAddress = values.emailAddress;
		const instagramHandle = values.instagramHandle?.trim() || "";
		const tiktokHandle = values.tiktokHandle?.trim() || "";

		// The deterministic ID replaces the "fetch then create" pair: Sanity
		// answers a repeat application with a 409, which costs one round trip
		// instead of two on the happy path.
		const _id = creatorDocIdForEmail(emailAddress);

		try {
			await adminClient.create({
				_id,
				_type: "creatorApplication",
				emailAddress,
				instagramHandle,
				tiktokHandle,
				status: "pending",
				appliedAt: new Date().toISOString(),
			});
		} catch (error) {
			if (isConflict(error)) {
				return NextResponse.json(
					{
						success: true,
						alreadyApplied: true,
						message: "Application already submitted",
						applicationId: _id,
					},
					{ status: 200 },
				);
			}
			throw error;
		}

		const studioUrl = `${new URL(request.url).origin}/studio/structure/creatorApplication;${_id}`;

		// The applicant does not need to wait on Resend, and a failed alert must
		// never fail a submission that already landed in Sanity — that used to
		// leave the applicant permanently un-notifiable behind the dedupe check.
		after(async () => {
			await sendCreatorApplicationAlert({
				emailAddress,
				instagramHandle,
				tiktokHandle,
				studioUrl,
			});
		});

		return NextResponse.json(
			{
				success: true,
				message: "Application submitted successfully",
				applicationId: _id,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Creator application failed", error);
		return NextResponse.json(
			{
				error: "Failed to submit application",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
