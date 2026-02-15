import { adminClient } from "@/sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { customerName, rating, comment } = body;

		if (!customerName || !rating) {
			return NextResponse.json(
				{ error: "Customer name and rating are required" },
				{ status: 400 },
			);
		}

		if (rating < 1 || rating > 5) {
			return NextResponse.json(
				{ error: "Rating must be between 1 and 5" },
				{ status: 400 },
			);
		}

		const review = await adminClient.create({
			_type: "review",
			customerName,
			rating,
			comment: comment || "",
			date: new Date().toISOString(),
			isApproved: false,
		});

		return NextResponse.json(
			{
				success: true,
				message: "Review submitted successfully",
				review,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to submit review",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
