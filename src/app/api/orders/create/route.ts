// import { Product } from "../../../../../sanity.types";
// import { adminClient } from "../../../../sanity/lib/sanity.admin";
// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
// 	try {
// 		const body = await req.json();

// 		const {
// 			firstName,
// 			lastName,
// 			address,
// 			country,
// 			state,
// 			area,
// 			postalCode,
// 			phoneNo,
// 			secondaryPhoneNo,
// 			emailAddress,
// 			shipToDifferentAddress,
// 			shippingAddress,
// 			shippingCountry,
// 			shippingState,
// 			shippingArea,
// 			shippingPostalCode,
// 			shippingPhoneNo,
// 			shippingSecondaryPhoneNo,
// 			clerkUserId,
// 			clerkUserName,
// 			items,
// 			paymentReference,
// 			paymentMethod,
// 			total,
// 			shipping: shippingCost,
// 			subtotal,
// 			vat,
// 			amountDiscount,
// 			couponCode,
// 			orderNote,
// 		} = body;

// 		// Validate required fields
// 		if (!items || !paymentReference || !paymentMethod || !emailAddress) {
// 			return NextResponse.json(
// 				{ error: "Missing required fields" },
// 				{ status: 400 },
// 			);
// 		}

// 		// Check if items array is not empty
// 		if (!Array.isArray(items) || items.length === 0) {
// 			return NextResponse.json(
// 				{ error: "Cart is empty" },
// 				{ status: 400 },
// 			);
// 		}

// 		// ✅ DUPLICATE PREVENTION: Check if order already exists
// 		const existingOrder = await adminClient.fetch(
// 			`*[_type == "order" &&
// 			  (paystackReference == $ref || paypalOrderId == $ref)][0]{
// 			  	_id,
// 			  	orderNumber
// 			  }`,
// 			{ ref: paymentReference },
// 		);

// 		if (existingOrder) {
// 			console.log(
// 				"⚠️ Duplicate order detected:",
// 				existingOrder.orderNumber,
// 			);
// 			return NextResponse.json({
// 				success: true,
// 				order: {
// 					orderNumber: existingOrder.orderNumber,
// 					_id: existingOrder._id,
// 				},
// 				message: "Order already exists",
// 				isDuplicate: true,
// 			});
// 		}

// 		// ✅ INVENTORY VALIDATION: Check stock availability BEFORE creating order
// 		const productIds = items.map((item: Product) => item._id);
// 		const products: Product[] = await adminClient.fetch(
// 			`*[_type == "product" && _id in $ids]{_id, stock, name}`,
// 			{ ids: productIds },
// 		);

// 		// Create a map for quick lookup
// 		const productMap = new Map(products.map((p: Product) => [p._id, p]));

// 		// Validate stock for each item
// 		for (const item of items) {
// 			const product = productMap.get(item._id);

// 			if (!product) {
// 				return NextResponse.json(
// 					{ error: `Product ${item.name} not found in database` },
// 					{ status: 404 },
// 				);
// 			}

// 			if (product.stock === null || product.stock === undefined) {
// 				console.warn(`⚠️ Product ${product.name} has no stock field`);
// 				continue;
// 			}

// 		}

// 		// Map items to Sanity products format
// 		const sanityProducts = items.map((item: any, index: number) => {
// 			const productData: any = {
// 				_key: `${item._id}-${Date.now()}-${index}`,
// 				product: {
// 					_type: "reference",
// 					_ref: item._id,
// 				},
// 				quantity: item.quantity,
// 			};

// 			if (item.selectedColor) {
// 				productData.selectedColor = {
// 					colorId: item.selectedColor.colorId,
// 					colorTitle: item.selectedColor.colorTitle,
// 				};
// 			} else {
// 				console.log(`⚠️ No selectedColor found for item: ${item.name}`);
// 			}

// 			return productData;
// 		});

// 		// Prepare shipping address
// 		const shippingAddressData = {
// 			address: shipToDifferentAddress ? shippingAddress : address,
// 			city: shipToDifferentAddress ? shippingArea : area,
// 			state: shipToDifferentAddress ? shippingState : state,
// 			country: shipToDifferentAddress ? shippingCountry : country,
// 			postalCode: shipToDifferentAddress
// 				? shippingPostalCode
// 				: postalCode,
// 			phone: shipToDifferentAddress ? shippingPhoneNo : phoneNo,
// 			secondaryPhone: shipToDifferentAddress
// 				? shippingSecondaryPhoneNo
// 				: secondaryPhoneNo,
// 		};

// 		// Prepare order data
// 		const orderData: any = {
// 			_type: "order",
// 			orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
// 			customerName: clerkUserName || `${firstName} ${lastName}`,
// 			email: emailAddress,
// 			clerkUserId: clerkUserId || null,
// 			products: sanityProducts,
// 			totalPrice: total,
// 			shippingCost: shippingCost,
// 			subtotal: subtotal,
// 			vat,
// 			currency: paymentMethod === "paypal" ? "USD" : "NGN",
// 			status: "paid",
// 			orderDate: new Date().toISOString(),
// 			orderNote: orderNote,
// 			shippingAddress: shippingAddressData,
// 			amountDiscount: amountDiscount || 0,
// 		};

// 		// Add payment method specific fields
// 		if (paymentMethod === "paypal") {
// 			orderData.paypalOrderId = paymentReference;
// 			orderData.paymentMethod = "paypal";
// 		} else if (paymentMethod === "paystack") {
// 			orderData.paystackReference = paymentReference;
// 			orderData.paymentMethod = "paystack";
// 		}

// 		// ✅ RACE CONDITION GUARD: Re-check right before creation
// 		const doubleCheckOrder = await adminClient.fetch(
// 			`*[_type == "order" &&
// 			  (paystackReference == $ref || paypalOrderId == $ref)][0]._id`,
// 			{ ref: paymentReference },
// 		);

// 		if (doubleCheckOrder) {
// 			console.log("⚠️ Race condition caught — order already exists");
// 			return NextResponse.json({
// 				success: true,
// 				isDuplicate: true,
// 				message: "Order already exists",
// 			});
// 		}

// 		// ✅ CREATE ORDER
// 		const newOrder = await adminClient.create(orderData);
// 		console.log("✅ Order created:", newOrder.orderNumber);

// 		// ✅ INVENTORY DEDUCTION: Update stock for each product
// 		let transaction = adminClient.transaction();

// 		for (const item of items) {
// 			const product = productMap.get(item._id);

// 			if (product && typeof product.stock === "number") {
// 				// Deduct stock from published document
// 				transaction.patch(item._id, (p) =>
// 					p.dec({ stock: item.quantity }),
// 				);

// 				// Only delete draft if it actually exists
// 				const draftExists = await adminClient.fetch(
// 					`*[_id == $draftId][0]._id`,
// 					{ draftId: `drafts.${item._id}` },
// 				);

// 				if (draftExists) {
// 					transaction.delete(`drafts.${item._id}`);
// 				}
// 			}
// 		}

// 		try {
// 			await transaction.commit();
// 			console.log(
// 				"✅ Stock updated successfully for order:",
// 				newOrder.orderNumber,
// 			);
// 		} catch (error) {
// 			console.error(
// 				"🚨 CRITICAL: Stock deduction failed for order:",
// 				newOrder.orderNumber,
// 				error,
// 			);
// 		}

// 		if (couponCode && emailAddress) {
// 			const coupon = await adminClient.fetch(
// 				`*[_type == "coupon" && code == $code][0]`,
// 				{ code: couponCode.toUpperCase().trim() },
// 			);

// 			if (coupon) {
// 				const newUsedCount = (coupon.usedCount || 0) + 1;
// 				const isGeneralCoupon = !coupon.assignedTo;

// 				if (isGeneralCoupon) {
// 					// General coupon — track per-user redemption, never deactivate based on usageLimit
// 					// (usageLimit on general coupons = ignored, one-per-person is enforced via redeemedBy)
// 					await adminClient
// 						.patch(coupon._id)
// 						.set({ usedCount: newUsedCount })
// 						.setIfMissing({ redeemedBy: [] })
// 						.append("redeemedBy", [emailAddress])
// 						.commit();
// 				} else {
// 					// Personal coupon — assigned to a specific email, just increment count and deactivate when exhausted
// 					const patch = adminClient.patch(coupon._id).set({
// 						usedCount: newUsedCount,
// 						...(coupon.usageLimit &&
// 							newUsedCount >= coupon.usageLimit && {
// 								isActive: false,
// 							}),
// 					});

// 					await patch.commit();
// 				}
// 			}
// 		}

// 		return NextResponse.json({
// 			success: true,
// 			order: {
// 				orderNumber: newOrder.orderNumber,
// 				_id: newOrder._id,
// 			},
// 			message: "Order created successfully",
// 		});
// 	} catch (error) {
// 		console.error("❌ Order creation error:", error);
// 		return NextResponse.json(
// 			{
// 				error: "Failed to create order",
// 				details:
// 					error instanceof Error ? error.message : "Unknown error",
// 			},
// 			{ status: 500 },
// 		);
// 	}
// }

import { Product } from "../../../../../sanity.types";
import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

		// Validate required fields
		if (!items || !paymentReference || !paymentMethod || !emailAddress) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Check if items array is not empty
		if (!Array.isArray(items) || items.length === 0) {
			return NextResponse.json(
				{ error: "Cart is empty" },
				{ status: 400 },
			);
		}

		// ✅ DUPLICATE PREVENTION: Check if order already exists
		const existingOrder = await adminClient.fetch(
			`*[_type == "order" && 
			  (paystackReference == $ref || paypalOrderId == $ref)][0]{
			  	_id, 
			  	orderNumber
			  }`,
			{ ref: paymentReference },
		);

		if (existingOrder) {
			console.log(
				"⚠️ Duplicate order detected:",
				existingOrder.orderNumber,
			);
			return NextResponse.json({
				success: true,
				order: {
					orderNumber: existingOrder.orderNumber,
					_id: existingOrder._id,
				},
				message: "Order already exists",
				isDuplicate: true,
			});
		}

		// ✅ INVENTORY VALIDATION: Check stock availability BEFORE creating order
		const productIds = items.map((item: Product) => item._id);
		const products: Product[] = await adminClient.fetch(
			`*[_type == "product" && _id in $ids]{_id, stock, name}`,
			{ ids: productIds },
		);

		// Create a map for quick lookup
		const productMap = new Map(products.map((p: Product) => [p._id, p]));

		// Validate stock for each item
		for (const item of items) {
			const product = productMap.get(item._id);

			if (!product) {
				return NextResponse.json(
					{ error: `Product ${item.name} not found in database` },
					{ status: 404 },
				);
			}

			if (product.stock === null || product.stock === undefined) {
				console.warn(`⚠️ Product ${product.name} has no stock field`);
				continue;
			}
		}

		// Map items to Sanity products format
		const sanityProducts = items.map((item: any, index: number) => {
			const productData: any = {
				_key: `${item._id}-${Date.now()}-${index}`,
				product: {
					_type: "reference",
					_ref: item._id,
				},
				productName: item.name,
				productPrice: item.price,
				quantity: item.quantity,
			};

			if (item.image?.asset?._ref) {
				productData.productImage = {
					_type: "image",
					asset: {
						_type: "reference",
						_ref: item.image.asset._ref,
					},
				};
			}

			if (item.selectedColor) {
				productData.selectedColor = {
					colorId: item.selectedColor.colorId,
					colorTitle: item.selectedColor.colorTitle,
				};
			} else {
				console.log(`⚠️ No selectedColor found for item: ${item.name}`);
			}

			return productData;
		});

		// Prepare shipping address
		const shippingAddressData = {
			address: shipToDifferentAddress ? shippingAddress : address,
			city: shipToDifferentAddress ? shippingArea : area,
			state: shipToDifferentAddress ? shippingState : state,
			country: shipToDifferentAddress ? shippingCountry : country,
			postalCode: shipToDifferentAddress
				? shippingPostalCode
				: postalCode,
			phone: shipToDifferentAddress ? shippingPhoneNo : phoneNo,
			secondaryPhone: shipToDifferentAddress
				? shippingSecondaryPhoneNo
				: secondaryPhoneNo,
		};

		// Prepare order data
		const orderData: any = {
			_type: "order",
			orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
			customerName: clerkUserName || `${firstName} ${lastName}`,
			email: emailAddress,
			clerkUserId: clerkUserId || null,
			products: sanityProducts,
			totalPrice: total,
			shippingCost: shippingCost,
			subtotal: subtotal,
			vat,
			currency: paymentMethod === "paypal" ? "USD" : "NGN",
			status: "paid",
			orderDate: new Date().toISOString(),
			orderNote: orderNote,
			shippingAddress: shippingAddressData,
			amountDiscount: amountDiscount || 0,
			...(() => {
				const effectiveState = shipToDifferentAddress ? shippingState : state;
				const effectiveCountry = shipToDifferentAddress ? shippingCountry : country;
				const isInterstate = effectiveCountry === "Nigeria" && effectiveState !== "Lagos";
				if (!isInterstate || !interstateDeliveryType) return {};
				const effectiveGigPark = shipToDifferentAddress ? shippingGigPark : gigPark;
				return {
					deliveryType: interstateDeliveryType,
					...(interstateDeliveryType === "pickup" && effectiveGigPark ? { gigPark: effectiveGigPark } : {}),
				};
			})(),
		};

		// Add payment method specific fields
		if (paymentMethod === "paypal") {
			orderData.paypalOrderId = paymentReference;
			orderData.paymentMethod = "paypal";
		} else if (paymentMethod === "paystack") {
			orderData.paystackReference = paymentReference;
			orderData.paymentMethod = "paystack";
		}

		// ✅ RACE CONDITION GUARD: Re-check right before creation
		const doubleCheckOrder = await adminClient.fetch(
			`*[_type == "order" && 
			  (paystackReference == $ref || paypalOrderId == $ref)][0]._id`,
			{ ref: paymentReference },
		);

		if (doubleCheckOrder) {
			console.log("⚠️ Race condition caught — order already exists");
			return NextResponse.json({
				success: true,
				isDuplicate: true,
				message: "Order already exists",
			});
		}

		// ✅ CREATE ORDER
		const newOrder = await adminClient.create(orderData);
		console.log("✅ Order created:", newOrder.orderNumber);

		// ✅ INVENTORY DEDUCTION: Update stock for each product
		let transaction = adminClient.transaction();

		for (const item of items) {
			const product = productMap.get(item._id);

			if (product && typeof product.stock === "number") {
				// Deduct stock from published document
				transaction.patch(item._id, (p) =>
					p.dec({ stock: item.quantity }),
				);

				// Only delete draft if it actually exists
				const draftExists = await adminClient.fetch(
					`*[_id == $draftId][0]._id`,
					{ draftId: `drafts.${item._id}` },
				);

				if (draftExists) {
					transaction.delete(`drafts.${item._id}`);
				}
			}
		}

		try {
			await transaction.commit();
			console.log(
				"✅ Stock updated successfully for order:",
				newOrder.orderNumber,
			);
		} catch (error) {
			console.error(
				"🚨 CRITICAL: Stock deduction failed for order:",
				newOrder.orderNumber,
				error,
			);
		}

		if (couponCode && emailAddress) {
			const coupon = await adminClient.fetch(
				`*[_type == "coupon" && code == $code][0]`,
				{ code: couponCode.toUpperCase().trim() },
			);

			if (coupon) {
				const newUsedCount = (coupon.usedCount || 0) + 1;
				const isGeneralCoupon = !coupon.assignedTo;

				if (isGeneralCoupon) {
					await adminClient
						.patch(coupon._id)
						.set({ usedCount: newUsedCount })
						.setIfMissing({ redeemedBy: [] })
						.append("redeemedBy", [emailAddress])
						.commit();
				} else {
					const patch = adminClient.patch(coupon._id).set({
						usedCount: newUsedCount,
						...(coupon.usageLimit &&
							newUsedCount >= coupon.usageLimit && {
								isActive: false,
							}),
					});

					await patch.commit();
				}
			}
		}

		// ✅ SEND ORDER CONFIRMATION EMAIL
		try {
			const currency = paymentMethod === "paypal" ? "USD" : "NGN";
			const currencySymbol = paymentMethod === "paypal" ? "$" : "₦";

			const formatPrice = (amount: number) =>
				`${currencySymbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

			const deliveryAddress = shippingAddressData;

			const itemRowsHtml = items
				.map(
					(item: any) => `
				<tr>
					<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
						${item.name}
						${item.selectedColor?.colorTitle ? `<span style="display: block; font-size: 12px; color: #888; margin-top: 2px;">Colour: ${item.selectedColor.colorTitle}</span>` : ""}
					</td>
					<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #555; text-align: center;">
						${item.quantity}
					</td>
					<td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; color: #333; text-align: right;">
						${formatPrice(item.price * item.quantity)}
					</td>
				</tr>
			`,
				)
				.join("");

			const customerName =
				firstName || clerkUserName?.split(" ")[0] || "there";

			await resend.emails.send({
				from: "Sartorial <noreply@sartorial.ng>",
				to: emailAddress,
				subject: `Order confirmed — ${newOrder.orderNumber} 🛍️`,
				html: `
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
									<span style="font-size: 20px; font-weight: bold; color: #2c5b42; letter-spacing: 3px;">${newOrder.orderNumber}</span>
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
										<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(subtotal)}</td>
									</tr>
									${
										shippingCost > 0
											? `
									<tr>
										<td style="font-size: 13px; color: #666; padding: 4px 0;">Shipping</td>
										<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(shippingCost)}</td>
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
										vat > 0
											? `
									<tr>
										<td style="font-size: 13px; color: #666; padding: 4px 0;">VAT</td>
										<td style="font-size: 13px; color: #333; text-align: right; padding: 4px 0;">${formatPrice(vat)}</td>
									</tr>
									`
											: ""
									}
									${
										amountDiscount > 0
											? `
									<tr>
										<td style="font-size: 13px; color: #666; padding: 4px 0;">Discount ${couponCode ? `(${couponCode})` : ""}</td>
										<td style="font-size: 13px; color: #c0392b; text-align: right; padding: 4px 0;">− ${formatPrice(amountDiscount)}</td>
									</tr>
									`
											: ""
									}
									<tr>
										<td style="font-size: 15px; font-weight: bold; color: #2c5b42; padding-top: 12px; border-top: 1px solid #dde8e3;">Total</td>
										<td style="font-size: 15px; font-weight: bold; color: #2c5b42; text-align: right; padding-top: 12px; border-top: 1px solid #dde8e3;">${formatPrice(total)}</td>
									</tr>
								</table>
							</div>

							<!-- Delivery Address -->
							<div style="padding: 0 40px 32px;">
								<h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2c5b42; margin-bottom: 10px; border-bottom: 2px solid #2c5b42; padding-bottom: 8px;">Delivery Address</h3>
								<p style="font-size: 14px; color: #555; line-height: 1.8; margin: 0;">
									${deliveryAddress.address}${deliveryAddress.city ? `, ${deliveryAddress.city}` : ""}${deliveryAddress.state ? `, ${deliveryAddress.state}` : ""}${deliveryAddress.country ? `, ${deliveryAddress.country}` : ""}${deliveryAddress.postalCode ? ` ${deliveryAddress.postalCode}` : ""}
									<br/>
									📞 ${deliveryAddress.phone}${deliveryAddress.secondaryPhone ? ` / ${deliveryAddress.secondaryPhone}` : ""}
								</p>
								${(() => {
									const effectiveGigPark = shipToDifferentAddress ? shippingGigPark : gigPark;
									return interstateDeliveryType === "pickup" && effectiveGigPark
										? `<p style="font-size: 14px; color: #555; line-height: 1.8; margin: 12px 0 0 0;"><strong style="color: #2c5b42;">GIG Pick-Up Park:</strong> ${effectiveGigPark}</p>`
										: "";
								})()}
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
				`,
			});

			console.log("✅ Order confirmation email sent to:", emailAddress);
		} catch (emailError) {
			// Don't fail the order if email fails — just log it
			console.error(
				"⚠️ Order confirmation email failed for order:",
				newOrder.orderNumber,
				emailError,
			);
		}

		return NextResponse.json({
			success: true,
			order: {
				orderNumber: newOrder.orderNumber,
				_id: newOrder._id,
			},
			message: "Order created successfully",
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
