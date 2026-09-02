"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";
import type { StoreCategory } from "@/sanity/lib/product/getCategories";
import { cn } from "@/lib/utils";
import { AllProductsTile } from "@/assets";
import {
	hasAllProductsCategory,
	isAllProducts,
} from "@/hooks/useStorefrontCategories";

interface CategoryTile {
	key: string;
	label: string;
	href: string | null;
	imageUrl: string | null;
	fallbackImage: typeof AllProductsTile | null;
	alt: string;
	comingSoon: boolean;
}

const ShopByCategory = ({ categories }: { categories: StoreCategory[] }) => {
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const syncArrows = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;

		setCanScrollPrev(el.scrollLeft > 1);
		setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
	}, []);

	useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;

		syncArrows();
		el.addEventListener("scroll", syncArrows, { passive: true });

		const observer = new ResizeObserver(syncArrows);
		observer.observe(el);

		return () => {
			el.removeEventListener("scroll", syncArrows);
			observer.disconnect();
		};
	}, [syncArrows, categories.length]);

	const scrollByPage = (direction: 1 | -1) => {
		const el = scrollerRef.current;
		if (!el) return;
		el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
	};

	if (categories.length === 0) return null;

	const tiles: CategoryTile[] = categories.map((category) => ({
		key: category._id,
		label: category.title,

		href: category.comingSoon
			? null
			: isAllProducts(category.title)
				? "/all-products"
				: `/category?value=${encodeURIComponent(category.title)}`,
		imageUrl: category.image?.asset
			? urlFor(category.image).width(320).height(320).fit("crop").url()
			: null,
		fallbackImage: null,
		alt: category.image?.alt || category.title,
		comingSoon: Boolean(category.comingSoon),
	}));

	if (!hasAllProductsCategory(categories)) {
		tiles.push({
			key: "all-products",
			label: "All Products",
			href: "/all-products",
			imageUrl: null,
			fallbackImage: AllProductsTile,
			alt: "All Products",
			comingSoon: false,
		});
	}

	return (
		<section className="w-full px-6 md:px-20 py-20 bg-sartorial-green bg-[radial-gradient(ellipse_at_center,rgba(142,192,158,0.22),transparent_70%)]">
			<div className="flex justify-center">
				<h2 className="text-center text-2xl md:text-4xl md:font-bold text-white">
					Shop by Category
				</h2>
			</div>

			<div className="relative mt-10 md:mt-16">
				<div
					ref={scrollerRef}
					className={cn(
						"overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth",
						"[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
					)}
				>
					{/* min-w-max keeps the track as wide as its content so it
					    scrolls from the very first tile; w-full lets
					    justify-center take effect only when everything fits. */}
					<div className="flex w-full min-w-max justify-center gap-4 sm:gap-6 md:gap-10">
						{/* 33vw keeps roughly a third of the next circle cut off
						    at the edge across phone widths — that partial circle
						    is the cue that the rail swipes. A fixed px width
						    can't hold the peek: it collapses to a sliver on
						    narrow (360px) screens. */}
						{tiles.map((tile) => (
							<div
								key={tile.key}
								className="shrink-0 snap-start w-[33vw] max-w-40 sm:w-40 md:w-44"
							>
								<CategoryCircle tile={tile} />
							</div>
						))}
					</div>
				</div>

				{canScrollPrev && (
					<button
						type="button"
						onClick={() => scrollByPage(-1)}
						aria-label="Previous categories"
						className="hidden md:flex absolute left-0 lg:-left-10 top-[75px] -translate-y-1/2 items-center justify-center size-10 rounded-full bg-sartorial-lightGreen text-white transition-colors hover:bg-sartorial-lightGreen/70 cursor-pointer z-10"
					>
						<ChevronLeft className="h-6 w-6" />
					</button>
				)}

				{canScrollNext && (
					<button
						type="button"
						onClick={() => scrollByPage(1)}
						aria-label="Next categories"
						className="hidden md:flex absolute right-0 lg:-right-10 top-[75px] -translate-y-1/2 items-center justify-center size-10 rounded-full bg-sartorial-lightGreen text-white transition-colors hover:bg-sartorial-lightGreen/70 cursor-pointer z-10"
					>
						<ChevronRight className="h-6 w-6" />
					</button>
				)}
			</div>
		</section>
	);
};

const CategoryCircle = ({ tile }: { tile: CategoryTile }) => {
	const content = (
		<>
			<div className="relative aspect-square w-full max-w-[150px] mx-auto overflow-hidden rounded-full bg-sartorial-lightGreen/30">
				{tile.imageUrl ? (
					<Image
						src={tile.imageUrl}
						alt={tile.alt}
						fill
						sizes="150px"
						className={cn(
							"object-cover transition-transform duration-300 ease-out",
							!tile.comingSoon && "group-hover:scale-110",
						)}
					/>
				) : tile.fallbackImage ? (
					<Image
						src={tile.fallbackImage}
						alt={tile.alt}
						fill
						sizes="150px"
						className={cn(
							"object-cover transition-transform duration-300 ease-out",
							!tile.comingSoon && "group-hover:scale-110",
						)}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/70">
						{tile.label.charAt(0)}
					</div>
				)}

				{tile.comingSoon && (
					<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
						<span className="text-center text-xs md:text-sm font-semibold text-white">
							Coming Soon
						</span>
					</div>
				)}
			</div>

			<p
				className={cn(
					"mt-5 text-center text-lg md:text-2xl text-white transition-colors duration-300",
					!tile.comingSoon && "group-hover:text-gray-200",
				)}
			>
				{tile.label}
			</p>
		</>
	);

	if (!tile.href) {
		return (
			<div className="block" aria-disabled="true">
				{content}
			</div>
		);
	}

	return (
		<Link
			href={tile.href}
			className="group block transition-transform duration-300 ease-out hover:-translate-y-2"
		>
			{content}
		</Link>
	);
};

export default ShopByCategory;
