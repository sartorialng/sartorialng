import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const reference = searchParams.get("reference");

		if (!reference) {
			return NextResponse.json(
				{ error: "Reference required" },
				{ status: 400 },
			);
		}

		const order = await adminClient.fetch(
			`*[_type == "order" && (paystackReference == $ref || paypalOrderId == $ref)][0]{
				_id,
				orderNumber,
				paystackReference,
				paypalOrderId,
				status,
				totalPrice
			}`,
			{ ref: reference },
		);

		if (order) {
			return NextResponse.json({
				status: "success",
				order: {
					orderNumber: order.orderNumber,
					_id: order._id,
				},
			});
		}

		return NextResponse.json({ status: "pending" });
	} catch (error) {
		console.error("Check order error:", error);
		return NextResponse.json(
			{ error: "Failed to check order" },
			{ status: 500 },
		);
	}
}
