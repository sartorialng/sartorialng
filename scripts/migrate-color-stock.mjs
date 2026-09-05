#!/usr/bin/env node
/**
 * Converts each product's "Available Colors" rows from bare references to
 * {color, stock} objects so stock can be tracked per colour.
 *
 * Before:  colors: [ {_type: "reference", _ref: "<colorId>", _key} ]
 * After:   colors: [ {_type: "colorVariant", _key, color: {_type: "reference", _ref}, stock} ]
 *
 * `stock` is copied from the product-level count only when the product has
 * exactly one colour (the split is unambiguous). Multi-colour products are
 * left with no per-colour count, which the storefront treats as "use the
 * product-level stock" — i.e. nothing changes for them until the client fills
 * the numbers in Sanity Studio.
 *
 * Handles drafts too, so an open Studio draft cannot re-publish the old shape.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-color-stock.mjs           # dry run
 *   node --env-file=.env.local scripts/migrate-color-stock.mjs --apply   # commit
 *
 * Safe to re-run: rows that are already objects are skipped.
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
	// Newer API versions default to the published perspective; raw includes
	// drafts, which must be converted too.
	perspective: "raw",
});

const products = await client.fetch(
	`*[_type == "product"]{ _id, name, stock, colors[]{ _type, _key, _ref, color, stock } }`,
);

console.log(
	`${apply ? "APPLY" : "DRY RUN"} — ${products.length} product documents in ${projectId}/${dataset}\n`,
);

let converted = 0;
let skipped = 0;
const tx = client.transaction();

for (const product of products) {
	const rows = Array.isArray(product.colors) ? product.colors : [];
	const legacyRows = rows.filter((row) => row?._type === "reference");

	if (legacyRows.length === 0) {
		skipped += 1;
		continue;
	}

	const singleColor = rows.length === 1;
	const inherited =
		singleColor && typeof product.stock === "number" ? product.stock : undefined;

	const next = rows.map((row, index) => {
		if (row?._type !== "reference") return row;
		const variant = {
			_type: "colorVariant",
			_key: row._key || `color-${index}`,
			color: { _type: "reference", _ref: row._ref },
		};
		if (inherited !== undefined) variant.stock = inherited;
		return variant;
	});

	const label = `${product._id.startsWith("drafts.") ? "[draft] " : ""}${product.name ?? product._id}`;
	const summary = next
		.map((row) => {
			const ref = row.color?._ref ?? row._ref;
			const stock =
				typeof row.stock === "number" ? row.stock : "→ product stock";
			return `${ref}: ${stock}`;
		})
		.join(", ");
	console.log(`• ${label}  (product stock: ${product.stock ?? "none"})`);
	console.log(`    ${summary}`);

	tx.patch(product._id, (p) => p.set({ colors: next }));
	converted += 1;
}

console.log(`\n${converted} to convert, ${skipped} already converted or without colours.`);

if (!apply) {
	console.log("Dry run only. Re-run with --apply to write.");
	process.exit(0);
}

if (converted === 0) {
	console.log("Nothing to do.");
	process.exit(0);
}

await tx.commit();
console.log("✅ Done.");
