import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "../../sanity.types";

export interface BasketItem {
	product: Product;
	quantity: number;
	selectedColor?: {
		_id: string;
		title: string;
	};
}

interface BasketState {
	items: BasketItem[];
	addItem: (
		product: Product,
		selectedColor?: {
			_id: string;
			title: string;
		},
	) => void;
	removeItem: (
		productId: string,
		selectedColor?: {
			_id: string;
			title: string;
		},
	) => void;
	clearBasket: () => void;
	/** Replace the stored product copies with freshly fetched ones. Lines
	 *  whose product no longer exists are dropped. */
	refreshProducts: (fresh: Product[]) => void;
	getTotalPrice: () => number;
	getItemCount: (productId: string) => number;
	getGroupedItems: () => BasketItem[];
	hasComboItem: () => boolean;
}

export const useBasketStore = create<BasketState>()(
	persist(
		(set, get) => ({
			items: [],

			addItem: (
				product: Product,
				selectedColor?: { _id: string; title: string },
			) => {
				set((state) => {
					// Find if this exact product+color combination exists
					const existingItemIndex = state.items.findIndex(
						(item) =>
							item.product._id === product._id &&
							item.selectedColor?._id === selectedColor?._id,
					);

					if (existingItemIndex > -1) {
						// Increase quantity for existing item
						const newItems = [...state.items];
						newItems[existingItemIndex].quantity += 1;
						return { items: newItems };
					}

					// Add new item with color
					return {
						items: [
							...state.items,
							{ product, quantity: 1, selectedColor },
						],
					};
				});
			},

			removeItem: (
				productId: string,
				selectedColor?: { _id: string; title: string },
			) => {
				set((state) => {
					const existingItemIndex = state.items.findIndex(
						(item) =>
							item.product._id === productId &&
							item.selectedColor?._id === selectedColor?._id,
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
		}),
		{
			name: "basket-store",
			partialize: (state) => ({ items: state.items }),
		},
	),
);
