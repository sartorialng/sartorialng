import { Product } from "../../../../../sanity.types";
import { adminClient } from "../../../../sanity/lib/sanity.admin";
import { NextResponse } from "next/server";

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
			amountDiscount,
			couponCode,
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

			if (product.stock < item.quantity) {
				return NextResponse.json(
					{
						error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
						insufficientStock: true,
						product: {
							name: product.name,
							available: product.stock,
							requested: item.quantity,
						},
					},
					{ status: 400 },
				);
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
				quantity: item.quantity,
			};

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
			currency: paymentMethod === "paypal" ? "USD" : "NGN",
			status: "paid",
			orderDate: new Date().toISOString(),
			shippingAddress: shippingAddressData,
			amountDiscount: amountDiscount || 0,
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
			// Order exists but stock wasn't deducted — flag for manual review
			console.error(
				"🚨 CRITICAL: Stock deduction failed for order:",
				newOrder.orderNumber,
				error,
			);
		}

		// // After order is created successfully, redeem coupon if one was applied
		// if (couponCode) {
		// 	const coupon = await adminClient.fetch(
		// 		`*[_type == "coupon" && code == $code][0]`,
		// 		{ code: couponCode.toUpperCase().trim() },
		// 	);

		// 	if (coupon) {
		// 		await adminClient
		// 			.patch(coupon._id)
		// 			.set({ usedCount: (coupon.usedCount || 0) + 1 })
		// 			.setIfMissing({ redeemedBy: [] })
		// 			.append("redeemedBy", [emailAddress])
		// 			.commit();

		// 		// Deactivate if usage limit is now reached
		// 		const newUsedCount = (coupon.usedCount || 0) + 1;
		// 		if (coupon.usageLimit && newUsedCount >= coupon.usageLimit) {
		// 			await adminClient
		// 				.patch(coupon._id)
		// 				.set({ isActive: false })
		// 				.commit();
		// 		}
		// 	}
		// }

		if (couponCode && emailAddress) {
			const coupon = await adminClient.fetch(
				`*[_type == "coupon" && code == $code][0]`,
				{ code: couponCode.toUpperCase().trim() },
			);

			if (coupon) {
				const newUsedCount = (coupon.usedCount || 0) + 1;
				const isGeneralCoupon = !coupon.assignedTo;

				if (isGeneralCoupon) {
					// General coupon — track per-user redemption, never deactivate based on usageLimit
					// (usageLimit on general coupons = ignored, one-per-person is enforced via redeemedBy)
					await adminClient
						.patch(coupon._id)
						.set({ usedCount: newUsedCount })
						.setIfMissing({ redeemedBy: [] })
						.append("redeemedBy", [emailAddress])
						.commit();
				} else {
					// Personal coupon — assigned to a specific email, just increment count and deactivate when exhausted
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
