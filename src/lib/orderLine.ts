export interface OrderLineLike {
	productName?: string | null;
	productPrice?: number | null;
	isFreeGift?: boolean | null;
	quantity?: number | null;
	product?: { name?: string | null; price?: number | null } | null;
}

export const isFreeGiftLine = (line: OrderLineLike): boolean =>
	line?.isFreeGift === true;

export const getOrderLineName = (line: OrderLineLike): string =>
	line?.productName || line?.product?.name || "Product";

export const getOrderLineUnitPrice = (line: OrderLineLike): number => {
	if (isFreeGiftLine(line)) return 0;
	if (typeof line?.productPrice === "number") return line.productPrice;
	return line?.product?.price ?? 0;
};

export const getOrderLineTotal = (line: OrderLineLike): number =>
	getOrderLineUnitPrice(line) * (line?.quantity ?? 0);
