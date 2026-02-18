"use client";
import { Star, UserCircle2 } from "lucide-react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getAllReviews } from "@/sanity/lib/product/getReviews";
import { Review } from "../../../sanity.types";
import { formatDate } from "@/lib/helper";
import { getSartorialBabes } from "@/sanity/lib/product/getSartorialBabes";
import { urlFor } from "@/sanity/lib/image";
import { Instagram } from "@/assets";
import { SartorialBabe } from "@/lib/types/types";

const ReviewSkeleton = () => (
	<div className="bg-gray-100 p-8 rounded-2xl h-70 flex flex-col justify-between animate-pulse">
		<div>
			<div className="flex mb-4 gap-1">
				{[...Array(5)].map((_, i) => (
					<div
						key={i}
						className="w-3.5 h-3.5 bg-gray-200 rounded-full"
					/>
				))}
			</div>
			<div className="h-4 bg-gray-200 rounded w-full mb-2" />
			<div className="h-4 bg-gray-200 rounded w-2/3" />
		</div>
		<div className="flex items-center gap-3">
			<div className="w-6 h-6 bg-gray-200 rounded-full" />
			<div className="space-y-2">
				<div className="h-3 bg-gray-200 rounded w-16" />
				<div className="h-2 bg-gray-200 rounded w-10" />
			</div>
		</div>
	</div>
);

const BabeSkeleton = () => (
	<div className="aspect-3/4 rounded-[2rem] bg-gray-100 animate-pulse w-full" />
);

const ReviewSlide = () => {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [babes, setBabes] = useState<SartorialBabe[]>([]);
	const [isReviewsLoading, setIsReviewsLoading] = useState(true);
	const [isBabesLoading, setIsBabesLoading] = useState(true);

	useEffect(() => {
		getAllReviews()
			.then((data) => setReviews(data))
			.finally(() => setIsReviewsLoading(false));

		getSartorialBabes()
			.then((data) => setBabes(data))
			.finally(() => setIsBabesLoading(false));
	}, []);

	return (
		<div className="w-full px-4 md:px-20 py-16 bg-white overflow-hidden">
			{/* --- SECTION 1: REVIEWS CAROUSEL --- */}
			<div className="relative mb-20 md:mb-32">
				<div className="flex flex-col items-center mb-20">
					<h2 className="text-center text-4xl md:text-5xl font-bold text-sartorial-green mb-8">
						REAL REVIEWS
					</h2>
				</div>

				<Carousel
					opts={{ align: "start", loop: true }}
					className="w-full"
				>
					<div className="absolute -top-16 left-0 right-0 flex justify-between items-end gap-2">
						<div className="bg-sartorial-green text-white px-4 py-3 rounded-md text-sm font-medium">
							All from verified purchases
						</div>
						<div className="flex gap-2">
							<CarouselPrevious className="static translate-y-0 h-10 w-10 md:w-20 rounded-md border-2 border-sartorial-green text-sartorial-green hover:bg-sartorial-green hover:text-white cursor-pointer" />
							<CarouselNext className="static translate-y-0 h-10 w-10 md:w-20 rounded-md bg-sartorial-green text-white hover:bg-sartorial-green cursor-pointer" />
						</div>
					</div>

					<CarouselContent className="-ml-4">
						<CarouselItem className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/4">
							<div className="bg-sartorial-green text-white p-8 rounded-2xl h-70 flex flex-col justify-center items-center text-center">
								<div className="text-6xl font-black mb-2">
									4.8
								</div>
								<div className="flex mb-4">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className="w-5 h-5 fill-white text-white"
										/>
									))}
								</div>
								<p className="text-sm font-light uppercase tracking-widest">
									2,000+ Reviews
								</p>
							</div>
						</CarouselItem>

						{isReviewsLoading
							? [...Array(3)].map((_, i) => (
									<CarouselItem
										key={i}
										className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/4"
									>
										<ReviewSkeleton />
									</CarouselItem>
								))
							: reviews.map((review) => (
									<CarouselItem
										key={review._id}
										className="pl-4 basis-[85%] sm:basis-1/2 md:basis-1/4"
									>
										<div className="bg-sartorial-lightGreen p-8 rounded-2xl h-70 flex flex-col justify-between border border-transparent hover:border-sartorial-green transition-colors">
											<div>
												<div className="flex mb-4 gap-0.5">
													{[
														...Array(review.rating),
													].map((_, i) => (
														<Star
															key={i}
															className="w-3.5 h-3.5 fill-sartorial-green text-sartorial-green"
														/>
													))}
												</div>
												<p className="text-sm italic leading-relaxed text-sartorial-green line-clamp-4">
													&quot;{review.comment}&quot;
												</p>
											</div>
											<div className="flex items-center gap-3">
												<UserCircle2 className="w-6 h-6 text-sartorial-green" />
												<div>
													<p className="text-xs font-bold uppercase">
														{review.customerName}
													</p>
													<p className="text-[10px] opacity-60">
														{formatDate(
															review?.date || "",
														)}
													</p>
												</div>
											</div>
										</div>
									</CarouselItem>
								))}
					</CarouselContent>
				</Carousel>
			</div>

			{/* --- SECTION 2: THE "BABES" VISUAL CAROUSEL --- */}
			<div className="relative">
				<div className="flex flex-col mb-12">
					<h2 className="text-4xl md:text-6xl font-black text-sartorial-green uppercase tracking-tighter">
						Happy Sartorial <br />
						<span
							className="text-outline-green text-transparent"
							style={{ WebkitTextStroke: "1px #1A3326" }}
						>
							Babes
						</span>
					</h2>
					<div className="flex items-center gap-1 mt-2">
						<Instagram />
						<p className="text-sartorial-green font-medium mb-0.5">
							Tag us @sartorialstore to be featured
						</p>
					</div>
				</div>

				<Carousel
					opts={{ align: "start", loop: babes.length > 4 }}
					className="w-full overflow-visible"
				>
					<CarouselContent className="-ml-2 md:-ml-4">
						{isBabesLoading
							? [...Array(5)].map((_, i) => (
									<CarouselItem
										key={i}
										className="pl-2 md:pl-4 basis-[70%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
									>
										<BabeSkeleton />
									</CarouselItem>
								))
							: babes.map((babe) => (
									<CarouselItem
										key={babe._id}
										className="pl-2 md:pl-4 basis-[70%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
									>
										<motion.div
											whileHover={{ y: -10 }}
											className="group relative aspect-3/4 overflow-hidden rounded-[2rem] bg-gray-100"
										>
											{babe.image && (
												<Image
													src={urlFor(
														babe.image,
													).url()}
													alt={
														babe.name ||
														"Sartorial Babe"
													}
													fill
													sizes="(max-width: 768px) 70vw, (max-width: 1024px) 25vw, 20vw"
													className="object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
												/>
											)}
											{/* <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
												<span className="text-white text-xs font-bold tracking-widest uppercase">
													View Style →
												</span>
											</div> */}
										</motion.div>
									</CarouselItem>
								))}
					</CarouselContent>

					{!isBabesLoading && babes.length > 0 && (
						<div className="flex justify-start gap-4 mt-8">
							<CarouselPrevious className="static translate-y-0 bg-transparent border-none text-sartorial-green hover:bg-transparent p-0 w-auto text-lg font-bold disabled:opacity-30">
								PREV
							</CarouselPrevious>
							<span className="text-sartorial-green/30">/</span>
							<CarouselNext className="static translate-y-0 bg-transparent border-none text-sartorial-green hover:bg-transparent p-0 w-auto text-lg font-bold disabled:opacity-30">
								NEXT
							</CarouselNext>
						</div>
					)}
				</Carousel>
			</div>
		</div>
	);
};

export default ReviewSlide;
