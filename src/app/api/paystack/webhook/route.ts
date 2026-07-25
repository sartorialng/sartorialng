import { NextResponse } from "next/server";
import crypto from "crypto";
import { fulfillOrder } from "@/lib/orders/fulfillOrder";
import {
	orderInputFromPaystackTransaction,
	verifyPaystackTransaction,
} from "@/lib/orders/paystackTransaction";

export async function POST(req: Request) {
	try {
		const body = await req.text();

		const hash = crypto
			.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
			.update(body)
			.digest("hex");

		const signature = req.headers.get("x-paystack-signature");

		if (hash !== signature) {
			console.error("Invalid webhook signature");
			return NextResponse.json(
				{ error: "Invalid signature" },
				{ status: 401 },
			);
		}

		const event = JSON.parse(body);

		if (event.event !== "charge.success") {
			return NextResponse.json({ message: "Event received" });
		}

		let transaction = event.data;

		// The webhook payload can arrive with metadata trimmed. Re-reading the
		// transaction from Paystack gives us the authoritative copy.
		if (!transaction?.metadata?.order && !transaction?.metadata?.formData) {
			try {
				transaction = await verifyPaystackTransaction(
					event.data.reference,
				);
			} catch (error) {
				console.error("Webhook re-verification failed:", error);
			}
		}

		const orderInput = orderInputFromPaystackTransaction(transaction);

		if (!orderInput) {
			console.error(
				"Webhook could not rebuild order for reference:",
				event.data.reference,
			);
			console.error("Metadata:", JSON.stringify(transaction?.metadata));
			// 200 so Paystack stops retrying something that will never succeed;
			// the reference is logged above for manual reconciliation.
			return NextResponse.json({
				message: "Unable to rebuild order from metadata",
				reference: event.data.reference,
			});
		}

		const result = await fulfillOrder(orderInput);

		return NextResponse.json({
			message: result.alreadyFulfilled
				? "Order already processed"
				: "Order created successfully",
			orderNumber: result.order.orderNumber,
		});
	} catch (error) {
		console.error("Webhook error:", error);
		console.error(
			"Error stack:",
			error instanceof Error ? error.stack : "No stack trace",
		);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		);
	}
}
