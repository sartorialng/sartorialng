import { NextResponse } from "next/server";
import { adminClient } from "@/sanity/lib/sanity.admin";
import { fulfillOrder, orderDocIdForReference } from "@/lib/orders/fulfillOrder";
import {
	orderInputFromPaystackTransaction,
	verifyPaystackTransaction,
} from "@/lib/orders/paystackTransaction";

/**
 * Recovery path: given only a reference, confirm the payment with Paystack and
 * fulfil the order from the transaction metadata. Used when the browser
 * callback failed and the webhook hasn't landed (or was never configured).
 */
export async function POST(req: Request) {
	try {
		const { reference } = await req.json();

		if (!reference) {
			return NextResponse.json(
				{ status: "failed", message: "Reference required" },
				{ status: 400 },
			);
		}

		const existingOrder = await adminClient.fetch(
			`*[_type == "order" && (_id == $docId || paystackReference == $ref)][0]{
				_id, orderNumber
			}`,
			{ ref: reference, docId: orderDocIdForReference(reference) },
		);

		if (existingOrder) {
			return NextResponse.json({
				status: "success",
				order: {
					orderNumber: existingOrder.orderNumber,
					_id: existingOrder._id,
				},
			});
		}

		const transaction = await verifyPaystackTransaction(reference);

		if (transaction.status !== "success") {
			return NextResponse.json({
				status: "pending",
				message: `Payment status is "${transaction.status}"`,
			});
		}

		const orderInput = orderInputFromPaystackTransaction(transaction);

		if (!orderInput) {
			console.error(
				"Verify could not rebuild order for reference:",
				reference,
			);
			return NextResponse.json(
				{
					status: "failed",
					message:
						"Payment confirmed but order details are unavailable. Support has been notified.",
				},
				{ status: 422 },
			);
		}

		const result = await fulfillOrder(orderInput);

		return NextResponse.json({
			status: "success",
			order: result.order,
		});
	} catch (error) {
		console.error("Verification error:", error);
		return NextResponse.json(
			{ status: "failed", message: "Server error during verification" },
			{ status: 500 },
		);
	}
}
