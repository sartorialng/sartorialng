#!/usr/bin/env node
/**
 * Replays a signed `charge.success` event at a running server, so the webhook
 * handler can be exercised locally without Paystack being able to reach you.
 *
 * The signature is computed exactly the way Paystack computes it (HMAC-SHA512
 * of the raw body using the secret key), so this exercises the real signature
 * check rather than bypassing it.
 *
 * Usage:
 *   npm run webhook:replay -- --product <sanityProductId>
 *   npm run webhook:replay -- --reference <realTestModeReference>
 *
 * Flags:
 *   --url <url>         Target. Default http://localhost:3000/api/paystack/webhook
 *   --reference <ref>   Reuse an existing reference. With --thin, the handler
 *                       will re-fetch metadata from Paystack (needs a real
 *                       test-mode transaction and matching test secret key).
 *   --product <id>      Sanity product _id to put on the order line.
 *   --email <address>   Recipient of the confirmation email. Use your own.
 *   --amount <naira>    Order total in naira. Default 1000.
 *   --thin              Send an event with no metadata, to test the handler's
 *                       re-verification path against the Paystack API.
 *
 * Orders it creates carry the note "Replayed webhook — local test" and a
 * reference prefixed `local-`, so they are easy to find and delete afterwards.
 */

import crypto from "node:crypto";

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const secret = process.env.PAYSTACK_SECRET_KEY;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

if (!secret) {
	console.error(
		"✖ PAYSTACK_SECRET_KEY is not set. Run via: npm run webhook:replay -- ...",
	);
	process.exit(1);
}

if (dataset === "production") {
	console.warn(`
⚠  Writing to the "production" dataset.

   This creates a real order, decrements real product stock and sends a real
   confirmation email. Clean up afterwards:
     · delete the order document in Sanity Studio
     · restore the stock on the product you used
`);
}

const url = flag("url", "http://localhost:3000/api/paystack/webhook");
const reference = flag("reference", `local-${Date.now()}`);
const email = flag("email", "test@example.com");
const amountNaira = Number(flag("amount", "1000"));
const thin = has("thin");

/** Pull a real product _id so the order line resolves to something in Sanity. */
const fetchAProductId = async () => {
	if (!projectId || !dataset) return null;
	const query = encodeURIComponent(
		`*[_type == "product" && defined(stock)][0]{_id, name, stock}`,
	);
	const endpoint = `https://${projectId}.api.sanity.io/v2026-02-05/data/query/${dataset}?query=${query}`;
	const headers = process.env.SANITY_API_READ_TOKEN
		? { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` }
		: {};
	try {
		const res = await fetch(endpoint, { headers });
		const body = await res.json();
		return body?.result ?? null;
	} catch {
		return null;
	}
};

let productId = flag("product");
let productName = "Test Product";

if (!productId && !thin) {
	const product = await fetchAProductId();
	if (!product?._id) {
		console.error(
			"✖ Could not auto-pick a product from Sanity. Pass --product <sanityProductId>.",
		);
		process.exit(1);
	}
	productId = product._id;
	productName = product.name || productName;
	console.log(
		`ℹ Using product ${productName} (${productId}, stock ${product.stock})`,
	);
}

const metadata = thin
	? {}
	: {
			order: {
				email,
				customerName: "Local Test",
				firstName: "Local",
				clerkUserId: null,
				subtotal: amountNaira,
				shipping: 0,
				vat: 0,
				total: amountNaira,
				amountDiscount: 0,
				couponCode: null,
				orderNote: "Replayed webhook — local test",
				shippingAddress: {
					address: "1 Test Close",
					city: "Ikeja",
					state: "Lagos",
					country: "Nigeria",
					postalCode: "100001",
					phone: "08000000000",
				},
				interstateDeliveryType: null,
				gigPark: null,
				items: [
					{
						_id: productId,
						name: productName,
						price: amountNaira,
						quantity: 1,
						isFreeGift: false,
						imageRef: null,
						selectedColor: null,
					},
				],
			},
		};

const event = {
	event: "charge.success",
	data: {
		reference,
		status: "success",
		amount: Math.round(amountNaira * 100),
		paid_at: new Date().toISOString(),
		currency: "NGN",
		customer: {
			id: 1234567,
			email,
			customer_code: "CUS_localtest",
		},
		metadata,
	},
};

const body = JSON.stringify(event);
const signature = crypto
	.createHmac("sha512", secret)
	.update(body)
	.digest("hex");

console.log(`\n→ POST ${url}`);
console.log(`  reference: ${reference}`);
console.log(`  dataset:   ${dataset}`);
console.log(`  email:     ${email}`);
console.log(`  metadata:  ${thin ? "none (tests re-verify path)" : "inline"}\n`);

const res = await fetch(url, {
	method: "POST",
	headers: {
		"Content-Type": "application/json",
		"x-paystack-signature": signature,
	},
	body,
});

const text = await res.text();
console.log(`← ${res.status} ${res.statusText}`);
console.log(text);

// Replaying the same reference twice must not create a second order.
if (res.ok && !has("no-idempotency-check")) {
	const second = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-paystack-signature": signature,
		},
		body,
	});
	const secondText = await second.text();
	console.log(`\n← replay (idempotency check) ${second.status}`);
	console.log(secondText);
	console.log(
		secondText.includes("already processed")
			? "\n✓ Idempotent: the replay did not create a second order.\n"
			: "\n⚠ Expected 'Order already processed' on the replay — check fulfillOrder.\n",
	);
}
