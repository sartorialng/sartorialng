/**
 * Combo helpers.
 *
 * A combo is a product whose `comboItems` names two or more real products. The
 * customer picks a colour for each of them, and stock comes off each
 * component's own colour count rather than the combo document — so a combo can
 * never advertise more units than the bags behind it.
 *
 * Colour reads go through `src/lib/stock.ts`, so a component colour with no
 * count of its own falls back to that product's product-level stock exactly as
 * it does everywhere else.
 */

import { getColorStock, isColorSoldOut } from "./stock";
import type { StockColor, StockProduct } from "./stock";

export type ComboColor = StockColor & { _id: string; title: string };

export type ComboComponent = StockProduct & {
	_id: string;
	name?: string | null;
	slug?: string | null;
};

export type ComboItem = {
	_key?: string | null;
	quantity?: number | null;
	/** Narrows the component's own colours. Empty means "all of them". */
	colorOptionIds?: Array<string | null> | null;
	product?: ComboComponent | null;
};

/** One bag's colour choice, as carried through the basket and the order. */
export type ComboSelection = {
	productId: string;
	productName: string;
	colorId: string;
	colorTitle: string;
	quantity: number;
};

/** The components, ignoring rows whose product reference never resolved. */
export const getComboItems = (product: unknown): ComboItem[] => {
	const rows =
		(product as { comboItems?: Array<ComboItem | null> | null } | null)
			?.comboItems ?? [];
	return rows.filter((row): row is ComboItem => Boolean(row?.product?._id));
};

/** Two or more components is what makes a product a combo. */
export const isCombo = (product: unknown): boolean =>
	getComboItems(product).length >= 2;

/** Units of this component in one combo. */
export const comboItemUnits = (item: ComboItem): number =>
	typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1;

/** Stable key for one row, for React lists and selection state. */
export const comboItemKey = (item: ComboItem, index: number): string =>
	item._key || item.product?._id || String(index);

/**
 * The colours this component offers in this combo. `colorOptions` on the row
 * narrows the component's own list; an empty list offers every colour it has.
 */
export const comboItemColors = (item: ComboItem): ComboColor[] => {
	const all = (item.product?.colors ?? []).filter(
		(c): c is ComboColor => Boolean(c && c._id),
	);
	const allow = (item.colorOptionIds ?? []).filter(
		(id): id is string => Boolean(id),
	);
	if (allow.length === 0) return all;
	const allowed = new Set(allow);
	return all.filter((c) => allowed.has(c._id));
};

/** True when this component's colour cannot be sold. */
export const comboItemColorSoldOut = (
	item: ComboItem,
	colorId?: string | null,
): boolean => isColorSoldOut(item.product, colorId);

/**
 * A combo cannot be sold when any one of its bags has no colour left, since
 * every bag has to ship. The combo's own `colors`/`stock` are legacy and say
 * nothing about what is actually on the shelf.
 */
export const isComboSoldOut = (product: unknown): boolean => {
	const items = getComboItems(product);
	if (items.length < 2) return false;
	return items.some((item) => {
		const colors = comboItemColors(item);
		if (colors.length === 0) return true;
		return colors.every((c) => comboItemColorSoldOut(item, c._id));
	});
};

/** The first colour of each component that is not sold out, for initial state. */
export const defaultComboSelection = (
	items: ComboItem[],
): Record<string, string> => {
	const out: Record<string, string> = {};
	items.forEach((item, index) => {
		const colors = comboItemColors(item);
		const first =
			colors.find((c) => !comboItemColorSoldOut(item, c._id)) ?? colors[0];
		if (first) out[comboItemKey(item, index)] = first._id;
	});
	return out;
};

/**
 * How many of this combo the components can cover, given the colours chosen.
 * `null` means no component records a count, matching `getColorStock`.
 * Components whose colour has no count do not constrain the total.
 */
export const comboAvailability = (
	items: ComboItem[],
	colorByKey: Record<string, string | undefined>,
): number | null => {
	let lowest: number | null = null;
	items.forEach((item, index) => {
		const colorId = colorByKey[comboItemKey(item, index)];
		const stock = getColorStock(item.product, colorId);
		if (stock === null) return;
		const covered = Math.floor(stock / comboItemUnits(item));
		lowest = lowest === null ? covered : Math.min(lowest, covered);
	});
	return lowest;
};

/** Every component has a colour picked, so the combo can be added to a basket. */
export const comboSelectionComplete = (
	items: ComboItem[],
	colorByKey: Record<string, string | undefined>,
): boolean =>
	items.length > 0 &&
	items.every((item, index) => Boolean(colorByKey[comboItemKey(item, index)]));

/** Freeze the picked colours into the shape the basket and order carry. */
export const buildComboSelections = (
	items: ComboItem[],
	colorByKey: Record<string, string | undefined>,
): ComboSelection[] =>
	items.flatMap((item, index) => {
		const colorId = colorByKey[comboItemKey(item, index)];
		const product = item.product;
		if (!colorId || !product?._id) return [];
		const color = comboItemColors(item).find((c) => c._id === colorId);
		return [
			{
				productId: product._id,
				productName: product.name ?? "",
				colorId,
				colorTitle: color?.title ?? "",
				quantity: comboItemUnits(item),
			},
		];
	});

/** "Tokyo: Brown · Eloise: Mint green", for baskets, receipts and packing. */
export const describeComboSelections = (
	selections: ComboSelection[] | null | undefined,
): string =>
	(selections ?? [])
		.map((s) => `${s.productName.trim()}: ${s.colorTitle.trim()}`)
		.join(" · ");

/**
 * How many more of this exact combo line the shelf can cover, from the colours
 * the line already holds. Used by the basket, where the choice is already made.
 */
export const comboSelectionAvailability = (
	product: unknown,
	selections: ComboSelection[] | null | undefined,
): number | null => {
	const items = getComboItems(product);
	if (items.length < 2 || !selections?.length) return null;
	const chosen = new Map(selections.map((s) => [s.productId, s.colorId]));
	let lowest: number | null = null;
	for (const item of items) {
		const colorId = item.product?._id
			? chosen.get(item.product._id)
			: undefined;
		const stock = getColorStock(item.product, colorId);
		if (stock === null) continue;
		const covered = Math.floor(stock / comboItemUnits(item));
		lowest = lowest === null ? covered : Math.min(lowest, covered);
	}
	return lowest;
};

/**
 * Every colour a product can actually be bought in, for listing filters.
 *
 * A combo is bought in its bags' colours, not its own — its `colors` list is
 * legacy and, on several combos, names colours neither bag has. Filtering on
 * that would surface a combo under a colour it cannot be ordered in.
 */
export const buyableColorTitles = (product: unknown): string[] => {
	const items = getComboItems(product);

	const titles =
		items.length >= 2
			? items.flatMap((item) => comboItemColors(item).map((c) => c.title))
			: (
					(product as { colors?: Array<{ title?: string | null } | null> | null } | null)
						?.colors ?? []
				).map((c) => c?.title ?? "");

	return [...new Set(titles.map((t) => (t ?? "").trim()).filter(Boolean))];
};

/** Identity for a basket line, so two differently-coloured combos stay apart. */
export const comboSelectionSignature = (
	selections: ComboSelection[] | null | undefined,
): string =>
	(selections ?? [])
		.map((s) => `${s.productId}:${s.colorId}`)
		.sort()
		.join("|");
