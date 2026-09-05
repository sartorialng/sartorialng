"use client";
import { useState, useEffect } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Search, X } from "lucide-react";
import ProductCardSkeleton from "@/components/layout/ProductCardSkeleton";
import ProductCard from "@/components/layout/ProductCard"; // Assuming you have this
import { getAllProducts } from "@/sanity/lib/product/getAllProducts";
import { Product } from "../../../../sanity.types";
import { toast } from "sonner";
import { useBasketStore } from "@/store/store";
import { useRouter } from "next/navigation";
import { getFirstAvailableColor } from "@/lib/stock";

const SearchPage = () => {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const addItem = useBasketStore((s) => s.addItem);
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const data = await getAllProducts();
				setProducts(data);
			} catch (error) {
				console.error("Failed to fetch products:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchProducts();
	}, []);

	useEffect(() => {
		if (!searchQuery.trim()) {
			setFilteredProducts([]);
			return;
		}

		const filtered = products.filter((product: Product) =>
			product?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
		setFilteredProducts(filtered);
	}, [searchQuery, products]);

	return (
		<div className="min-h-screen w-full bg-gray-50 flex flex-col">
			<Header />

			<main className="grow px-6 md:px-20 py-25 md:py-30">
				<div className="max-w-4xl mx-auto mb-12">
					<h1 className="text-2xl md:text-3xl font-bold text-sartorial-green mb-6 text-center">
						Search Our Collection
					</h1>

					<div className="relative flex items-center gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search for bags, accessories..."
								className="w-full pl-12 pr-12 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-sartorial-green outline-none text-lg transition-all"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sartorial-green"
								>
									<X className="w-5 h-5" />
								</button>
							)}
						</div>
					</div>
				</div>

				<div className="w-full">
					{isLoading && searchQuery && (
						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{Array.from({ length: 4 }).map((_, index) => (
								<ProductCardSkeleton key={index} />
							))}
						</div>
					)}

					{!isLoading && searchQuery && (
						<div>
							<div className="flex justify-between items-center mb-8">
								<p className="text-gray-600">
									{filteredProducts.length > 0
										? `Showing results for "${searchQuery}"`
										: `No results found for "${searchQuery}"`}
								</p>
								<p className="text-sm text-gray-500">
									{filteredProducts.length} Products found
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
								{filteredProducts.map((product) => {
									const colorToUse = getFirstAvailableColor(product);

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
					)}

					{/* Empty/Initial State */}
					{!searchQuery && !isLoading && (
						<div className="text-center py-20">
							<p className="text-gray-400">
								Type something to start searching...
							</p>
						</div>
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default SearchPage;
