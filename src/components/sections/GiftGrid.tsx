"use client";
import ProductCard from "../layout/ProductCard";
import { useRouter } from "next/navigation";
import { useBasketStore } from "@/store/store";
import { toast } from "sonner";
import { Product } from "../../../sanity.types";
import { getFirstAvailableColor } from "@/lib/stock";

interface GiftGridProps {
	gifts: Product[];
}

const GiftGrid = ({ gifts }: GiftGridProps) => {
	const router = useRouter();
	const addItem = useBasketStore((s) => s.addItem);

	return (
		// scroll-mt offsets the fixed header so the hero CTA lands on the heading
		<section
			id="build-your-box"
			className="w-full scroll-mt-24 md:scroll-mt-28 bg-gray-50 px-6 py-14 md:px-20 md:py-20"
		>
			<div className="flex flex-col items-center text-center">
				<h2 className="text-2xl md:text-4xl font-semibold md:font-bold text-sartorial-green">
					Build Your Box
				</h2>
				<p className="mt-3 max-w-160 text-sm md:text-base text-sartorial-green/70">
					Choose the pieces you want inside. We wrap, ribbon and deliver.
				</p>
			</div>

			{gifts.length === 0 ? (
				<p className="mt-12 md:mt-16 text-center text-sm text-sartorial-green/60">
					Our gift boxes are being restocked. Please check back soon.
				</p>
			) : (
				<div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-10">
					{gifts.map((gift) => {
						// Gifts may legitimately have no colour, so unlike the
						// shop grids we don't skip the card when one is missing.
						const colorToUse = getFirstAvailableColor(gift);

						return (
							<ProductCard
								key={gift._id}
								product={gift}
								onAddToCart={() => {
									addItem(gift, colorToUse);
									toast.success(`${gift.name} added to your box`);
								}}
								onBuyNow={() => {
									addItem(gift, colorToUse);
									router.push("/checkout");
								}}
							/>
						);
					})}
				</div>
			)}
		</section>
	);
};

export default GiftGrid;
