import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const VALID_TRANSITIONS: Record<string, string[]> = {
	paid: ["shipped", "cancelled"],
	shipped: ["delivered", "cancelled"],
	delivered: [],
	pending: ["paid", "cancelled"],
	cancelled: [],
};

export async function PATCH(req: Request) {
	try {
		const { orderId, status, gigTrackingId, gigPin } = await req.json();

		if (!orderId || !status) {
			return NextResponse.json(
				{ error: "Missing orderId or status" },
				{ status: 400 },
			);
		}

		const allowedStatuses = ["paid", "shipped", "delivered", "cancelled", "pending"];
		if (!allowedStatuses.includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status value" },
				{ status: 400 },
			);
		}

		const order = await adminClient.fetch(
			`*[_type == "order" && _id == $id][0]{
				_id, orderNumber, status, email, customerName,
				currency, paymentMethod, totalPrice, shippingCost,
				subtotal, vat, amountDiscount,
				shippingAddress{ address, city, state, country, postalCode, phone, secondaryPhone },
				products[]{
					quantity,
					productName,
					productPrice,
					isFreeGift,
					selectedColor{ colorTitle }
				}
			}`,
			{ id: orderId },
		);

		if (!order) {
			return NextResponse.json({ error: "Order not found" }, { status: 404 });
		}

		const allowed = VALID_TRANSITIONS[order.status] ?? [];
		if (!allowed.includes(status)) {
			return NextResponse.json(
				{ error: `Cannot transition from "${order.status}" to "${status}"` },
				{ status: 400 },
			);
		}

		const patch: Record<string, any> = { status };
		if (status === "shipped" && gigTrackingId) patch.gigTrackingId = gigTrackingId;
		if (status === "shipped" && gigPin) patch.gigPin = gigPin;
		await adminClient.patch(orderId).set(patch).commit();

		if (status === "shipped" || status === "delivered") {
			await sendStatusEmail({ order, newStatus: status, gigTrackingId, gigPin });
		}

		return NextResponse.json({ success: true, status });
	} catch (error) {
		console.error("❌ Status update error:", error);
		return NextResponse.json(
			{
				error: "Failed to update status",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function sendStatusEmail({
	order,
	newStatus,
	gigTrackingId,
	gigPin,
}: {
	order: any;
	newStatus: "shipped" | "delivered";
	gigTrackingId?: string;
	gigPin?: string;
}) {
	const currencySymbol = order.currency === "USD" ? "$" : "₦";
	const formatPrice = (amount: number) =>
		`${currencySymbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	const firstName = order.customerName?.split(" ")[0] || "there";

	const isShipped = newStatus === "shipped";

	const subject = isShipped
		? `Your order is on its way — ${order.orderNumber} 🚚`
		: `Your order has been delivered — ${order.orderNumber} ✅`;

	const headline = isShipped
		? `Your order is on its way, ${firstName}!`
		: `Your order has arrived, ${firstName}!`;

	const subtext = isShipped
		? "Great news — your order has been shipped and is heading to you. Keep an eye out for it!"
		: "Your order has been marked as delivered. We hope you love your purchase!";

	const statusBadgeColor = isShipped ? "#3d7a5a" : "#1b4332";
	const statusLabel = isShipped ? "Shipped" : "Delivered";

	const itemRowsHtml = (order.products ?? [])
		.map(
			(item: any) => `
		<tr>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
				${item.productName || "Product"}
				${item.isFreeGift ? `<span style="display: block; font-size: 12px; color: #2d5a43; font-weight: 600; margin-top: 2px;">🎁 Free gift</span>` : ""}
				${item.selectedColor?.colorTitle ? `<span style="display: block; font-size: 12px; color: #888; margin-top: 2px;">Colour: ${item.selectedColor.colorTitle}</span>` : ""}
			</td>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #555; text-align: center;">
				${item.quantity}
			</td>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right;">
				${item.isFreeGift ? "FREE" : item.productPrice ? formatPrice(item.productPrice * item.quantity) : "—"}
			</td>
		</tr>
	`,
		)
		.join("");

	const deliveryAddress = order.shippingAddress;
	const addressLine = deliveryAddress
		? [
				deliveryAddress.address,
				deliveryAddress.city,
				deliveryAddress.state,
				deliveryAddress.country,
				deliveryAddress.postalCode,
			]
				.filter(Boolean)
				.join(", ")
		: null;

	await resend.emails.send({
		from: "Sartorial <noreply@sartorial.ng>",
		to: order.email,
		subject,
		html: `
			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
				<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

					<!-- Header -->
					<div style="background-color: #2c5b42; padding: 30px; text-align: center;">
						<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Sartorial</h1>
					</div>

					<!-- Status Banner -->
					<div style="background-color: ${statusBadgeColor}; padding: 14px; text-align: center;">
						<span style="color: #fff; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">${statusLabel}</span>
					</div>

					<!-- Intro -->
					<div style="padding: 40px 40px 0; text-align: center;">
						<h2 style="color: #2c5b42; font-size: 22px; margin-bottom: 12px;">${headline}</h2>
						<p style="font-size: 15px; line-height: 1.6; color: #555; margin-bottom: 6px;">${subtext}</p>

						<!-- Order Number Badge -->
						<div style="background-color: #f4f7f5; border: 2px dashed #2c5b42; padding: 16px 24px; display: inline-block; margin: 24px 0 36px; border-radius: 4px;">
							<span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 6px;">Order Number</span>
							<span style="font-size: 20px; font-weight: bold; color: #2c5b42; letter-spacing: 3px;">${order.orderNumber}</span>
						</div>
					</div>

					<!-- Items Table -->
					<div style="padding: 0 40px;">
						<h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 12px; border-bottom: 2px solid #2c5b42; padding-bottom: 8px;">Your Items</h3>
						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr>
									<th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 500; text-align: left; padding-bottom: 8px;">Item</th>
									<th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 500; text-align: center; padding-bottom: 8px;">Qty</th>
									<th style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 500; text-align: right; padding-bottom: 8px;">Total</th>
								</tr>
							</thead>
							<tbody>
								${itemRowsHtml}
							</tbody>
						</table>
					</div>

					<!-- Order Total -->
					<div style="padding: 16px 40px; text-align: right;">
						<span style="font-size: 15px; font-weight: bold; color: #2c5b42;">
							Order Total: ${formatPrice(order.totalPrice)}
						</span>
					</div>

					${
						addressLine
							? `
					<!-- Delivery Address -->
					<div style="padding: 0 40px 32px;">
						<h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 10px; border-bottom: 2px solid #2c5b42; padding-bottom: 8px;">Delivery Address</h3>
						<p style="font-size: 14px; color: #555; line-height: 1.8; margin: 0;">
							${addressLine}
							${deliveryAddress?.phone ? `<br/>📞 ${deliveryAddress.phone}${deliveryAddress.secondaryPhone ? ` / ${deliveryAddress.secondaryPhone}` : ""}` : ""}
						</p>
					</div>
					`
							: ""
					}

					${isShipped && gigTrackingId ? `
					<!-- GIG Tracking Info -->
					<div style="margin: 0 40px 32px; background-color: #f4f7f5; border: 1px solid #d1e7da; border-radius: 6px; padding: 24px;">
						<h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #2c5b42;">GIG Logistics Tracking</h3>
						<table style="width: 100%; border-collapse: collapse;">
							<tr>
								<td style="font-size: 13px; color: #666; padding: 6px 0; width: 40%;">Tracking ID</td>
								<td style="font-size: 15px; font-weight: bold; color: #1b4332; padding: 6px 0; letter-spacing: 1px;">${gigTrackingId}</td>
							</tr>
							${gigPin ? `
							<tr>
								<td style="font-size: 13px; color: #666; padding: 6px 0;">Tracking PIN</td>
								<td style="font-size: 15px; font-weight: bold; color: #1b4332; padding: 6px 0; letter-spacing: 2px;">${gigPin}</td>
							</tr>` : ""}
						</table>
						<div style="margin-top: 20px; text-align: center;">
							<a href="https://www.giglogistics.com/track-shipment" target="_blank" style="background-color: #e8701a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Track on GIG Logistics</a>
						</div>
						<p style="font-size: 12px; color: #888; text-align: center; margin: 12px 0 0;">Use your Tracking ID and PIN on the GIG Logistics website to follow your shipment.</p>
					</div>
					` : ""}

					<!-- CTA -->
					<div style="padding: 0 40px 40px; text-align: center;">
						<a href="https://sartorial.ng/account/orders" target="_blank" style="background-color: #2c5b42; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Track My Order</a>
					</div>

					${!isShipped ? `
					<!-- Thank you + Review (delivered only) -->
					<div style="margin: 0 40px 40px; background-color: #f4f7f5; border-radius: 6px; padding: 28px 24px; text-align: center;">
						<p style="font-size: 18px; font-weight: bold; color: #2c5b42; margin: 0 0 10px;">Thank you for shopping with us! 🛍️</p>
						<p style="font-size: 14px; color: #555; line-height: 1.7; margin: 0 0 20px;">
							We hope you absolutely love your new piece. Your opinion means the world to us —
							kindly take a moment to leave us a review. It helps us serve you and other customers better.
						</p>
						<a href="https://sartorial.ng/account/reviews" target="_blank" style="background-color: #2c5b42; color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Leave a Review</a>
					</div>
					` : ""}

					<!-- Footer -->
					<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
						<p style="margin: 5px 0;">Questions? Reply to this email or contact us at info@sartorial.ng</p>
						<p style="margin: 5px 0;">&copy; 2026 Sartorial. All rights reserved.</p>
					</div>
				</div>
			</div>
		`,
	});

	console.log(`✅ ${statusLabel} email sent to: ${order.email}`);
}
