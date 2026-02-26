import { adminClient } from "@/sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { code, email } = await request.json();

	if (!code)
		return NextResponse.json(
			{ error: "No coupon code provided" },
			{ status: 400 },
		);

	const coupon = await adminClient.fetch(
		`*[_type == "coupon" && code == $code && isActive == true][0]`,
		{ code: code.toUpperCase().trim() },
	);

	// ✅ Check null FIRST before touching any property
	if (!coupon)
		return NextResponse.json(
			{ valid: false, message: "Invalid coupon code." },
			{ status: 200 },
		);

	if (coupon.validFrom) {
		const validFromDate = new Date(coupon.validFrom);
		const now = new Date();
		if (now < validFromDate) {
			const formattedDate = validFromDate.toLocaleDateString("en-NG", {
				day: "numeric",
				month: "long",
				year: "numeric",
			});
			return NextResponse.json({
				valid: false,
				message: `This coupon is only valid from ${formattedDate}. It cannot be used during our current sale period.`,
			});
		}
	}

	if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
		return NextResponse.json(
			{ valid: false, message: "Coupon has expired." },
			{ status: 200 },
		);

	if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
		return NextResponse.json(
			{ valid: false, message: "Coupon usage limit reached." },
			{ status: 200 },
		);

	if (coupon.assignedTo && coupon.assignedTo !== email)
		return NextResponse.json(
			{ valid: false, message: "Coupon not valid for this account." },
			{ status: 200 },
		);

	if (!coupon.assignedTo && coupon.redeemedBy?.includes(email))
		return NextResponse.json(
			{ valid: false, message: "You have already used this coupon." },
			{ status: 200 },
		);

	// Personal coupon duplicate check
	if (coupon.assignedTo && coupon.redeemedBy?.includes(email))
		return NextResponse.json(
			{ valid: false, message: "You have already used this coupon." },
			{ status: 200 },
		);

	return NextResponse.json({
		valid: true,
		discountType: coupon.discountType,
		discountValue: coupon.discountValue,
		code: coupon.code,
		message: "Coupon applied successfully!",
	});
}
