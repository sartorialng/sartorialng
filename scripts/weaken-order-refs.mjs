#!/usr/bin/env node
/**
 * One-time backfill: marks every order.products[].product reference as weak.
 *
 * Orders written before Sept 2026 hold strong references to the products they
 * contain, which makes Sanity refuse to delete those products from the Studio.
 * fulfillOrder now writes weak references; this brings the existing orders in
 * line so any product can be deleted regardless of when it was sold. The
 * `_ref` is kept as-is, and the order's name/price snapshots are untouched.
 *
 * Usage:
 *   node --env-file=.env.local scripts/weaken-order-refs.mjs           # dry run
 *   node --env-file=.env.local scripts/weaken-order-refs.mjs --apply   # commit
 *
 * Safe to re-run: lines that are already weak are skipped.
 */

import { createClient } from "@sanity/client";

const apply = process.argv.slice(2).includes("--apply");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
	console.error(
		"Missing NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET or SANITY_API_WRITE_TOKEN.",
	);
	process.exit(1);
}

const client = createClient({
	projectId,
	dataset,
	token,
	apiVersion: "2026-02-05",
	useCdn: false,
	// Orders open as drafts in the Studio must be patched too.
	perspective: "raw",
});

const orders = await client.fetch(
	`*[_type == "order" && count(products[defined(product._ref) && product._weak != true]) > 0]{
		_id,
		orderNumber,
		"lines": products[defined(product._ref) && product._weak != true]{ _key, "ref": product._ref }
	}`,
);

const totalOrders = await client.fetch(`count(*[_type == "order"])`);
const lineCount = orders.reduce((n, o) => n + o.lines.length, 0);

console.log(
	`${apply ? "APPLY" : "DRY RUN"} — ${projectId}/${dataset}: ${totalOrders} orders, ${orders.length} with strong product refs, ${lineCount} lines to weaken\n`,
);

for (const order of orders) {
	const label = `${order._id.startsWith("drafts.") ? "[draft] " : ""}${order.orderNumber ?? order._id}`;
	console.log(`• ${label}  (${order.lines.length} line${order.lines.length === 1 ? "" : "s"})`);
}

if (!apply) {
	console.log("\nDry run only. Re-run with --apply to write.");
	process.exit(0);
}

if (lineCount === 0) {
	console.log("\nNothing to do.");
	process.exit(0);
}

// Sanity caps a transaction well above this, but chunk anyway so a partial
// failure is easy to resume — the script skips already-weak lines on re-run.
const CHUNK = 100;
for (let i = 0; i < orders.length; i += CHUNK) {
	const tx = client.transaction();
	for (const order of orders.slice(i, i + CHUNK)) {
		const set = {};
		for (const line of order.lines) {
			set[`products[_key=="${line._key}"].product._weak`] = true;
		}
		tx.patch(order._id, (p) => p.set(set));
	}
	await tx.commit();
	console.log(`✓ committed ${Math.min(i + CHUNK, orders.length)}/${orders.length} orders`);
}

const remaining = await client.fetch(
	`count(*[_type == "order"].products[defined(product._ref) && product._weak != true])`,
);
console.log(remaining === 0 ? "✅ Done — no strong product refs remain." : `⚠ ${remaining} strong lines remain; re-run.`);
