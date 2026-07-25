import { adminClient } from "@/sanity/lib/sanity.admin";
import { sendOrderConfirmationEmail } from "./orderEmail";
import type { FulfillResult, OrderInput } from "./types";

/**
 * Sanity document IDs allow [A-Za-z0-9._-]. Deriving the ID from the payment
 * reference is what makes fulfilment idempotent: the browser callback, the
 * Paystack webhook and the verify endpoint all compute the same ID, so only
 * the first one to call `create()` wins and the rest get a 409.
 */
export const orderDocIdForReference = (reference: string) =>
	`order-${String(reference).replace(/[^A-Za-z0-9._-]/g, "-")}`;

const isConflict = (error: unknown) => {
	const err = error as { statusCode?: number; message?: string };
	return (
		err?.statusCode === 409 ||
		/already exists|document already exists|conflict/i.test(
			err?.message || "",
		)
	);
};

/**
 * Claims the right to send the confirmation email using an optimistic-lock
 * patch, so a webhook retry (or a race with the browser callback) can't send
 * the customer a second copy. Returns false if someone else already claimed it.
 */
const claimConfirmationEmail = async (docId: string) => {
	const doc = await adminClient.fetch<{
		_rev: string;
		confirmationEmailSentAt?: string;
	} | null>(`*[_id == $id][0]{_rev, confirmationEmailSentAt}`, { id: docId });

	if (!doc || doc.confirmationEmailSentAt) return false;

	try {
		await adminClient
			.patch(docId)
			.ifRevisionId(doc._rev)
			.set({ confirmationEmailSentAt: new Date().toISOString() })
			.commit();
		return true;
	} catch {
		// Lost the race — another path is sending it.
		return false;
	}
};

const deductStock = async (input: OrderInput, orderNumber: string) => {
	const productIds = input.items.map((item) => item._id);
	const products = await adminClient.fetch<
		Array<{ _id: string; stock: number | null; name: string | null }>
	>(`*[_type == "product" && _id in $ids]{_id, stock, name}`, {
		ids: productIds,
	});

	const productMap = new Map(products.map((p) => [p._id, p]));
	const transaction = adminClient.transaction();
	let hasPatches = false;

	for (const item of input.items) {
		const product = productMap.get(item._id);
		if (!product || typeof product.stock !== "number") continue;

		transaction.patch(item._id, (p) => p.dec({ stock: item.quantity }));
		hasPatches = true;

		const draftExists = await adminClient.fetch(
			`*[_id == $draftId][0]._id`,
			{ draftId: `drafts.${item._id}` },
		);
		if (draftExists) transaction.delete(`drafts.${item._id}`);
	}

	if (!hasPatches) return;

	try {
		await transaction.commit();
	} catch (error) {
		console.error(
			"🚨 CRITICAL: Stock deduction failed for order:",
			orderNumber,
			error,
		);
	}
};

const redeemCoupon = async (input: OrderInput) => {
	if (!input.couponCode || !input.emailAddress) return;

	try {
		const coupon = await adminClient.fetch(
			`*[_type == "coupon" && code == $code][0]`,
			{ code: input.couponCode.toUpperCase().trim() },
		);
		if (!coupon) return;

		const newUsedCount = (coupon.usedCount || 0) + 1;
		const isGeneralCoupon = !coupon.assignedTo;

		if (isGeneralCoupon) {
			// General coupon — track per-user redemption, never deactivate based
			// on usageLimit (one-per-person is enforced via redeemedBy).
			await adminClient
				.patch(coupon._id)
				.set({ usedCount: newUsedCount })
				.setIfMissing({ redeemedBy: [] })
				.append("redeemedBy", [input.emailAddress])
				.commit();
		} else {
			await adminClient
				.patch(coupon._id)
				.set({
					usedCount: newUsedCount,
					...(coupon.usageLimit &&
						newUsedCount >= coupon.usageLimit && {
							isActive: false,
						}),
				})
				.commit();
		}
	} catch (error) {
		console.error("⚠️ Coupon redemption failed:", error);
	}
};

const buildOrderDoc = (
	input: OrderInput,
	docId: string,
): Record<string, any> & { _id: string; _type: string; orderNumber: string } => {
	const sanityProducts = input.items.map((item, index) => {
		const productData: Record<string, unknown> = {
			_key: `${item._id}-${index}`,
			product: { _type: "reference", _ref: item._id },
			productName: item.name,
			productPrice: item.isFreeGift ? 0 : item.price,
			quantity: item.quantity,
			isFreeGift: item.isFreeGift === true,
		};

		if (item.imageRef) {
			productData.productImage = {
				_type: "image",
				asset: { _type: "reference", _ref: item.imageRef },
			};
		}

		if (item.selectedColor) {
			productData.selectedColor = {
				colorId: item.selectedColor.colorId,
				colorTitle: item.selectedColor.colorTitle,
			};
		}

		return productData;
	});

	const isInterstate =
		input.shippingAddress?.country === "Nigeria" &&
		input.shippingAddress?.state !== "Lagos";

	return {
		_id: docId,
		_type: "order",
		orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
		customerName: input.customerName,
		email: input.emailAddress,
		clerkUserId: input.clerkUserId || null,
		products: sanityProducts,
		totalPrice: input.total,
		shippingCost: input.shipping,
		subtotal: input.subtotal,
		vat: input.vat,
		currency: input.paymentMethod === "paypal" ? "USD" : "NGN",
		status: "paid",
		orderDate: input.orderDate || new Date().toISOString(),
		orderNote: input.orderNote || undefined,
		shippingAddress: input.shippingAddress,
		amountDiscount: input.amountDiscount || 0,
		...(input.paymentMethod === "paypal"
			? { paypalOrderId: input.paymentReference, paymentMethod: "paypal" }
			: {
					paystackReference: input.paymentReference,
					paymentMethod: "paystack",
				}),
		...(isInterstate && input.interstateDeliveryType
			? {
					deliveryType: input.interstateDeliveryType,
					...(input.interstateDeliveryType === "pickup" && input.gigPark
						? { gigPark: input.gigPark }
						: {}),
				}
			: {}),
	};
};

/**
 * Creates the order, deducts stock, redeems the coupon and emails the customer.
 *
 * Safe to call any number of times with the same payment reference and from any
 * number of concurrent callers — only the first call does the work. If an
 * earlier call created the order but died before emailing, a later call will
 * pick the email back up.
 */
export const fulfillOrder = async (
	input: OrderInput,
): Promise<FulfillResult> => {
	if (!input.paymentReference) throw new Error("Missing payment reference");
	if (!input.emailAddress) throw new Error("Missing customer email");
	if (!Array.isArray(input.items) || input.items.length === 0) {
		throw new Error("Cart is empty");
	}

	const docId = orderDocIdForReference(input.paymentReference);

	// Orders written before deterministic IDs existed have random _ids, so a
	// reference lookup is still needed to avoid duplicating them.
	const legacyOrder = await adminClient.fetch<{
		_id: string;
		orderNumber: string;
	} | null>(
		`*[_type == "order" && _id != $docId &&
		  (paystackReference == $ref || paypalOrderId == $ref)][0]{_id, orderNumber}`,
		{ ref: input.paymentReference, docId },
	);

	if (legacyOrder) {
		return {
			success: true,
			alreadyFulfilled: true,
			order: legacyOrder,
		};
	}

	const doc = buildOrderDoc(input, docId);

	let created = false;
	try {
		await adminClient.create(doc);
		created = true;
	} catch (error) {
		if (!isConflict(error)) throw error;
		// Another path already created this order — fall through so we can
		// still finish the email if that path died before sending it.
	}

	if (created) {
		await deductStock(input, doc.orderNumber);
		await redeemCoupon(input);
	}

	// When another path created the document, its order number — not the one we
	// just generated — is what the customer sees in Sanity and on the site.
	const orderNumber = created
		? doc.orderNumber
		: ((await adminClient.fetch<string | null>(
				`*[_id == $id][0].orderNumber`,
				{ id: docId },
			)) ?? doc.orderNumber);

	if (await claimConfirmationEmail(docId)) {
		try {
			await sendOrderConfirmationEmail(input, orderNumber);
			console.log("✅ Order confirmation email sent to:", input.emailAddress);
		} catch (emailError) {
			// Release the claim so a webhook retry can try again.
			await adminClient
				.patch(docId)
				.unset(["confirmationEmailSentAt"])
				.commit()
				.catch(() => {});
			console.error(
				"⚠️ Order confirmation email failed for order:",
				orderNumber,
				emailError,
			);
		}
	}

	return {
		success: true,
		alreadyFulfilled: !created,
		order: { _id: docId, orderNumber },
	};
};
