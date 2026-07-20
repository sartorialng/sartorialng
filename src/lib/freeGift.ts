import type { BasketItem } from "@/store/store";

export interface FreeGiftProduct {
	_id: string;
	name?: string | null;
	slug?: string | null;
	price?: number | null;
	images?: Array<{
		alt?: string | null;
		asset?: { url?: string | null } | { _ref?: string } | null;
	}> | null;
}

export interface FreeGiftLine {
	product: FreeGiftProduct;
	quantity: number;
}

export const getFreeGift = (product: unknown): FreeGiftProduct | null => {
	const gift = (product as { freeGift?: FreeGiftProduct | null } | null)
		?.freeGift;
	return gift && gift._id ? gift : null;
};

export const getFreeGiftLines = (items: BasketItem[]): FreeGiftLine[] => {
	const lines = new Map<string, FreeGiftLine>();

	for (const item of items) {
		const gift = getFreeGift(item.product);
		if (!gift) continue;

		const existing = lines.get(gift._id);
		if (existing) {
			existing.quantity += item.quantity;
		} else {
			lines.set(gift._id, { product: gift, quantity: item.quantity });
		}
	}

	return Array.from(lines.values());
};
