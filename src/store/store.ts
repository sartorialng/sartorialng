import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "../../sanity.types";
import { comboSelectionSignature } from "@/lib/combo";
import type { ComboSelection } from "@/lib/combo";

export interface BasketItem {
	product: Product;
	quantity: number;
	selectedColor?: {
		_id: string;
		title: string;
	};
	/** Set on combo lines: the colour picked for each bag in the combo. The
	 *  line's own `selectedColor` stays empty, because a combo has no single
	 *  colour of its own. */
	comboSelections?: ComboSelection[];
}

/**
 * Whether a basket line is the same line the caller means. A combo has no
 * single colour, so two combos of the same product are only the same line when
 * every bag was picked in the same colour.
 */
const sameLine = (
	item: BasketItem,
	productId: string,
	selectedColor?: { _id: string; title: string },
	comboSelections?: ComboSelection[],
) =>
	item.product._id === productId &&
	item.selectedColor?._id === selectedColor?._id &&
	comboSelectionSignature(item.comboSelections) ===
		comboSelectionSignature(comboSelections);

interface BasketState {
	items: BasketItem[];
	addItem: (
		product: Product,
		selectedColor?: {
			_id: string;
			title: string;
		},
		comboSelections?: ComboSelection[],
	) => void;
	removeItem: (
		productId: string,
		selectedColor?: {
			_id: string;
			title: string;
		},
		comboSelections?: ComboSelection[],
	) => void;
	clearBasket: () => void;
	/** Replace the stored product copies with freshly fetched ones. Lines
	 *  whose product no longer exists are dropped. */
	refreshProducts: (fresh: Product[]) => void;
	getTotalPrice: () => number;
	getItemCount: (productId: string) => number;
	getGroupedItems: () => BasketItem[];
	hasComboItem: () => boolean;
	hasFreeShippingItem: () => boolean;
}

export const useBasketStore = create<BasketState>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (
				product: Product,
				selectedColor?: { _id: string; title: string },
				comboSelections?: ComboSelection[],
			) => {
				set((state) => {
					// Find if this exact product+colour selection exists
					const existingItemIndex = state.items.findIndex((item) =>
						sameLine(
							item,
							product._id,
							selectedColor,
							comboSelections,
						),
					);

					if (existingItemIndex > -1) {
						// Increase quantity for existing item
						const newItems = [...state.items];
						newItems[existingItemIndex].quantity += 1;
						return { items: newItems };
					}

					// Add new item with colour
					return {
						items: [
							...state.items,
							{
								product,
								quantity: 1,
								selectedColor,
								...(comboSelections?.length
									? { comboSelections }
									: {}),
							},
						],
					};
				});
			},

			removeItem: (
				productId: string,
				selectedColor?: { _id: string; title: string },
				comboSelections?: ComboSelection[],
			) => {
				set((state) => {
					const existingItemIndex = state.items.findIndex((item) =>
						sameLine(
							item,
							productId,
							selectedColor,
							comboSelections,
						),
					);

					if (existingItemIndex === -1) return state;

					const newItems = [...state.items];
					if (newItems[existingItemIndex].quantity > 1) {
						newItems[existingItemIndex].quantity -= 1;
					} else {
						newItems.splice(existingItemIndex, 1);
					}

					return { items: newItems };
				});
			},

			clearBasket: () => set({ items: [] }),

			refreshProducts: (fresh: Product[]) =>
				set((state) => {
					if (!Array.isArray(fresh)) return state;
					const byId = new Map(
						fresh
							.filter((p) => p && p._id)
							.map((p) => [p._id, p] as const),
					);
					return {
						items: state.items
							.map((item) => {
								const product = byId.get(item.product._id);
								return product ? { ...item, product } : null;
							})
							.filter((item): item is BasketItem =>
								Boolean(item),
							),
					};
				}),

			// getTotalPrice: () => {
			// 	return get().items.reduce(
			// 		(total, item) =>
			// 			total + (item.product.price || 0) * item.quantity,
			// 		0,
			// 	);
			// },

			getTotalPrice: () => {
				return get().items.reduce(
					(total, item) =>
						total +
						(item.product.onSale
							? (item.product.salePrice ?? 0)
							: (item.product.price ?? 0)) *
							item.quantity,
					0,
				);
			},

			getItemCount: (productId) => {
				const item = get().items.find(
					(i) => i.product._id === productId,
				);
				return item ? item.quantity : 0;
			},

			getGroupedItems: () => get().items,
			hasComboItem: () => {
				return get().items.some(
					(item) => item.product.onCombo === true,
				);
			},
			hasFreeShippingItem: () => {
				return get().items.some(
					(item) => item.product.freeShipping === true,
				);
			},
		}),
		{
			name: "basket-store",
			partialize: (state) => ({ items: state.items }),
		},
	),
);
