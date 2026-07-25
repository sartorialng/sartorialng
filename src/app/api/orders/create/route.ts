import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/orders/fulfillOrder";
import { verifyPaystackTransaction } from "@/lib/orders/paystackTransaction";
import type { OrderInput } from "@/lib/orders/types";

/**
 * Fulfils an order from the checkout form. Guest checkout is supported — no
 * sign-in required — but for Paystack the reference is confirmed with Paystack
 * server-side before anything is written, so a caller can't invent a reference
 * and get a `paid` order out of it.
 *
 * This is one of three paths into `fulfillOrder`; the Paystack webhook and
 * /api/paystack/verify are the others. All three are idempotent, so it does not
 * matter which one gets there first.
 */
export async function POST(req: Request) {
	try {
		const body = await req.json();

		const {
			firstName,
			lastName,
			address,
			country,
			state,
			area,
			postalCode,
			phoneNo,
			secondaryPhoneNo,
			emailAddress,
			shipToDifferentAddress,
			shippingAddress,
			shippingCountry,
			shippingState,
			shippingArea,
			shippingPostalCode,
			shippingPhoneNo,
			shippingSecondaryPhoneNo,
			clerkUserId,
			clerkUserName,
			items,
			paymentReference,
			paymentMethod,
			total,
			shipping: shippingCost,
			subtotal,
			vat,
			amountDiscount,
			couponCode,
			orderNote,
			interstateDeliveryType,
			gigPark,
			shippingGigPark,
		} = body;

		if (!items || !paymentReference || !paymentMethod || !emailAddress) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		if (!Array.isArray(items) || items.length === 0) {
			return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
		}

		const useShipping = Boolean(shipToDifferentAddress);

		const orderInput: OrderInput = {
			paymentReference,
			paymentMethod,
			emailAddress,
			customerName: clerkUserName || `${firstName} ${lastName}`,
			firstName: firstName || null,
			clerkUserId: clerkUserId || null,
			items: items.map((item: any) => ({
				_id: item._id,
				name: item.name,
				price: item.price,
				quantity: item.quantity,
				isFreeGift: item.isFreeGift === true,
				imageRef: item.image?.asset?._ref || item.imageRef || null,
				selectedColor: item.selectedColor || null,
			})),
			subtotal,
			shipping: shippingCost,
			vat,
			total,
			amountDiscount: amountDiscount || 0,
			couponCode: couponCode || null,
			orderNote: orderNote || null,
			shippingAddress: {
				address: useShipping ? shippingAddress : address,
				city: useShipping ? shippingArea : area,
				state: useShipping ? shippingState : state,
				country: useShipping ? shippingCountry : country,
				postalCode: useShipping ? shippingPostalCode : postalCode,
				phone: useShipping ? shippingPhoneNo : phoneNo,
				secondaryPhone: useShipping
					? shippingSecondaryPhoneNo
					: secondaryPhoneNo,
			},
			interstateDeliveryType: interstateDeliveryType || null,
			gigPark: useShipping ? shippingGigPark : gigPark,
		};

		if (paymentMethod === "paystack") {
			const transaction = await verifyPaystackTransaction(
				paymentReference,
			);

			if (transaction.status !== "success") {
				return NextResponse.json(
					{ error: "Payment has not been confirmed by Paystack" },
					{ status: 402 },
				);
			}

			// Guard against a caller claiming a higher total than was actually
			// paid. Overpayment is normal and expected — when the customer
			// bears the Paystack fee, the charge is the goods total grossed up
			// — so `totalPrice` stays the goods total and only underpayment is
			// treated as a problem. Overwriting it with the charged amount
			// would put the processing fee into the order total, break
			// subtotal + shipping + VAT = total, and make the stored figure
			// depend on whether the webhook or the browser won the race.
			const chargedTotal = transaction.amount / 100;
			if (chargedTotal + 0.01 < Number(total)) {
				console.error(
					`🚨 Underpayment for ${paymentReference}: expected ${total}, Paystack charged ${chargedTotal}`,
				);
				return NextResponse.json(
					{ error: "Paid amount is less than the order total" },
					{ status: 402 },
				);
			}

			orderInput.orderDate = transaction.paid_at || null;
		}

		const result = await fulfillOrder(orderInput);

		return NextResponse.json({
			success: true,
			order: result.order,
			isDuplicate: result.alreadyFulfilled,
			message: result.alreadyFulfilled
				? "Order already exists"
				: "Order created successfully",
		});
	} catch (error) {
		console.error("❌ Order creation error:", error);
		return NextResponse.json(
			{
				error: "Failed to create order",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
