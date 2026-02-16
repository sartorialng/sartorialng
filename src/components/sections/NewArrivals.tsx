"use client";
import { getNewArrivals } from "@/sanity/lib/product/getNewArrivals";
import { useBasketStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Product } from "../../../sanity.types";
import ProductCard from "../layout/ProductCard";
import { toast } from "sonner";
import ProductCardSkeleton from "../layout/ProductCardSkeleton";

const NewArrivals = () => {
	const router = useRouter();
	const addItem = useBasketStore((s) => s.addItem);

	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getNewArrivals()
			.then((data) => setProducts(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div
			className="w-full px-6 md:px-20 py-20 bg-gray-50"
			id="new-arrivals"
		>
			<div className="flex justify-center">
				<p className="text-2xl md:text-4xl font-semibold md:font-bold text-sartorial-green">
					New Arrivals
				</p>
			</div>
			<div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
				{loading
					? Array.from({ length: 4 }).map((_, index) => (
							<ProductCardSkeleton key={index} />
						))
					: products.map((product) => {
							const colorToUse = product.colors?.[0];

							if (!colorToUse) {
								console.warn("Product has no colors");
								return;
							}
							return (
								<ProductCard
									key={product._id}
									product={product}
									onAddToCart={() => {
										addItem(product, colorToUse);
										toast.success(
											`${product.name} added to cart`,
										);
									}}
									onBuyNow={() => {
										addItem(product, colorToUse);
										router.push("/checkout");
									}}
								/>
							);
						})}
			</div>
		</div>
	);
};

export default NewArrivals;
