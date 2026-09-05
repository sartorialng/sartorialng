import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "../../sanity.types";

interface WishlistState {
	items: Product[];
	addToWishlist: (product: Product) => void;
	removeFromWishlist: (productId: string) => void;
	isInWishlist: (productId: string) => boolean;
	clearWishlist: () => void;
	/** Swap the stored copies for freshly fetched ones, keeping the saved
	 *  order and dropping anything that no longer exists in Sanity. */
	refreshItems: (fresh: Product[]) => void;
}

export const useWishlistStore = create<WishlistState>()(
	persist(
		(set, get) => ({
			items: [],

			addToWishlist: (product) =>
				set((state) => {
					if (!product || !product._id) return state;

					const exists = state.items.find(
						(item) => item && item._id === product._id,
					);

					if (exists) return state;

					return { items: [...state.items, product] };
				}),

			removeFromWishlist: (productId) =>
				set((state) => ({
					items: state.items.filter(
						(item) => item && item._id !== productId,
					),
				})),

			isInWishlist: (productId) =>
				!!get().items.find((item) => item && item._id === productId),

			clearWishlist: () => set({ items: [] }),

			refreshItems: (fresh) =>
				set((state) => {
					if (!Array.isArray(fresh)) return state;
					const byId = new Map(
						fresh
							.filter((p) => p && p._id)
							.map((p) => [p._id, p] as const),
					);
					return {
						items: state.items
							.map((item) =>
								item?._id ? byId.get(item._id) : undefined,
							)
							.filter((item): item is Product => Boolean(item)),
					};
				}),
		}),
		{
			name: "wishlist-store",
		},
	),
);
