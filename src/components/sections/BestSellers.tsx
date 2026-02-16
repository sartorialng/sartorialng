"use client";
import ProductCard from "../layout/ProductCard";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBasketStore } from "@/store/store";
import { toast } from "sonner";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
import { useEffect, useState } from "react";
import { Product } from "../../../sanity.types";
import ProductCardSkeleton from "../layout/ProductCardSkeleton";
import { motion } from "framer-motion";

const BestSellers = () => {
	const router = useRouter();
	const addItem = useBasketStore((s) => s.addItem);

	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getBestSellers()
			.then((data) => setProducts(data))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div
			className="w-full mt-10 px-6 md:px-20 py-10 bg-gray-50"
			id="best-sellers"
		>
			<div className="flex justify-center">
				<p className="text-2xl md:text-4xl font-semibold md:font-bold text-sartorial-green">
					Our Best Sellers
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
			<div className="mt-20 flex justify-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				>
					<motion.div
						animate={{ scale: [1, 1.05, 1] }}
						transition={{
							duration: 2,
							repeat: Infinity,
							repeatDelay: 3,
							ease: "easeInOut",
						}}
					>
						<Button
							variant="outline"
							className="group flex text-lg justify-center h-11 border-2 border-sartorial-green hover:bg-gray-50 text-sartorial-green font-medium rounded-lg w-40 cursor-pointer transition-all"
							onClick={() => router.push("/all-products")}
						>
							See more
							<motion.span
								className="ml-1 mt-1 inline-flex"
								whileHover={{ x: 4 }}
							>
								<ArrowRight className="h-5 w-5" />
							</motion.span>
						</Button>
					</motion.div>
				</motion.div>
			</div>
		</div>
	);
};

export default BestSellers;
