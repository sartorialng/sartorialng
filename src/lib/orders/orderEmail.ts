import { Resend } from "resend";
import type { OrderInput } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);

export const buildOrderConfirmationHtml = (
	input: OrderInput,
	orderNumber: string,
) => {
	const currencySymbol = input.paymentMethod === "paypal" ? "$" : "₦";

	const formatPrice = (amount: number) =>
		`${currencySymbol}${(amount || 0).toLocaleString("en-NG", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;

	const deliveryAddress = input.shippingAddress || {};

	const itemRowsHtml = input.items
		.map(
			(item) => `
		<tr>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
				${item.name}
				${item.isFreeGift ? `<span style="display: block; font-size: 12px; color: #2d5a43; font-weight: 600; margin-top: 2px;">🎁 Free gift</span>` : ""}
				${item.selectedColor?.colorTitle ? `<span style="display: block; font-size: 12px; color: #888; margin-top: 2px;">Colour: ${item.selectedColor.colorTitle}</span>` : ""}
			</td>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #555; text-align: center;">
				${item.quantity}
			</td>
			<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right;">
				${item.isFreeGift ? "FREE" : formatPrice(item.price * item.quantity)}
			</td>
		</tr>
	`,
		)
		.join("");

	const customerName =
		input.firstName || input.customerName?.split(" ")[0] || "there";

	return `
		<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 40px 20px; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">

				<!-- Header -->
				<div style="background-color: #2c5b42; padding: 30px; text-align: center;">
					<h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Sartorial</h1>
				</div>

				<!-- Intro -->
				<div style="padding: 40px 40px 0; text-align: center;">
					<h2 style="color: #2c5b42; font-size: 22px; margin-bottom: 12px;">Thank you, ${customerName}!</h2>
					<p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 6px;">
						Your order has been placed and is being processed.
					</p>
					<p style="font-size: 14px; color: #888; margin-bottom: 30px;">
						We'll be in touch when it's on its way.
					</p>

					<!-- Order Number Badge -->
					<div style="background-color: #f4f7f5; border: 2px dashed #2c5b42; padding: 16px 24px; display: inline-block; margin-bottom: 36px; border-radius: 4px;">
						<span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 6px;">Order Number</span>
						<span style="font-size: 20px; font-weight: bold; color: #2c5b42; letter-spacing: 3px;">${orderNumber}</span>
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

				<!-- Order Summary -->
				<div style="padding: 24px 40px; background-color: #f4f7f5; margin: 24px 40px; border-radius: 4px;">
					<table style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="font-size: 13px; color: #666; padding: 4px 0;">Subtotal</td>
							<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(input.subtotal)}</td>
						</tr>
						${
							input.shipping > 0
								? `
						<tr>
							<td style="font-size: 13px; color: #666; padding: 4px 0;">Shipping</td>
							<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(input.shipping)}</td>
						</tr>
						`
								: `
						<tr>
							<td style="font-size: 13px; color: #666; padding: 4px 0;">Shipping</td>
							<td style="font-size: 13px; color: #2c5b42; font-weight: bold; text-align: right; padding: 4px 0;">Free</td>
						</tr>
						`
						}
						${
							input.vat > 0
								? `
						<tr>
							<td style="font-size: 13px; color: #666; padding: 4px 0;">VAT</td>
							<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(input.vat)}</td>
						</tr>
						`
								: ""
						}
						${
							(input.amountDiscount || 0) > 0
								? `
						<tr>
							<td style="font-size: 13px; color: #666; padding: 4px 0;">Discount ${input.couponCode ? `(${input.couponCode})` : ""}</td>
							<td style="font-size: 13px; color: #c0392b; text-align: right; padding: 4px 0;">− ${formatPrice(input.amountDiscount || 0)}</td>
						</tr>
						`
								: ""
						}
						<tr>
							<td style="font-size: 15px; font-weight: bold; color: #2c5b42; padding-top: 12px; border-top: 1px solid #dde8e3;">Total</td>
							<td style="font-size: 15px; font-weight: bold; color: #2c5b42; text-align: right; padding-top: 12px; border-top: 1px solid #dde8e3;">${formatPrice(input.total)}</td>
						</tr>
					</table>
				</div>

				<!-- Delivery Address -->
				<div style="padding: 0 40px 32px;">
					<h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 10px; border-bottom: 2px solid #2c5b42; padding-bottom: 8px;">Delivery Address</h3>
					<p style="font-size: 14px; color: #555; line-height: 1.8; margin: 0;">
						${deliveryAddress.address || ""}${deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}${deliveryAddress.state ? `, ${deliveryAddress.state}` : ""}${deliveryAddress.country ? `, ${deliveryAddress.country}` : ""}${deliveryAddress.postalCode ? ` ${deliveryAddress.postalCode}` : ""}
						<br/>
						📞 ${deliveryAddress.phone || ""}${deliveryAddress.secondaryPhone ? ` / ${deliveryAddress.secondaryPhone}` : ""}
					</p>
					${
						input.interstateDeliveryType === "pickup" && input.gigPark
							? `<p style="font-size: 14px; color: #555; line-height: 1.8; margin: 12px 0 0 0;"><strong style="color: #2c5b42;">GIG Pick-Up Park:</strong> ${input.gigPark}</p>`
							: ""
					}
				</div>

				<!-- CTA -->
				<div style="padding: 0 40px 40px; text-align: center;">
					<a href="https://sartorial.ng" target="_blank" style="background-color: #2c5b42; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Continue Shopping</a>
				</div>

				<!-- Footer -->
				<div style="padding: 20px; background-color: #fdfdfd; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
					<p style="margin: 5px 0;">Questions? Reply to this email or contact us at info@sartorial.ng</p>
					<p style="margin: 5px 0;">&copy; 2026 Sartorial. All rights reserved.</p>
				</div>
			</div>
		</div>
	`;
};

export const sendOrderConfirmationEmail = async (
	input: OrderInput,
	orderNumber: string,
) => {
	await resend.emails.send({
		from: "Sartorial <noreply@sartorial.ng>",
		to: input.emailAddress,
		subject: `Order confirmed — ${orderNumber} 🛍️`,
		html: buildOrderConfirmationHtml(input, orderNumber),
	});
};
