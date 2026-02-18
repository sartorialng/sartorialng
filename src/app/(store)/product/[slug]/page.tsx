"use client";
import { BusIcon2, ReturnIcon, SartorialBag } from "@/assets";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Tabs, { TabItem } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/sanity/lib/product/getProductBySlug";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PortableText } from "@portabletext/react";
import { useWishlistStore } from "@/store/useWishlistStore";
import { toast } from "sonner";
import { useBasketStore } from "@/store/store";
import ProductCard from "@/components/layout/ProductCard";
import { Product } from "../../../../../sanity.types";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
import ProductCardSkeleton from "@/components/layout/ProductCardSkeleton";
import ProductDetailsSkeleton from "../ProductDetailsSkeleton";
import { useUser } from "@clerk/nextjs";
import { convertNGNtoUSD } from "@/lib/currency";
import { log } from "console";

export type Color = {
	_id: string;
	title: string;
	hex: string;
};

export type ProductImage = {
	alt: string;
	asset: {
		url: string;
	};
	color?: Color;
};

export type ProductData = {
	_id: string;
	name: string;
	slug: string;
	price: number;
	stock: number;
	description: any[];
	isBestSeller: boolean;
	isNewArrival: boolean;
	images: ProductImage[];
	colors: Color[];
	categories: any[] | null;
};

const ProductDetails = () => {
	const { isSignedIn } = useUser();
	const router = useRouter();
	const params = useParams();
	const slug = params.slug as string;
	const addItem = useBasketStore((s) => s.addItem);

	const [generalTab, setGeneralTab] = useState("product-details");
	const [product, setProduct] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedColor, setSelectedColor] = useState<string>("");
	const [selectedImage, setSelectedImage] = useState<ProductImage | null>(
		null,
	);
	const [quantity, setQuantity] = useState(1);

	const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
	const [isRelatedProductsloading, setIsRelatedProductsLoading] =
		useState(true);

	const priceInDollars = product ? convertNGNtoUSD(product.price) : 0;

	const { addToWishlist, removeFromWishlist, isInWishlist } =
		useWishlistStore();
	const isFavorite = isInWishlist(product?._id);
	const isOutOfStock = product?.stock === 0;

	const toggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isSignedIn) {
			toast.error("Please sign in to manage your wishlist", {
				description: "You need an account to save items for later.",
			});
			return;
		}

		if (!product?._id) return;

		if (isFavorite) {
			removeFromWishlist(product._id);
		} else {
			addToWishlist(product);
		}
	};

	const generalTabItems: TabItem[] = [
		{
			id: "product-details",
			label: "Product Details",
		},
		{
			id: "shipping",
			label: "Shipping",
		},
		{
			id: "additional-info",
			label: "Additional Information",
		},
	];

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const data = await getProductBySlug(slug);
				setProduct(data);

				if (data?.colors?.length > 0) {
					setSelectedColor(data.colors[0]._id);
				}
				if (data?.images?.length > 0) {
					setSelectedImage(data.images[0]);
				}
			} catch (error) {
				console.error("Error fetching product:", error);
			} finally {
				setLoading(false);
			}
		};

		if (slug) {
			fetchProduct();
		}
	}, [slug]);

	useEffect(() => {
		getBestSellers()
			.then((data) => setRelatedProducts(data))
			.finally(() => setIsRelatedProductsLoading(false));
	}, []);

	const handleColorSelect = (colorId: string) => {
		setSelectedColor(colorId);
	};

	const handleQuantityChange = (action: "increment" | "decrement") => {
		if (action === "increment" && product && quantity < product.stock) {
			setQuantity(quantity + 1);
		} else if (action === "decrement" && quantity > 1) {
			setQuantity(quantity - 1);
		}
	};

	console.log("Product data:", product);
	return (
		<div className="h-auto w-full bg-sartorial-offWhite">
			<Header />
			{loading ? (
				<ProductDetailsSkeleton />
			) : (
				<div className="w-full pt-10 pb-10 px-5 md:px-20 md:pt-40">
					<div className="w-full flex flex-col md:flex-row justify-between gap-5">
						{/* Images Section */}
						<div className="w-full md:w-[60%]">
							<div className="flex gap-2 flex-col-reverse md:flex-row">
								{/* Thumbnail Images */}
								<div className="flex flex-row md:flex-col gap-3">
									{product.images.map(
										(img: ProductImage, index: number) => (
											<div
												key={index}
												className={`w-20 h-20 md:w-30 md:h-30 border rounded-lg cursor-pointer transition-all flex items-center justify-center ${
													selectedImage?.asset.url ===
													img.asset.url
														? "border-sartorial-green border-2"
														: "border-gray-300"
												}`}
												onClick={() => {
													setSelectedImage(img);
												}}
											>
												<Image
													width={100}
													height={100}
													src={
														img.asset.url ??
														SartorialBag
													}
													alt={img.alt ?? "product"}
													className="object-contain w-full h-full p-2"
												/>
											</div>
										),
									)}
								</div>

								{/* Main Image */}
								{/* <div
									className="w-full bg-white rounded-lg flex items-center justify-center"
									style={{ height: "500px" }}
								>
									<Image
										width={500}
										height={500}
										src={
											selectedImage?.asset.url ??
											product.images[0]?.asset.url ??
											SartorialBag
										}
										alt={selectedImage?.alt ?? product.name}
										className="object-contain max-w-full max-h-full"
										priority
									/>
								</div> */}
								<div
									className="relative w-full bg-white rounded-lg flex items-center justify-center overflow-hidden"
									style={{ height: "500px" }}
								>
									{/* Product Image */}
									<Image
										width={500}
										height={500}
										src={
											selectedImage?.asset.url ??
											product.images[0]?.asset.url ??
											SartorialBag
										}
										alt={selectedImage?.alt ?? product.name}
										className={`object-contain max-w-full max-h-full transition-all duration-300 ${
											isOutOfStock
												? "grayscale opacity-40"
												: ""
										}`}
										priority
									/>

									{/* Out of Stock Overlay */}
									{isOutOfStock && (
										<div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
											<div className="bg-black/80 text-white px-6 py-3 rounded-md shadow-xl transform -rotate-3 border border-white/20">
												<p className="text-xl font-bold uppercase tracking-widest">
													Out of Stock
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Product Info Section */}
						<div className="w-full md:w-[40%] text-sartorial-green">
							<div className="space-y-1">
								<h1 className="text-4xl font-semibold">
									{product.name}
								</h1>
								<p className="text-2xl font-bold">
									₦
									{(
										product.price * quantity
									).toLocaleString()}
								</p>
								<p className="text-xl">
									($
									{(priceInDollars * quantity).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										},
									)}
									)
								</p>

								{/* Description */}
								<div className="text-gray-700 text-sm leading-relaxed">
									{product.description && (
										<PortableText
											value={product.description}
										/>
									)}
								</div>

								{/* Stock Status */}
								<p className="text-sm">
									<span className="font-semibold">
										Availability:
									</span>{" "}
									{product.stock > 0 ? (
										<span className="text-green-600">
											In Stock ({product.stock} available)
										</span>
									) : (
										<span className="text-red-600">
											Out of Stock
										</span>
									)}
								</p>
							</div>

							{/* Color Selection */}
							{product.colors && product.colors.length > 0 && (
								<div className="mt-5">
									<p className="mb-2">
										Select Color:{" "}
										<span className="font-semibold">
											{
												product.colors.find(
													(c: Color) =>
														c._id === selectedColor,
												)?.title
											}
										</span>
									</p>
									<div className="flex items-center gap-2 flex-wrap">
										{product.colors.map((color: Color) => (
											<Button
												key={color._id}
												variant={
													selectedColor === color._id
														? "default"
														: "outline"
												}
												className={`text-sm font-medium rounded-sm cursor-pointer ${
													selectedColor === color._id
														? "bg-sartorial-green hover:bg-green-800 text-white"
														: "border-2 border-sartorial-green hover:bg-gray-50 text-sartorial-green"
												}`}
												onClick={() =>
													handleColorSelect(color._id)
												}
											>
												{color.title}
											</Button>
										))}
									</div>
								</div>
							)}

							{/* Quantity and Actions */}
							<div className="mt-5 flex items-center gap-3">
								{/* Quantity Selector */}
								<div className="flex items-center">
									<button
										onClick={() =>
											handleQuantityChange("decrement")
										}
										className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-tl-sm rounded-bl-sm h-10 px-3 md:px-4 text-xl hover:bg-gray-50 transition-colors"
										disabled={quantity <= 1}
									>
										-
									</button>
									<div className="cursor-default text-sartorial-green border-y-2 border-sartorial-green h-10 px-4 md:px-6 flex items-center justify-center w-10 md:w-15 text-lg md:text-xl font-semibold">
										{quantity}
									</div>
									<button
										onClick={() =>
											handleQuantityChange("increment")
										}
										className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-tr-sm rounded-br-sm h-10 px-3 md:px-4 text-xl hover:bg-gray-50 transition-colors"
										disabled={quantity >= product.stock}
									>
										+
									</button>
								</div>

								{/* Buy Now Button */}
								<Button
									variant="outline"
									className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-sm h-10 px-4 md:px-10 hover:bg-gray-50"
									disabled={product.stock <= 0}
									onClick={() => {
										const colorInfo = product.colors?.find(
											(c: Color) =>
												c._id === selectedColor,
										);

										for (let i = 0; i < quantity; i++) {
											addItem(
												product,
												colorInfo
													? {
															_id: colorInfo._id,
															title: colorInfo.title,
														}
													: undefined,
											);
										}
										toast.success(
											`${product.name}${colorInfo ? ` (${colorInfo.title})` : ""} added to cart`,
										);
										router.push("/checkout");
									}}
								>
									Buy Now
								</Button>

								{/* Wishlist Button */}
								<button
									onClick={toggleFavorite}
									className="transition-transform hover:scale-110 focus:outline-none border-2 border-sartorial-green cursor-pointer rounded-sm h-10 px-3"
									aria-label={
										isFavorite
											? "Remove from favorites"
											: "Add to favorites"
									}
								>
									<Heart
										className={`w-6 h-6 transition-colors cursor-pointer ${
											isFavorite
												? "fill-sartorial-green text-sartorial-green"
												: "fill-none text-sartorial-green"
										}`}
									/>
								</button>
							</div>

							{/* Delivery Info */}
							<div className="mt-5 border border-[#40404040] rounded-sm">
								<div className="flex items-center gap-5 py-3 px-6 border-b border-[#40404040]">
									<BusIcon2 />
									<div className="flex flex-col gap-2">
										<p className="text-xl font-semibold">
											Fast Delivery
										</p>
										<p className="text-sm underline cursor-pointer">
											Enter your postal code for Delivery
											Availability
										</p>
									</div>
								</div>
								<div className="flex items-center gap-5 py-3 px-6">
									<ReturnIcon />
									<div className="flex flex-col gap-2">
										<p className="text-xl font-semibold">
											Return Delivery
										</p>
										<p className="text-sm">
											Free 30 Days Delivery Returns.{" "}
											<span className="underline cursor-pointer">
												Details
											</span>
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Tabs Section */}
					<div className="mt-10 border-b border-[#D1D5DB]">
						<Tabs
							tabs={generalTabItems}
							activeTab={generalTab}
							onChange={setGeneralTab}
						/>
					</div>

					{/* Product Details Section */}
					<div className="mt-6 text-sartorial-green">
						{generalTab === "product-details" && (
							<div className="space-y-4 max-w-4xl">
								{product.detailedDescription && (
									<div className="whitespace-pre-line text-sm text-gray-700">
										{product.detailedDescription}
									</div>
								)}
							</div>
						)}

						{generalTab === "shipping" && (
							<div className="text-sm text-gray-700">
								<p>
									We offer fast nationwide delivery within 2–5
									business days.
								</p>
								<p className="mt-2">
									Shipping cost is calculated at checkout
									based on your location.
								</p>
							</div>
						)}

						{generalTab === "additional-info" && (
							<div className="text-sm text-gray-700">
								<p>
									This product is made with premium materials
									and carefully finished to ensure durability
									and comfort.
								</p>
								<p className="mt-2">
									For care instructions, avoid bleach and
									machine wash cold.
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Related Products */}
			<div className="w-full mt-10 px-6 md:px-20 py-10 bg-gray-50">
				<div>
					<p className="text-2xl font-semibold text-sartorial-green">
						Related Products
					</p>
				</div>
				<div className="mt-5 md:mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
					{isRelatedProductsloading
						? Array.from({ length: 4 }).map((_, index) => (
								<ProductCardSkeleton key={index} />
							))
						: relatedProducts.map((product) => {
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
			<Footer />
		</div>
	);
};

export default ProductDetails;
