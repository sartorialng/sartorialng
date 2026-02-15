import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
	try {
		const { fullName, emailAddress, phoneNo, message } = await req.json();

		const data = await resend.emails.send({
			from: "Sartorial Contact <onboarding@resend.dev>",
			to: [process.env.RESEND_TO_EMAIL!],
			subject: `New Contact Form Message from ${fullName}`,
			html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>New Message Received</h2>
          <p><strong>Name:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${emailAddress}</p>
          <p><strong>Phone:</strong> ${phoneNo}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
		});

		return NextResponse.json(data);
	} catch (error: unknown) {
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
