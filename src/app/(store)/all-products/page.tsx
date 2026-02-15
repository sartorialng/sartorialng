"use client";
import { useEffect, useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import ProductCard from "@/components/layout/ProductCard";
import Footer from "@/components/layout/Footer";
import { FilterSidebar } from "@/components/layout/FilterSidebar";
import { useRouter } from "next/navigation";
import { useBasketStore } from "@/store/store";
import { Product } from "../../../../sanity.types";
import { getAllProducts } from "@/sanity/lib/product/getAllProducts";
import { toast } from "sonner";
import ProductCardSkeleton from "@/components/layout/ProductCardSkeleton";
import { getFilteredProducts } from "@/sanity/lib/product/getProductsByCategory";
import { convertNGNtoUSD } from "@/lib/currency";
import { categories, colors, priceRanges } from "@/data";
import { SortByDropdown } from "@/components/layout/SortByDropdown";
import { SortByDropdownMobile } from "@/components/layout/SortByDropdownMobile";

const AllProducts = () => {
	const router = useRouter();
	const addItem = useBasketStore((s) => s.addItem);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>(
		[],
	);
	const [selectedColors, setSelectedColors] = useState<string[]>([]);
	const [selectedSort, setSelectedSort] = useState("Alphabetically, A to Z");

	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const handleCategoryChange = (category: string) => {
		setSelectedCategories((prev) =>
			prev.includes(category)
				? prev.filter((c) => c !== category)
				: [...prev, category],
		);
	};

	const handlePriceRangeChange = (range: string) => {
		setSelectedPriceRanges((prev) =>
			prev.includes(range)
				? prev.filter((r) => r !== range)
				: [...prev, range],
		);
	};

	const handleColorChange = (color: string) => {
		setSelectedColors((prev) =>
			prev.includes(color)
				? prev.filter((c) => c !== color)
				: [...prev, color],
		);
	};

	const clearAllFilters = () => {
		setSelectedCategories([]);
		setSelectedPriceRanges([]);
		setSelectedColors([]);
	};

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				if (
					selectedCategories.length > 0 ||
					selectedColors.length > 0
				) {
					const filtered = await getFilteredProducts({
						categories:
							selectedCategories.length > 0
								? selectedCategories
								: undefined,
						colors:
							selectedColors.length > 0
								? selectedColors
								: undefined,
					});
					setProducts(filtered);
				} else {
					const allProducts = await getAllProducts();
					setProducts(allProducts);
				}
			} catch (error) {
				console.error("Error fetching products:", error);
				toast.error("Failed to load products");
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, [selectedCategories, selectedColors]);

	const filteredAndSortedProducts = useMemo(() => {
		let filtered = products;

		if (selectedPriceRanges.length > 0) {
			filtered = products.filter((product) => {
				const priceInNGN = product.price || 0;
				const priceInUSD = convertNGNtoUSD(priceInNGN);

				return selectedPriceRanges.some((range) => {
					switch (range) {
						case "Under $25":
							return priceInUSD < 25;
						case "$25 - $50":
							return priceInUSD >= 25 && priceInUSD <= 50;
						case "$50 - $100":
							return priceInUSD > 50 && priceInUSD <= 100;
						case "Over $100":
							return priceInUSD > 100;
						default:
							return false;
					}
				});
			});
		}

		const sorted = [...filtered];

		switch (selectedSort) {
			case "Alphabetically, A to Z":
				return sorted.sort((a, b) =>
					(a.name || "").localeCompare(b.name || ""),
				);
			case "Alphabetically, Z to A":
				return sorted.sort((a, b) =>
					(b.name || "").localeCompare(a.name || ""),
				);
			case "Price, Low to High":
				return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
			case "Price, High to Low":
				return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
			default:
				return sorted;
		}
	}, [products, selectedPriceRanges, selectedSort]);

	return (
		<div className="h-auto w-full bg-gray-50">
			<Header />
			<div className="flex flex-col md:flex-row w-full px-6 md:px-10 pt-30 pb-20 md:py-40 gap-5 md:gap-8">
				<div className="flex justify-between items-center">
					<FilterSidebar
						categories={categories}
						priceRanges={priceRanges}
						colors={colors}
						selectedCategories={selectedCategories}
						selectedPriceRanges={selectedPriceRanges}
						selectedColors={selectedColors}
						handleCategoryChange={handleCategoryChange}
						handlePriceRangeChange={handlePriceRangeChange}
						handleColorChange={handleColorChange}
						clearAllFilters={clearAllFilters}
					/>
					<SortByDropdownMobile
						selectedSort={selectedSort}
						setSelectedSort={setSelectedSort}
					/>
				</div>

				<div className="w-full md:w-[80%]">
					<div className="hidden md:flex justify-end mb-5">
						<SortByDropdown
							selectedSort={selectedSort}
							setSelectedSort={setSelectedSort}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{loading
							? Array.from({ length: 6 }).map((_, index) => (
									<ProductCardSkeleton key={index} />
								))
							: filteredAndSortedProducts.map((product) => {
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
					{!loading && filteredAndSortedProducts.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-500 text-lg">
								No products found matching your filters.
							</p>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default AllProducts;
