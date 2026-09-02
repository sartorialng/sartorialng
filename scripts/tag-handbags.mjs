#!/usr/bin/env node
/**
 * Backfills the "Hand Bags" category onto existing products.
 *
 * The storefront's category tiles are product types (Hand Bags, Shoes,
 * Beauty, Accessories), but the categories already in Sanity are bag *sizes*
 * (Mini/Small/Medium/Large Bags). Nothing is tagged "Hand Bags", so that tile
 * would filter to an empty page.
 *
 * This adds a "Hand Bags" reference to every product, alongside whatever
 * categories it already has. Existing size categories are left untouched, so
 * the /category filters keep working exactly as before.
 *
 * Usage:
 *   node --env-file=.env.local scripts/tag-handbags.mjs           # dry run
 *   node --env-file=.env.local scripts/tag-handbags.mjs --apply   # commit
 *
 * Flags:
 *   --apply             Actually write. Without it, nothing is modified.
 *   --category <title>  Category title to apply. Default "Hand Bags".
 *
 * Safe to re-run: products that already reference the category are skipped.
 */

import { createClient } from "@sanity/client";

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const categoryIndex = args.indexOf("--category");
const CATEGORY_TITLE =
	categoryIndex !== -1 && args[categoryIndex + 1]
		? args[categoryIndex + 1]
		: "Hand Bags";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
	console.error(
		"Missing env. Need NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_WRITE_TOKEN.",
	);
	console.error("Run with: node --env-file=.env.local scripts/tag-handbags.mjs");
	process.exit(1);
}

const client = createClient({
	projectId,
	dataset,
	apiVersion: "2026-02-05",
	useCdn: false,
	token,
});

const slugify = (value) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

const run = async () => {
	console.log(
		`${apply ? "APPLY" : "DRY RUN"} — tagging products with "${CATEGORY_TITLE}"`,
	);
	console.log(`Project ${projectId} / dataset ${dataset}\n`);

	let category = await client.fetch(
		`*[_type == "category" && lower(title) == lower($title)][0]{ _id, title }`,
		{ title: CATEGORY_TITLE },
	);

	if (category) {
		console.log(`Found existing category "${category.title}" (${category._id})`);
	} else if (apply) {
		category = await client.create({
			_type: "category",
			title: CATEGORY_TITLE,
			slug: { _type: "slug", current: slugify(CATEGORY_TITLE) },
			showOnHomepage: true,
			comingSoon: false,
			displayOrder: 1,
		});
		console.log(`Created category "${CATEGORY_TITLE}" (${category._id})`);
	} else {
		console.log(
			`Category "${CATEGORY_TITLE}" does not exist yet — would be created.`,
		);
	}

	const products = await client.fetch(
		`*[_type == "product"]{ _id, name, "categoryIds": categories[]._ref }`,
	);

	const needsTag = products.filter(
		(product) => !(product.categoryIds || []).includes(category?._id),
	);

	console.log(
		`\n${products.length} products total, ${needsTag.length} need the tag.\n`,
	);

	if (needsTag.length === 0) {
		console.log("Nothing to do.");
		return;
	}

	for (const product of needsTag) {
		console.log(`  ${apply ? "tagging" : "would tag"}  ${product.name}`);
	}

	if (!apply) {
		console.log(
			`\nDry run — nothing written. Re-run with --apply to commit.`,
		);
		return;
	}

	// setIfMissing covers products with no categories array at all; the
	// filtering above means we never append a duplicate reference.
	let transaction = client.transaction();
	for (const product of needsTag) {
		transaction = transaction.patch(product._id, (patch) =>
			patch.setIfMissing({ categories: [] }).append("categories", [
				{
					_type: "reference",
					_ref: category._id,
					_key: `handbags-${product._id}`,
				},
			]),
		);
	}

	await transaction.commit();
	console.log(`\nTagged ${needsTag.length} products with "${CATEGORY_TITLE}".`);
};

run().catch((error) => {
	console.error("\nFailed:", error.message);
	process.exit(1);
});
