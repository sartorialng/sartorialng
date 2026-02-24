import { adminClient } from "@/sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			firstName,
			lastName,
			emailAddress,
			phoneNo,
			address,
			secondaryPhoneNo,
		} = body;

		if (!emailAddress) {
			return NextResponse.json(
				{ error: "Customer email is required" },
				{ status: 400 },
			);
		}

		const existingCustomer = await adminClient.fetch(
			`*[_type == "customer" && email == $email][0]`,
			{ email: emailAddress },
		);

		if (existingCustomer) {
			return NextResponse.json(
				{
					success: true,
					message: "Customer already exists",
					customerId: existingCustomer._id,
				},
				{ status: 200 },
			);
		}

		const customer = await adminClient.create({
			_type: "customer",
			firstName: firstName || "",
			lastName: lastName || "",
			email: emailAddress,
			phone: phoneNo || "",
			secondaryPhone: secondaryPhoneNo || "",
			address: address || "",
			createdAt: new Date().toISOString(),
		});

		const couponCode = `WEL${crypto.randomUUID().replace(/-/g, "").slice(0, 3).toUpperCase()}`;

		await adminClient.create({
			_type: "coupon",
			code: couponCode,
			discountType: "percentage",
			discountValue: 50,
			isActive: true,
			usageLimit: 1,
			usedCount: 0,
			assignedTo: emailAddress,
			expiresAt: new Date(
				Date.now() + 30 * 24 * 60 * 60 * 1000,
			).toISOString(),
		});

		await resend.emails.send({
			from: "Sartorial Babes <noreply@sartorial.ng>",
			to: emailAddress,
			subject: "Your account has been created 🎉",
			html: `
				<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
					<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
						
						<div style="background-color: #2c5b42; padding: 30px; text-align: center;">
							<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Sartorial</h1>
						</div>
		
						<div style="padding: 40px; text-align: center;">
							<h2 style="color: #2c5b42; font-size: 22px; margin-bottom: 20px;">Welcome, ${firstName}!</h2>
							<p style="font-size: 16px; line-height: 1.6; color: #555;">
								Your account has been successfully created. We're thrilled to have you in our community of style.
							</p>
							<p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 30px;">
								As a thank-you, please enjoy <strong>50% off</strong> your next order.
							</p>
		
							<div style="background-color: #f4f7f5; border: 2px dashed #2c5b42; padding: 20px; display: inline-block; margin-bottom: 30px;">
								<span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 10px;">Your Code:</span>
								<h1 style="letter-spacing: 8px; color: #2c5b42; margin: 0; font-size: 32px;">${couponCode}</h1>
							</div>
		
							<div>
								<a href="https://sartorial.ng" target="_blank" style="background-color: #2c5b42; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">SHOP THE COLLECTION</a>
							</div>
						</div>
		
						<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
							<p style="margin: 5px 0;">Valid for 30 days. Single use only.</p>
							<p style="margin: 5px 0;">&copy; 2026 Sartorial. All rights reserved.</p>
						</div>
					</div>
				</div>
			`,
		});

		return NextResponse.json(
			{
				success: true,
				message: "Customer created successfully",
				customerId: customer._id,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to process customer",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
