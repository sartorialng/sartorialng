/**
 * Per-colour stock helpers shared by the storefront, the checkout gate and
 * fulfilment.
 *
 * A product's `colors[]` rows may carry their own `stock`. A row with no
 * number falls back to the product-level `stock`, which is exactly how the
 * catalogue behaved before per-colour stock existed. A `null` result means
 * "no count recorded" and is treated as available, matching the old
 * `stock === 0` semantics for undefined stock.
 */

export type StockColor = {
	_id?: string | null;
	_key?: string | null;
	title?: string | null;
	stock?: number | null;
};

export type StockProduct = {
	stock?: number | null;
	colors?: Array<StockColor | null> | null;
};

const asCount = (value: unknown): number | null =>
	typeof value === "number" && Number.isFinite(value) ? value : null;

const colorRows = <C extends StockColor>(
	product: { colors?: Array<C | null> | null } | null | undefined,
): C[] => (product?.colors ?? []).filter((c): c is C => Boolean(c));

/** Stock available for one colour, falling back to the product-level count. */
export const getColorStock = (
	product: StockProduct | null | undefined,
	colorId?: string | null,
): number | null => {
	const variant = colorId
		? colorRows(product).find((c) => c._id === colorId)
		: undefined;
	const variantStock = asCount(variant?.stock);
	if (variantStock !== null) return variantStock;
	return asCount(product?.stock);
};

/** True only when a count exists for this colour and it is zero or below. */
export const isColorSoldOut = (
	product: StockProduct | null | undefined,
	colorId?: string | null,
): boolean => {
	const stock = getColorStock(product, colorId);
	return stock !== null && stock <= 0;
};

/** Every colour sold out (or, with no colours, the product count is zero). */
export const isProductSoldOut = (
	product: StockProduct | null | undefined,
): boolean => {
	const colors = colorRows(product);
	if (colors.length === 0) {
		const stock = asCount(product?.stock);
		return stock !== null && stock <= 0;
	}
	return colors.every((c) => isColorSoldOut(product, c._id));
};

/**
 * First colour that can still be bought, else the first colour listed.
 * Typed with a concrete `_id`/`title` because callers hand the result to
 * the cart, which needs both; only a dangling colour reference could make
 * them null in practice.
 */
export const getFirstAvailableColor = <C extends StockColor>(
	product:
		| { stock?: number | null; colors?: Array<C | null> | null }
		| null
		| undefined,
): (C & { _id: string; title: string }) | undefined => {
	const colors = colorRows(product);
	return (colors.find((c) => !isColorSoldOut(product, c._id)) ??
		colors[0]) as (C & { _id: string; title: string }) | undefined;
};
