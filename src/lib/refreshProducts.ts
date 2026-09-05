import type { Product } from "../../sanity.types";

/**
 * Re-reads a set of products from Sanity through the server.
 *
 * The wishlist and the basket both persist a full copy of the product in the
 * browser. That copy is what the page renders and what the order lines are
 * priced from, and it is never updated on its own, so anything long-lived has
 * to be refreshed before it is shown or paid for.
 */
export const fetchFreshProducts = async (
	ids: string[],
): Promise<Product[]> => {
	const unique = [...new Set(ids.filter(Boolean))];
	if (unique.length === 0) return [];

	const response = await fetch("/api/products/refresh", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ids: unique }),
	});

	if (!response.ok) throw new Error("Failed to refresh products");

	const data = await response.json();
	return Array.isArray(data?.products) ? (data.products as Product[]) : [];
};
