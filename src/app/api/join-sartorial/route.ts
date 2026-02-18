import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { fullName, emailAddress, phoneNo } = body;

		const { data, error } = await resend.emails.send({
			from: "Sartorial Babes <noreply@sartorial.ng>",
			to: [process.env.RESEND_TO_EMAIL!],
			subject: "🎉 New Sartorial Babe Joined!",
			html: `
        <h2>New Member Registration</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${emailAddress}</p>
        <p><strong>Phone:</strong> ${phoneNo}</p>
        <hr />
        <p><em>Submitted at: ${new Date().toLocaleString()}</em></p>
      `,
		});

		if (error) {
			return NextResponse.json({ error }, { status: 400 });
		}

		return NextResponse.json({ success: true, data });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to send email",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
