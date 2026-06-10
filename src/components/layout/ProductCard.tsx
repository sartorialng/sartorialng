"use client";
import { useEffect, useState } from "react";
import { Heart, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Product } from "../../../sanity.types";
import { FastDelivery, SartorialBag } from "@/assets";
import { urlFor } from "@/lib/imageUrl";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { convertNGNtoUSD } from "@/lib/currency";
import PreOrderNoticeModal from "../modals/PreOrderNoticeModal";
import PreSaleNoticeModal from "../modals/PreSaleNoticeModal";
import { trackTikTokEvent } from "@/lib/tiktok-events";

interface ProductCardProps {
	product: Product;
	onAddToCart?: () => void;
	onBuyNow?: () => void;
}

const ProductCard = ({ product, onAddToCart, onBuyNow }: ProductCardProps) => {
	const [showPreOrder, setShowPreOrder] = useState(false);
	const [showPreSale, setShowPreSale] = useState(false);
	const { addToWishlist, removeFromWishlist, isInWishlist } =
		useWishlistStore();
	const { isSignedIn } = useUser();
	const { openSignIn } = useClerk();

	const productId = product?._id ?? "";
	const productName = product?.name ?? "Product";
	const productPrice = product?.price ?? 0;
	const salePrice = product?.salePrice ?? 0;

	const productSlug = product?.slug;

	const imageUrl = product?.images?.[0]?.asset
		? urlFor(product.images[0])
		: SartorialBag;
	const imageAlt = product?.name ?? "product-name";
	const isOutOfStock = product?.stock === 0;
	const isComingSoon = product?.isComingSoon;
	const onPreOrder = product?.onPreOrder;

	const preOrderAvailability = product?.preOrderAvailability;
	const preSaleAvailability = product?.preSaleAvailability;

	const onPreSale = product?.onPreSale;

	const isFavorite = isInWishlist(productId);

	const priceInDollars = product ? convertNGNtoUSD(productPrice) : 0;
	const salePriceInDollars = product ? convertNGNtoUSD(salePrice) : 0;

	useEffect(() => {
		if (isSignedIn) {
			const pendingWishlistItem = sessionStorage.getItem(
				"pendingWishlistItem",
			);
			if (pendingWishlistItem) {
				try {
					const pendingProduct = JSON.parse(pendingWishlistItem);
					if (pendingProduct._id === productId) {
						addToWishlist(product);
						toast.success(`${productName} added to wishlist`);
						sessionStorage.removeItem("pendingWishlistItem");
					}
				} catch (error) {
					console.error(
						"Error processing pending wishlist item:",
						error,
					);
					sessionStorage.removeItem("pendingWishlistItem");
				}
			}
		}
	}, [isSignedIn, productId, product, productName, addToWishlist]);

	const toggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!productId) return;

		if (!isSignedIn) {
			sessionStorage.setItem(
				"pendingWishlistItem",
				JSON.stringify(product),
			);

			openSignIn({
				redirectUrl: window.location.href,
				afterSignInUrl: window.location.href,
				afterSignUpUrl: window.location.href,
			});
			return;
		}

		if (isFavorite) {
			removeFromWishlist(productId);
			toast.success(`${productName} removed from wishlist`);
		} else {
			addToWishlist(product);
			toast.success(`${productName} added to wishlist`);
		}
	};

	if (!product || !productId) return null;

	return (
		<div className="w-full max-w-sm border-none cursor-pointer">
			<Link href={`/product/${productSlug}`}>
				<div className="bg-white p-3 md:px-5 md:py-5 rounded-lg hover:border-2 hover:border-sartorial-green hover:shadow-lg transition-all duration-200">
					{product?.onCombo ? (
						<div className="flex justify-between mb-2 md:mb-4">
							<div className="bg-[#2d5a43] text-white px-2 py-1.5 rounded-lg flex items-end justify-between w-fit gap-4">
								<div className="flex flex-col leading-tight">
									<span className="text-[10px] font-bold opacity-90 tracking-wide">
										Combo
									</span>
									<span className="text-[10px] font-semibold whitespace-nowrap">
										Free Shipping
									</span>
								</div>
								<div className="shrink-0 ">
									<Image
										src={FastDelivery}
										alt="fast-delivery-icon"
										className="h-4 w-4"
									/>
								</div>
								{/* <div className="shrink-0 ">
									<Truck
										size={20}
										strokeWidth={2.5}
										className="text-white"
									/>
								</div> */}
							</div>
							<button
								onClick={toggleFavorite}
								className="transition-transform hover:scale-110 focus:outline-none"
								aria-label={
									isFavorite
										? "Remove from wishlist"
										: "Add to wishlist"
								}
							>
								<Heart
									className={`h-4 w-4 md:w-6 md:h-6 transition-colors cursor-pointer ${
										isFavorite
											? "fill-sartorial-green text-sartorial-green"
											: "fill-none text-sartorial-green"
									}`}
								/>
							</button>
						</div>
					) : (
						<div className="flex justify-end mb-2 md:mb-4">
							<button
								onClick={toggleFavorite}
								className="transition-transform hover:scale-110 focus:outline-none"
								aria-label={
									isFavorite
										? "Remove from wishlist"
										: "Add to wishlist"
								}
							>
								<Heart
									className={`h-4 w-4 md:w-6 md:h-6 transition-colors cursor-pointer ${
										isFavorite
											? "fill-sartorial-green text-sartorial-green"
											: "fill-none text-sartorial-green"
									}`}
								/>
							</button>
						</div>
					)}
					<div className="flex justify-center mb-2">
						<div className="relative w-full h-30 md:h-50">
							<Image
								src={imageUrl}
								alt={imageAlt}
								fill
								// sizes="(max-width: 768px) 100vw, 300px"
								className={`object-cover rounded-sm transition-opacity ${
									isOutOfStock
										? "opacity-50 grayscale"
										: isComingSoon
											? "opacity-75"
											: "opacity-100"
								}`}
							/>

							{isOutOfStock && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-sm">
									<span className="bg-red-600 text-white text-[10px] md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
										Out of Stock
									</span>
								</div>
							)}

							{isComingSoon && !isOutOfStock && (
								<div className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/25">
									<span className="bg-sartorial-green text-white text-[10px] md:text-sm font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
										Coming Soon
									</span>
								</div>
							)}
						</div>
					</div>
					{/* {product?.onSale && (
						<div className="flex justify-end">
							<Image
								height={35}
								width={35}
								src={PreSale}
								alt="pre-sale-logo"
							/>
						</div>
					)} */}
					{product?.onSale && product?.discountValue && (
						<div className="flex justify-end">
							<div
								className="flex flex-col items-center justify-center w-10 h-10 bg-[#b2f2d6] text-[#2d5a43] font-bold leading-tight"
								style={{
									clipPath:
										"polygon(50% 0%, 65% 15%, 85% 15%, 85% 35%, 100% 50%, 85% 65%, 85% 85%, 65% 85%, 50% 100%, 35% 85%, 15% 85%, 15% 65%, 0% 50%, 15% 35%, 15% 15%, 35% 15%)",
								}}
							>
								<span className="text-xs">
									{product.discountValue}%
								</span>
								<span className="text-[10px] -mt-1">Off</span>
							</div>
						</div>
					)}
				</div>
			</Link>

			<div className="mt-1">
				<div className="text-center space-y-0">
					<h3
						className="text-lg md:text-2xl font-semibold text-sartorial-green leading-snug truncate w-full"
						title={productName}
					>
						{productName}
					</h3>

					{product.onSale ? (
						<div className="flex flex-col items-center justify-center">
							{/* Naira Prices */}
							<div className="flex items-baseline gap-2">
								<p className="text-sartorial-green/50 line-through text-sm md:text-lg font-medium">
									₦{productPrice.toLocaleString()}
								</p>
								<p className="text-sartorial-green text-base md:text-lg font-semibold tracking-tight">
									₦{salePrice.toLocaleString()}
								</p>
							</div>

							{/* Dollar Prices */}
							<div className="flex items-baseline gap-2">
								<p className="text-sartorial-green/40 line-through text-xs md:text-sm">
									($
									{priceInDollars.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
									)
								</p>
								<p className="text-sartorial-green text-xs md:text-sm font-medium">
									($
									{salePriceInDollars.toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										},
									)}
									)
								</p>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center">
							<p className="text-sartorial-green text-base md:text-lg font-semibold tracking-tight">
								₦{productPrice.toLocaleString()}
							</p>
							<p className="text-sartorial-green text-xs md:text-sm font-medium">
								($
								{priceInDollars.toLocaleString(undefined, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
								)
							</p>
						</div>
					)}
				</div>

				{isComingSoon ? (
					<div className="flex justify-center mt-2 md:mt-4">
						<Button
							disabled
							className="w-full text-[11px] md:text-base h-8 md:h-10 bg-sartorial-green/20 text-sartorial-green font-semibold rounded-sm cursor-not-allowed tracking-wide"
						>
							Coming Soon
						</Button>
					</div>
				) : onPreOrder ? (
					<div className="flex flex-row items-center justify-center mt-2 md:mt-4">
						<Button
							className="text-[11px] md:text-base h-8 md:h-10 bg-sartorial-green hover:bg-green-800 text-white font-medium rounded-sm cursor-pointer"
							onClick={() => setShowPreOrder(true)}
						>
							Pre Order
						</Button>
					</div>
				) : (
					<div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mt-2 md:mt-4">
						<Button
							variant="outline"
							className="flex-1 text-[11px] md:text-base h-8 md:h-10 border-2 border-sartorial-green hover:bg-gray-50 text-sartorial-green font-medium rounded-sm cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								if (onPreSale) {
									setShowPreSale(true);
								} else {
									trackTikTokEvent({
										event_name: "AddToCart",
										value: product.onSale
											? salePrice
											: productPrice,
										currency: "NGN",
										url: window.location.href,
										content_id: productId,
										content_name: productName,
									});
									onAddToCart?.();
								}
							}}
							disabled={isOutOfStock && !onPreOrder && !onPreSale}
						>
							<span className="hidden md:inline">
								Add to Cart
							</span>
							<ShoppingCartIcon className="inline md:hidden w-4 h-4" />
						</Button>
						<Button
							className="flex-1 text-[11px] md:text-base h-8 md:h-10 bg-sartorial-green hover:bg-green-800 text-white font-medium rounded-sm cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								if (onPreSale) {
									setShowPreSale(true);
								} else {
									trackTikTokEvent({
										event_name: "InitiateCheckout",
										value: product.onSale
											? salePrice
											: productPrice,
										currency: "NGN",
										url: window.location.href,
									});
									onBuyNow?.();
								}
							}}
							disabled={isOutOfStock && !onPreOrder && !onPreSale}
						>
							Buy Now
						</Button>
					</div>
				)}
			</div>

			<PreOrderNoticeModal
				date={preOrderAvailability ? preOrderAvailability : ""}
				isOpen={showPreOrder}
				onClose={() => setShowPreOrder(false)}
				onContinue={() => {
					onBuyNow?.();
				}}
			/>
			<PreSaleNoticeModal
				date={preSaleAvailability ? preSaleAvailability : ""}
				isOpen={showPreSale}
				onClose={() => setShowPreSale(false)}
				onContinue={() => {
					onBuyNow?.();
				}}
			/>
		</div>
	);
};

export default ProductCard;
