import { adminClient } from "@/sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { emailAddress, instagramHandle, tiktokHandle } = body;

		if (!emailAddress) {
			return NextResponse.json(
				{ error: "Email address is required" },
				{ status: 400 },
			);
		}

		const existingApplication = await adminClient.fetch(
			`*[_type == "creatorApplication" && emailAddress == $email][0]`,
			{ email: emailAddress },
		);

		if (existingApplication) {
			return NextResponse.json(
				{
					success: true,
					message: "Application already submitted",
					applicationId: existingApplication._id,
				},
				{ status: 200 },
			);
		}

		const application = await adminClient.create({
			_type: "creatorApplication",
			emailAddress,
			instagramHandle: instagramHandle || "",
			tiktokHandle: tiktokHandle || "",
			status: "pending",
			appliedAt: new Date().toISOString(),
		});

		await resend.emails.send({
			from: "Sartorial <noreply@sartorial.ng>",
			to: [process.env.RESEND_TO_EMAIL!],
			subject: "🌟 New Sartorial Creator Application",
			html: `
				<h2>New Creator Application</h2>
				<p><strong>Email:</strong> ${emailAddress}</p>
				<p><strong>Instagram:</strong> ${instagramHandle || "—"}</p>
				<p><strong>TikTok:</strong> ${tiktokHandle || "—"}</p>
				<hr />
				<p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
				<p>Review and approve in <a href="https://www.sartorial.ng/studio/structure/creatorApplication;${application._id}">Sanity Studio</a>.</p>
			`,
		});

		return NextResponse.json(
			{
				success: true,
				message: "Application submitted successfully",
				applicationId: application._id,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to submit application",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
