"use client";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { useBasketStore } from "@/store/store";
import { useWishlistStore } from "@/store/useWishlistStore";
import Image from "next/image";
import { toast } from "sonner";
import { Product } from "../../../../sanity.types";
import { SartorialBag } from "@/assets";
import { urlFor } from "@/lib/imageUrl";
import { convertNGNtoUSD } from "@/lib/currency";
import { getFirstAvailableColor, isProductSoldOut } from "@/lib/stock";
import { fetchFreshProducts } from "@/lib/refreshProducts";
import { useEffect, useRef } from "react";

const WishList = () => {
	const { items, removeFromWishlist } = useWishlistStore();
	const refreshItems = useWishlistStore((s) => s.refreshItems);
	const addItem = useBasketStore((s) => s.addItem);
	const hasRefreshed = useRef(false);

	// A saved item is a copy of the product taken when it was added, often
	// months ago. Without this the page would show that copy's stock and
	// price, which is how sold-out items stayed buyable from here.
	useEffect(() => {
		if (hasRefreshed.current || items.length === 0) return;
		hasRefreshed.current = true;

		const ids = useWishlistStore
			.getState()
			.items.map((item) => item?._id)
			.filter((id): id is string => Boolean(id));

		fetchFreshProducts(ids)
			.then(refreshItems)
			.catch(() => {
				// Leave the saved copies in place; the checkout stock and
				// price checks still run against live data before payment.
			});
	}, [items.length, refreshItems]);

	const handleAddToCart = (product: Product) => {
		if (isProductSoldOut(product)) {
			toast.error(`${product.name} is out of stock`);
			return;
		}

		const colorToUse = getFirstAvailableColor(product);
		if (!colorToUse) {
			console.warn("Product has no colors");
			return;
		}
		addItem(product, colorToUse);
		removeFromWishlist(product._id);
		toast.success(`${product.name} added to cart`);
	};

	if (!items.length) {
		return (
			<div className="min-h-screen flex flex-col">
				<Header />
				<main className="pt-30 md:pt-40 pb-20 grow flex items-center justify-center">
					<p className="text-xl text-gray-600">
						Wishlist is empty 💔
					</p>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="grow w-full pt-30 md:pt-40 pb-20 px-6 md:px-20 lg:px-32">
				<div className="bg-white max-w-6xl mx-auto p-3 md:p-10 rounded-sm">
					<h1 className="text-2xl font-bold mb-8 text-gray-800">
						Wishlist
					</h1>

					<div className="border border-gray-200 rounded-lg overflow-hidden">
						{items.map((product, index) => {
							const soldOut = isProductSoldOut(product);
							return (
							<div
								key={product._id}
								className={`flex flex-col md:flex-row items-center justify-between p-3 md:p-8 gap-6 ${
									index !== items.length - 1
										? "border-b border-gray-100"
										: ""
								}`}
							>
								<div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full">
									<div className="relative w-24 h-24 bg-gray-50 rounded-md overflow-hidden shrink-0">
										<Image
											src={
												product?.images?.[0]?.asset
													? urlFor(product.images[0])
													: SartorialBag
											}
											alt={product.name ?? "pic"}
											fill
											className="object-contain p-2"
										/>
									</div>
									<div>
										<h3 className="text-xl font-medium text-gray-900">
											{product.name}
										</h3>
										{soldOut && (
											<span className="mt-1 inline-block rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
												Out of Stock
											</span>
										)}
									</div>
								</div>

								<div className="flex flex-col items-center md:items-end flex-1 w-full">
									<p className="text-lg font-medium text-gray-700">
										{product?.onSale
											? `₦${(product.salePrice || 0).toLocaleString()}`
											: `₦${(product.price || 0).toLocaleString()}`}
									</p>
									<p className="text-gray-500">
										{product?.onSale
											? `$${(product.salePrice
													? convertNGNtoUSD(
															product.salePrice,
														)
													: 0
												).toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}`
											: `$${(product.price
													? convertNGNtoUSD(
															product.price,
														)
													: 0
												).toLocaleString(undefined, {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}`}
									</p>

									<div className="md:ml-10 mt-4 flex items-center justify-between gap-4 md:justify-end">
										<button
											onClick={() =>
												removeFromWishlist(product._id)
											}
											className="text-sm px-4 md:px-10 py-2.5 border border-sartorial-green text-sartorial-green rounded-full hover:bg-gray-50 transition-colors md:min-w-35 cursor-pointer"
										>
											Remove
										</button>
										<button
											onClick={() =>
												handleAddToCart(product)
											}
											disabled={soldOut}
											className={`text-sm px-4 md:px-10 py-2.5 rounded-full transition-colors md:min-w-35 ${
												soldOut
													? "cursor-not-allowed bg-gray-300 text-gray-500"
													: "cursor-pointer bg-sartorial-green text-white hover:bg-[#234231]"
											}`}
										>
											{soldOut ? "Out of Stock" : "Add to Cart"}
										</button>
									</div>
								</div>
							</div>
							);
						})}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default WishList;
