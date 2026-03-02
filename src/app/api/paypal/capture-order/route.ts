import { NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { orderID } = body;

		// Validate orderID
		if (!orderID || typeof orderID !== "string") {
			return NextResponse.json(
				{ error: "Invalid order ID provided" },
				{ status: 400 },
			);
		}

		const capture = await captureOrder(orderID);

		return NextResponse.json(capture);
	} catch (error: any) {
		console.error("Error in capture-order API:", error);

		// Return detailed error message
		return NextResponse.json(
			{
				error: error.message || "Failed to capture order",
				details: error.toString(),
			},
			{ status: 500 },
		);
	}
}
