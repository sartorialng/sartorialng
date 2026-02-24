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

	if (!coupon)
		return NextResponse.json(
			{ error: "Invalid coupon code" },
			{ status: 404 },
		);

	if (coupon.redeemedBy?.includes(email))
		return NextResponse.json(
			{ error: "You have already used this coupon" },
			{ status: 400 },
		);

	if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
		return NextResponse.json(
			{ error: "Coupon has expired" },
			{ status: 400 },
		);

	if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
		return NextResponse.json(
			{ error: "Coupon usage limit reached" },
			{ status: 400 },
		);

	if (coupon.assignedTo && coupon.assignedTo !== email)
		return NextResponse.json(
			{ error: "Coupon not valid for this account" },
			{ status: 403 },
		);

	return NextResponse.json({
		valid: true,
		discountType: coupon.discountType,
		discountValue: coupon.discountValue,
		code: coupon.code,
	});
}
