"use client";
import { useEffect } from "react";
import { Heart, ShoppingCartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { Product } from "../../../sanity.types";
import { SartorialBag } from "@/assets";
import { urlFor } from "@/lib/imageUrl";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { convertNGNtoUSD } from "@/lib/currency";

interface ProductCardProps {
	product: Product;
	onAddToCart?: () => void;
	onBuyNow?: () => void;
}

const ProductCard = ({ product, onAddToCart, onBuyNow }: ProductCardProps) => {
	const { addToWishlist, removeFromWishlist, isInWishlist } =
		useWishlistStore();
	const { isSignedIn } = useUser();
	const { openSignIn } = useClerk();

	const productId = product?._id ?? "";
	const productName = product?.name ?? "Product";
	const productPrice = product?.price ?? 0;
	const productSlug =
		product?.slug?.current ??
		productName.toLowerCase().replace(/\s+/g, "-");

	const imageUrl = product?.images?.[0]?.asset
		? urlFor(product.images[0])
		: SartorialBag;
	const imageAlt = product?.name ?? "product-name";
	const isOutOfStock = product?.stock === 0;

	const isFavorite = isInWishlist(productId);

	const priceInDollars = product ? convertNGNtoUSD(productPrice) : 0;

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
				<div className="bg-white p-3 md:p-5 rounded-lg hover:border-2 hover:border-sartorial-green hover:shadow-lg transition-all duration-200">
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
					<div className="flex justify-center mb-2">
						<div className="relative w-full h-30 md:h-50">
							<Image
								src={imageUrl}
								alt={imageAlt}
								fill
								sizes="(max-width: 768px) 100vw, 300px"
								className={`object-contain rounded-sm transition-opacity ${
									isOutOfStock
										? "opacity-50 grayscale"
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
						</div>
					</div>
				</div>
			</Link>

			<div className="mt-3">
				<div className="text-center space-y-2">
					<h3 className="text-lg md:text-2xl font-semibold text-sartorial-green leading-5">
						{productName}
					</h3>

					{productPrice > 0 && (
						<div className="flex md:flex-col items-center gap-2 md:gap-0 justify-center">
							<p className="text-sartorial-green text-sm md:text-xl">
								₦{productPrice.toLocaleString()}
							</p>
							<p className="text-xs md:text-sm text-sartorial-green">
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

				<div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mt-2 md:mt-4">
					<Button
						variant="outline"
						className="flex-1 text-[11px] md:text-base h-8 md:h-10 border-2 border-sartorial-green hover:bg-gray-50 text-sartorial-green font-medium rounded-sm cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							onAddToCart?.();
						}}
						disabled={isOutOfStock}
					>
						{/* Add to Cart */}
						<span className="hidden md:inline">Add to Cart</span>
						<ShoppingCartIcon className="inline md:hidden w-4 h-4" />
					</Button>
					<Button
						className="flex-1 text-[11px] md:text-base h-8 md:h-10 bg-sartorial-green hover:bg-green-800 text-white font-medium rounded-sm cursor-pointer"
						onClick={(e) => {
							e.preventDefault();
							onBuyNow?.();
						}}
						disabled={isOutOfStock}
					>
						Buy Now
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ProductCard;
