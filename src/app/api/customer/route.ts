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

		const couponCode = `WEL${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

		const saleEndsAt = process.env.SALE_END_DATE
			? new Date(process.env.SALE_END_DATE)
			: null;

		const now = new Date();

		let validFrom;
		let expiresAt;

		// If SALE_END_DATE exists and is valid
		if (saleEndsAt && !isNaN(saleEndsAt.getTime())) {
			validFrom = saleEndsAt;

			// Expire 30 days AFTER validFrom
			expiresAt = new Date(
				saleEndsAt.getTime() + 30 * 24 * 60 * 60 * 1000,
			);
		} else {
			// No SALE_END_DATE → expire 30 days from now
			expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
		}

		const footerValidityText = validFrom
			? `Valid for 30 days after our sale ends on ${validFrom.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}. Single use only.`
			: "Valid for 30 days. Single use only.";

		const salePeriodNote = validFrom
			? `<p style="font-size: 14px; color: #e07b39; margin-bottom: 20px;">⏳ Our current sale is active — your coupon will be valid once the sale ends.</p>`
			: "";

		await adminClient.create({
			_type: "coupon",
			code: couponCode,
			discountType: "percentage",
			discountValue: 20,
			isActive: true,
			usageLimit: 1,
			usedCount: 0,
			assignedTo: emailAddress,
			...(validFrom && { validFrom: validFrom.toISOString() }),
			expiresAt: expiresAt.toISOString(),
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
								As a thank-you, please enjoy <strong>20% off</strong> your next order.
							</p>
							${salePeriodNote}
		
							<div style="background-color: #f4f7f5; border: 2px dashed #2c5b42; padding: 20px; display: inline-block; margin-bottom: 30px;">
								<span style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 10px;">Your Code:</span>
								<h1 style="letter-spacing: 8px; color: #2c5b42; margin: 0; font-size: 32px;">${couponCode}</h1>
							</div>
		
							<div>
								<a href="https://sartorial.ng" target="_blank" style="background-color: #2c5b42; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">SHOP THE COLLECTION</a>
							</div>
						</div>
		
						<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
							<p style="margin: 5px 0;">${footerValidityText}</p>
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
