import { revalidatePath } from "next/cache";
import { adminClient } from "@/sanity/lib/sanity.admin";
import type { OrderLineInput } from "./types";

export interface StockLine {
	productId: string;
	colorId?: string | null;
	quantity: number;
}

export type StockDirection = "deduct" | "restock";

type ProductStockDoc = {
	_id: string;
	name: string | null;
	slug: string | null;
	stock: number | null;
	colors: Array<{
		_key: string | null;
		_id: string | null;
		stock: number | null;
	}> | null;
};

export const stockLinesFromOrderInput = (
	items: OrderLineInput[],
): StockLine[] =>
	items.map((item) => ({
		productId: item._id,
		colorId: item.selectedColor?.colorId ?? null,
		quantity: item.quantity,
	}));

/**
 * Moves stock for a set of order lines, one Sanity transaction for the lot.
 *
 * Each line goes against the colour's own count when that colour has one,
 * otherwise against the product-level `stock` (the pre-per-colour behaviour,
 * which is also what free-gift lines use since they carry no colour). Lines
 * whose product has no count anywhere are skipped. `dec`/`inc` are atomic on
 * the server, so concurrent orders never lose an update; a count can go
 * negative on an oversell and reads as sold out everywhere.
 *
 * Never throws: fulfilment and cancellation must not fail because stock
 * bookkeeping did.
 */
export const adjustStock = async (
	lines: StockLine[],
	direction: StockDirection,
	orderNumber: string,
) => {
	const valid = lines.filter(
		(line) =>
			line.productId &&
			Number.isFinite(line.quantity) &&
			line.quantity > 0,
	);
	if (valid.length === 0) return;

	const ids = [...new Set(valid.map((line) => line.productId))];

	try {
		const products = await adminClient.fetch<ProductStockDoc[]>(
			`*[_type == "product" && _id in $ids]{
				_id,
				name,
				"slug": slug.current,
				stock,
				colors[]{
					_key,
					"_id": coalesce(color->_id, @->_id),
					stock
				}
			}`,
			{ ids },
		);
		const productMap = new Map(products.map((p) => [p._id, p]));

		const transaction = adminClient.transaction();
		const touchedSlugs = new Set<string>();
		const touchedIds = new Set<string>();

		for (const line of valid) {
			const product = productMap.get(line.productId);
			if (!product) continue;

			const variant = line.colorId
				? product.colors?.find((c) => c._id === line.colorId)
				: undefined;

			let path: string | null = null;
			if (variant?._key && typeof variant.stock === "number") {
				path = `colors[_key=="${variant._key}"].stock`;
			} else if (typeof product.stock === "number") {
				path = "stock";
			}
			if (!path) continue;

			const delta = { [path]: line.quantity };
			transaction.patch(product._id, (p) =>
				direction === "deduct" ? p.dec(delta) : p.inc(delta),
			);
			touchedIds.add(product._id);
			if (product.slug) touchedSlugs.add(product.slug);
		}

		if (touchedIds.size === 0) return;

		// A stale Studio draft, if published later, would overwrite the count we
		// just moved, so drop any drafts for the products we touched.
		const draftIds = await adminClient.fetch<string[]>(
			`*[_id in $draftIds]._id`,
			{ draftIds: [...touchedIds].map((id) => `drafts.${id}`) },
			{ perspective: "raw" },
		);
		for (const draftId of draftIds) transaction.delete(draftId);

		await transaction.commit();

		// Product and listing pages are ISR-cached; refresh them so a colour
		// that just sold out stops showing as available.
		try {
			for (const slug of touchedSlugs) revalidatePath(`/product/${slug}`);
			revalidatePath("/");
		} catch {
			// Not fatal — the checkout inventory check is the real gate.
		}
	} catch (error) {
		console.error(
			`🚨 CRITICAL: Stock ${direction} failed for order:`,
			orderNumber,
			error,
		);
	}
};
