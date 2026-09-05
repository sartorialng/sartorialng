"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { PortableText } from "@portabletext/react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Tabs, { TabItem } from "@/components/layout/Tabs";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/layout/ProductCard";
import { BusIcon2, ReturnIcon, SartorialBag } from "@/assets";

import { useWishlistStore } from "@/store/useWishlistStore";
import { useBasketStore } from "@/store/store";
import { convertNGNtoUSD } from "@/lib/currency";
import Link from "next/link";
import { trackTikTokEvent } from "@/lib/tiktok-events";
import { snapViewContent, snapAddToCart } from "@/lib/snap-events";
import { getFreeGift } from "@/lib/freeGift";
import {
	getColorStock,
	getFirstAvailableColor,
	isColorSoldOut,
	isProductSoldOut,
} from "@/lib/stock";

export type Color = {
	_id: string;
	title: string;
	stock?: number | null;
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

export type ProductDetailsClientProps = {
	initialProduct: any;
	initialRelated: any;
};

export default function ProductDetailsClient({
	initialProduct,
	initialRelated,
}: any) {
	const { isSignedIn } = useUser();
	const router = useRouter();
	const addItem = useBasketStore((s) => s.addItem);
	const { addToWishlist, removeFromWishlist, isInWishlist } =
		useWishlistStore();

	const [product] = useState(initialProduct);
	const [relatedProducts] = useState(initialRelated);
	const [quantity, setQuantity] = useState(1);
	const [generalTab, setGeneralTab] = useState("product-details");
	const [selectedColor, setSelectedColor] = useState(
		() => getFirstAvailableColor<Color>(product)?._id || "",
	);
	const [selectedImage, setSelectedImage] = useState(() => {
		const firstColorId = getFirstAvailableColor<Color>(product)?._id;
		return (
			(firstColorId &&
				product?.images?.find(
					(img: ProductImage) => img.color?._id === firstColorId,
				)) ||
			product?.images?.[0] ||
			null
		);
	});

	const isFavorite = isInWishlist(product?._id);
	// Stock is tracked per colour. A colour with no count of its own falls
	// back to the product-level stock (see src/lib/stock.ts).
	const selectedColorInfo = product?.colors?.find(
		(c: Color) => c._id === selectedColor,
	);
	const selectedStock = getColorStock(product, selectedColor);
	const selectedSoldOut = isColorSoldOut(product, selectedColor);
	const isOutOfStock = isProductSoldOut(product);
	const canPurchaseSoldOut =
		product?.onPreSale === true || product?.onPreOrder === true;
	const purchaseBlocked = selectedSoldOut && !canPurchaseSoldOut;
	const quantityCap =
		selectedStock === null || canPurchaseSoldOut ? Infinity : selectedStock;
	const isComingSoon = product?.isComingSoon;
	const freeGift = getFreeGift(product);
	const priceInDollars = convertNGNtoUSD(product.price);
	const salePriceInDollars = convertNGNtoUSD(product.salePrice);

	// const handleColorSelect = (colorId: string) => {
	// 	setSelectedColor(colorId);
	// };

	const handleColorSelect = (colorId: string) => {
		setSelectedColor(colorId);

		const nextStock = getColorStock(product, colorId);
		if (nextStock !== null && !canPurchaseSoldOut) {
			setQuantity((q) => Math.max(1, Math.min(q, nextStock)));
		}

		const matchedImage = product.images.find(
			(img: ProductImage) => img.color?._id === colorId,
		);

		if (matchedImage) {
			setSelectedImage(matchedImage);
		}
	};

	const toggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!isSignedIn) {
			toast.error("Please sign in to manage your wishlist");
			return;
		}
		if (isFavorite) {
			removeFromWishlist(product._id);
		} else {
			addToWishlist(product);
		}
	};

	const handleQuantityChange = (action: "increment" | "decrement") => {
		if (purchaseBlocked) return;
		if (action === "increment" && quantity < quantityCap)
			setQuantity((q) => q + 1);
		if (action === "decrement" && quantity > 1) setQuantity((q) => q - 1);
	};

	const generalTabItems: TabItem[] = [
		{ id: "product-details", label: "Product Details" },
		{ id: "shipping", label: "Shipping" },
		{ id: "additional-info", label: "Additional Information" },
	];

	useEffect(() => {
		const price =
			initialProduct.onSale && initialProduct.salePrice
				? initialProduct.salePrice
				: initialProduct.price;

		const fireEvent = () => {
			trackTikTokEvent({
				event_name: "ViewContent",
				url: window.location.href,
				value: price,
				currency: "NGN",
				content_id: initialProduct._id,
				content_name: initialProduct.name,
			});
			snapViewContent({
				item_ids: [initialProduct._id],
				item_name: initialProduct.name,
				price,
				currency: "NGN",
			});
		};

		if (window.ttq) {
			fireEvent();
		} else {
			const interval = setInterval(() => {
				if (window.ttq) {
					fireEvent();
					clearInterval(interval);
				}
			}, 500);

			return () => clearInterval(interval);
		}
	}, [initialProduct.price, initialProduct.onSale, initialProduct.salePrice]);

	return (
		<div className="h-auto w-full bg-sartorial-offWhite">
			<Header />

			<div className="w-full pt-20 pb-10 px-5 md:px-20 md:pt-40">
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
											className={`w-20 h-20 border rounded-lg cursor-pointer transition-all flex items-center justify-center ${
												selectedImage?.asset.url ===
												img.asset.url
													? "border-sartorial-green border-2"
													: "border-gray-300"
											}`}
											onClick={() => {
												setSelectedImage(img);
												if (img?.color?._id) {
													handleColorSelect(
														img.color._id,
													);
												}
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
												className="object-cover w-full h-full p-1 rounded-lg"
											/>
										</div>
									),
								)}
							</div>

							<div className="relative h-[300px] md:h-[500px] w-full bg-white rounded-lg flex items-center justify-center overflow-hidden">
								{/* Product Image */}
								<Image
									fill
									src={
										selectedImage?.asset.url ??
										product.images[0]?.asset.url ??
										SartorialBag
									}
									alt={selectedImage?.alt ?? product.name}
									className={`rounded-xl object-cover w-full h-full transition-all duration-300 ${
										isOutOfStock
											? "grayscale opacity-40"
											: isComingSoon
												? "opacity-80"
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

								{/* Selected colour sold out (other colours still available) */}
								{selectedSoldOut && !isOutOfStock && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/20 px-4">
										<div className="w-full max-w-xs rounded-lg bg-white px-6 py-5 text-center shadow-xl">
											<span className="inline-block rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
												Sold Out
											</span>
											<p className="mt-3 text-sm text-gray-800">
												<span className="font-semibold text-red-700">
													{selectedColorInfo?.title}
												</span>{" "}
												is currently unavailable.
											</p>
											<p className="text-sm text-gray-800">
												Select another color
											</p>
										</div>
									</div>
								)}

								{/* Coming Soon Overlay */}
								{isComingSoon && !isOutOfStock && (
									<div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
										<div className="bg-sartorial-green text-white px-6 py-3 rounded-md shadow-xl transform -rotate-3 border border-white/20">
											<p className="text-xl font-bold uppercase tracking-widest">
												Coming Soon
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
							{product?.onSale ? (
								<div className="flex items-center gap-2">
									<p className="text-2xl font-medium line-through text-sartorial-green/50">
										₦
										{(
											product.price * quantity
										).toLocaleString()}
									</p>
									<p className="text-2xl font-medium">
										₦
										{(
											product.salePrice * quantity
										).toLocaleString()}
									</p>
								</div>
							) : (
								<p className="text-2xl font-semibold">
									₦
									{(
										product.price * quantity
									).toLocaleString()}
								</p>
							)}
							{product?.onSale ? (
								<div className="flex items-center gap-2">
									<p className="text-xl text-sartorial-green/40 line-through">
										($
										{(
											priceInDollars * quantity
										).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
										)
									</p>
									<p className="text-xl">
										($
										{(
											salePriceInDollars * quantity
										).toLocaleString(undefined, {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})}
										)
									</p>
								</div>
							) : (
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
							)}

							<p className="text-sm font-medium text-sartorial-green/80">
								🌍 We ship worldwide — delivery to your country
								calculated at checkout.
							</p>

							{freeGift?.name && (
								<div className="flex items-start gap-3 rounded-lg border border-sartorial-green/30 bg-sartorial-green/5 p-3">
									<span className="text-lg leading-none">🎁</span>
									<p className="text-sm text-sartorial-green">
										<span className="font-semibold">
											Free gift included:
										</span>{" "}
										every {product.name} comes with a
										complimentary {freeGift.name}.
										It&apos;s added to your cart
										automatically.
									</p>
								</div>
							)}

							{/* Description */}
							<div className="text-gray-700 text-sm leading-relaxed">
								{product.description && (
									<PortableText value={product.description} />
								)}
							</div>

							{/* Stock Status */}
							<p className="text-sm">
								<span className="font-semibold">
									Availability:
								</span>{" "}
								{isComingSoon ? (
									<span className="text-sartorial-green font-medium">
										Coming Soon
									</span>
								) : !selectedSoldOut ? (
									<span className="text-green-600">
										{selectedStock !== null && selectedStock < 10
											? `${selectedStock} available`
											: "In Stock"}
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
								<p className="mb-2 flex flex-wrap items-center gap-2">
									<span>
										Select Color:{" "}
										<span className="font-semibold">
											{selectedColorInfo?.title}
										</span>
									</span>
									{selectedSoldOut && (
										<span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
											Sold Out
										</span>
									)}
								</p>
								<div className="flex items-center gap-2 flex-wrap">
									{product.colors.map((color: Color) => {
										const soldOut = isColorSoldOut(
											product,
											color._id,
										);
										return (
											<Button
												key={color._id}
												variant={
													selectedColor === color._id
														? "default"
														: "outline"
												}
												aria-disabled={soldOut}
												title={
													soldOut
														? `${color.title} is sold out`
														: undefined
												}
												className={`text-sm font-medium rounded-sm cursor-pointer ${
													selectedColor === color._id
														? "bg-sartorial-green hover:bg-green-800 text-white"
														: "border-2 border-sartorial-green hover:bg-gray-50 text-sartorial-green"
												} ${soldOut ? "line-through opacity-60" : ""}`}
												onClick={() =>
													handleColorSelect(color._id)
												}
											>
												{color.title}
											</Button>
										);
									})}
								</div>
							</div>
						)}

						{/* Coming Soon notice */}
						{isComingSoon && (
							<div className="mt-5 bg-sartorial-green/10 border border-sartorial-green/30 rounded-sm px-4 py-3">
								<p className="text-sartorial-green font-semibold text-sm uppercase tracking-wide">
									Coming Soon
								</p>
								<p className="text-sartorial-green/70 text-xs mt-0.5">
									This product is not yet available for purchase. Check back soon!
								</p>
							</div>
						)}

						{/* Quantity and Actions */}
						<div className={`mt-5 flex items-center gap-3 ${isComingSoon ? "opacity-40 pointer-events-none select-none" : ""}`}>
							{/* Quantity Selector */}
							<div className="flex items-center">
								<button
									onClick={() =>
										handleQuantityChange("decrement")
									}
									className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-tl-sm rounded-bl-sm h-10 px-3 md:px-4 text-xl hover:bg-gray-50 transition-colors"
									disabled={purchaseBlocked || quantity <= 1}
								>
									-
								</button>
								<div className="cursor-default text-sartorial-green border-y-2 border-sartorial-green h-10 px-4 md:px-6 flex items-center justify-center w-10 md:w-15 text-lg md:text-xl font-semibold">
									{purchaseBlocked ? 0 : quantity}
								</div>
								<button
									onClick={() =>
										handleQuantityChange("increment")
									}
									className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-tr-sm rounded-br-sm h-10 px-3 md:px-4 text-xl hover:bg-gray-50 transition-colors"
									disabled={
										purchaseBlocked ||
										quantity >= quantityCap
									}
								>
									+
								</button>
							</div>

							{/* Buy Now Button */}
							{product?.onPreOrder ? (
								<Button
									variant="outline"
									className="cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-sm h-10 px-4 md:px-10 hover:bg-gray-50"
									disabled={
										selectedSoldOut &&
										product.onPreSale === false
									}
									onClick={() => {
										const colorInfo = product.colors?.find(
											(c: Color) =>
												c._id === selectedColor,
										);

										trackTikTokEvent({
											event_name: "AddToCart",
											value:
												product.onSale &&
												product.salePrice
													? product.salePrice *
														quantity
													: product.price * quantity,
											currency: "NGN",
											url: window.location.href,
											content_id: initialProduct._id,
											content_name: initialProduct.name,
											quantity,
										});
										snapAddToCart({
											item_ids: [initialProduct._id],
											item_name: initialProduct.name,
											price: product.onSale && product.salePrice
												? product.salePrice * quantity
												: product.price * quantity,
											currency: "NGN",
											number_items: quantity,
										});

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
									Pre Order
								</Button>
							) : (
								<Button
									variant="outline"
									className={
										purchaseBlocked
											? "cursor-not-allowed rounded-sm h-10 px-4 md:px-10 border-2 border-gray-300 bg-gray-300 text-gray-500 line-through hover:bg-gray-300 disabled:opacity-100"
											: "cursor-pointer text-sartorial-green border-2 border-sartorial-green rounded-sm h-10 px-4 md:px-10 hover:bg-gray-50"
									}
									disabled={purchaseBlocked}
									onClick={() => {
										const colorInfo = product.colors?.find(
											(c: Color) =>
												c._id === selectedColor,
										);

										trackTikTokEvent({
											event_name: "AddToCart",
											value:
												product.onSale &&
												product.salePrice
													? product.salePrice *
														quantity
													: product.price * quantity,
											currency: "NGN",
											url: window.location.href,
											content_id: initialProduct._id,
											content_name: initialProduct.name,
											quantity,
										});
										snapAddToCart({
											item_ids: [initialProduct._id],
											item_name: initialProduct.name,
											price: product.onSale && product.salePrice
												? product.salePrice * quantity
												: product.price * quantity,
											currency: "NGN",
											number_items: quantity,
										});

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
									{purchaseBlocked ? "Unavailable" : "Buy Now"}
								</Button>
							)}

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
								<div className="flex flex-col gap-1">
									<p className="text-xl font-semibold">
										Fast Delivery, Worldwide
									</p>
									<p className="text-sm">
										Nationwide within Nigeria and international
										delivery via DHL. Shipping fee according to
										your location.{" "}
										<Link
											href="/shipping-details"
											className="cursor-pointer underline"
										>
											Details
										</Link>
									</p>
								</div>
							</div>
							<div className="flex items-center gap-5 py-3 px-6">
								<ReturnIcon />
								<div className="flex flex-col gap-1">
									<p className="text-xl font-semibold">
										Return Delivery
									</p>
									<p className="text-sm">
										24hrs order exchange for customers
										within Lagos.{" "}
										<Link
											href="/refund-and-returns"
											className="cursor-pointer underline"
										>
											Details
										</Link>
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
								We offer fast nationwide delivery within Nigeria
								(2–5 business days) and international shipping via
								DHL to customers worldwide.
							</p>
							<p className="mt-2">
								Shipping cost is calculated at checkout based on
								your location.
							</p>
						</div>
					)}

					{generalTab === "additional-info" && (
						<div className="text-sm text-gray-700">
							<p>
								This product is made with premium materials and
								carefully finished to ensure durability and
								comfort.
							</p>
							<p className="mt-2">
								For care instructions, avoid bleach and machine
								wash cold.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Related Products */}
			<div className="w-full mt-10 px-6 md:px-20 py-10 bg-gray-50">
				<div>
					<p className="text-2xl font-semibold text-sartorial-green">
						Related Products
					</p>
				</div>
				<div className="mt-5 md:mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
					{relatedProducts.map((product: any) => {
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
			<Footer />
		</div>
	);
}
