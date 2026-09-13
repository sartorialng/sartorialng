#!/usr/bin/env node
/**
 * Hard-deletes a fixed list of product documents from Sanity.
 *
 * Old orders reference their products with strong references
 * (order.products[].product), and Sanity refuses to delete a document that
 * anything points at. So this runs in two transactions:
 *
 *   1. every order line that points at a target gets `product._weak = true`
 *      (the order keeps its productName / productPrice snapshots, which is
 *      what every order page reads anyway);
 *   2. the targets, and their drafts, are deleted.
 *
 * Anything other than an order referencing a target (a combo that lists it as
 * a component, a product using it as a free gift) aborts the run — that needs
 * a human decision, not a script.
 *
 * Usage:
 *   node --env-file=.env.local scripts/delete-products.mjs           # dry run
 *   node --env-file=.env.local scripts/delete-products.mjs --apply   # commit
 *
 * Safe to re-run: targets already gone are reported and skipped.
 */

import { createClient } from "@sanity/client";

// Name is checked against the document before anything is touched, so a
// mistyped id cannot delete the wrong product.
const TARGETS = [
	{ _id: "2af5429b-2551-4095-8642-73f3a56e6042", name: "Saddle and Tokyo combo" },
	{ _id: "b992ce96-c2ba-4305-bf41-c620ab0abc40", name: "The +234 and Eloise" },
	{ _id: "bcd6936e-4d6b-44dc-843d-1e86bb395ad0", name: "Eloise and Ibiza combo" },
	{ _id: "18bcc678-f3fa-4be2-953e-f03910b0b2d2", name: "Tokyo and Eloise combo" },
	{ _id: "70da26a7-eb2e-4d6e-9166-26d28fc2666e", name: "The Nora" },
];

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
	// Drafts must be found (and deleted) too, and orders may be open as drafts
	// in the Studio.
	perspective: "raw",
});

const fail = (message) => {
	console.error(`\n✖ ${message}`);
	process.exit(1);
};

const norm = (s) => (s ?? "").trim().toLowerCase();

console.log(
	`${apply ? "APPLY" : "DRY RUN"} — ${TARGETS.length} products in ${projectId}/${dataset}\n`,
);

// 1. Resolve the targets and make sure each id is the product we think it is.
const ids = TARGETS.map((t) => t._id);
const draftIds = ids.map((id) => `drafts.${id}`);
const found = await client.fetch(
	`*[_id in $ids || _id in $draftIds]{ _id, _type, name }`,
	{ ids, draftIds },
);
const byId = new Map(found.map((doc) => [doc._id, doc]));

const live = [];
for (const target of TARGETS) {
	const published = byId.get(target._id);
	const draft = byId.get(`drafts.${target._id}`);
	if (!published && !draft) {
		console.log(`• ${target.name}  — already gone, skipping`);
		continue;
	}
	for (const doc of [published, draft].filter(Boolean)) {
		if (doc._type !== "product") {
			fail(`${doc._id} is a ${doc._type}, not a product. Aborting.`);
		}
		if (norm(doc.name) !== norm(target.name)) {
			fail(
				`${doc._id} is named "${doc.name}", expected "${target.name}". Aborting.`,
			);
		}
	}
	console.log(
		`• ${target.name}  (${target._id})${draft ? "  [has draft]" : ""}`,
	);
	live.push(target);
}

if (live.length === 0) {
	console.log("\nNothing to do.");
	process.exit(0);
}
const liveIds = live.map((t) => t._id);

// 2. Who points at them? Only orders may.
const referrers = await client.fetch(
	`*[references($ids)]{ _id, _type, "lines": products[product._ref in $ids]{ _key, "ref": product._ref, "weak": product._weak } }`,
	{ ids: liveIds },
);
const foreign = referrers.filter((doc) => doc._type !== "order");
if (foreign.length > 0) {
	console.error("\nReferenced by non-order documents:");
	for (const doc of foreign) console.error(`  ${doc._type}  ${doc._id}`);
	fail("Resolve those references by hand first. Aborting.");
}

console.log(`\n${referrers.length} orders reference the targets:`);
for (const target of live) {
	const count = referrers.filter((o) =>
		o.lines.some((l) => l.ref === target._id),
	).length;
	console.log(`  ${target.name}: ${count}`);
}

// 3. Weaken every order line that points at a target.
const patches = client.transaction();
let lines = 0;
for (const order of referrers) {
	for (const line of order.lines) {
		if (line.weak === true) continue;
		patches.patch(order._id, (p) =>
			p.set({ [`products[_key=="${line._key}"].product._weak`]: true }),
		);
		lines += 1;
	}
}
console.log(`\n${lines} order lines to mark weak, then ${live.length} products to delete.`);

if (!apply) {
	console.log("Dry run only. Re-run with --apply to write.");
	process.exit(0);
}

if (lines > 0) {
	await patches.commit();
	console.log("✓ order references weakened");
}

// 4. references() still matches weak refs; only strong ones block a delete,
// so count those specifically.
const remaining = await client.fetch(
	`count(*[references($ids)].products[product._ref in $ids && product._weak != true])`,
	{ ids: liveIds },
);
if (remaining > 0) {
	fail(`${remaining} order lines still hold strong references. Nothing deleted.`);
}

// 5. Delete published + draft in one go.
const deletes = client.transaction();
for (const target of live) {
	deletes.delete(target._id);
	deletes.delete(`drafts.${target._id}`);
}
await deletes.commit();
console.log(`✓ deleted ${live.map((t) => t.name).join(", ")}`);
console.log("✅ Done.");
