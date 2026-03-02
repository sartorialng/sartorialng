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
import { SartorialBabe } from "@/assets";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { getAllReviews } from "@/sanity/lib/product/getReviews";
import { Review } from "../../../sanity.types";
import { formatDate } from "@/lib/helper";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const imageVariants: Variants = {
	hidden: { opacity: 0, y: 30, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.6, ease: "easeOut" },
	},
};

const ReviewSlide = () => {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [isReviewsLoading, setIsReviewsLoading] = useState(true);

	useEffect(() => {
		getAllReviews()
			.then((data) => setReviews(data))
			.finally(() => setIsReviewsLoading(false));
	}, []);

	return (
		<div className="w-full mt-10 px-4 md:px-20 py-10 bg-white">
			<div className="flex flex-col items-center mb-10">
				<h2 className="text-center text-3xl md:text-4xl font-semibold md:font-bold text-sartorial-green mb-8">
					Happy Sartorial Babes
				</h2>
			</div>

			<Carousel
				opts={{
					align: "start",
					loop: true,
				}}
				className="w-full mt-20"
			>
				<CarouselContent className="-ml-4 mt-2 md:mt-0">
					<CarouselItem className="pl-4 basis-full sm:basis-1/2 md:basis-1/4">
						<div className="bg-sartorial-green text-white p-8 rounded-sm h-80 flex flex-col justify-center items-start">
							<div className="text-6xl font-bold flex items-baseline">
								4,8
								<span className="text-2xl font-normal ml-1">
									/5
								</span>
							</div>
							<div className="flex my-4">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className="w-5 h-5 fill-white text-white"
									/>
								))}
							</div>
							<p className="text-sm opacity-90">2000 reviews</p>
						</div>
					</CarouselItem>

					{reviews.map((review) => (
						<CarouselItem
							key={review._id}
							className="pl-4 basis-full sm:basis-1/2 md:basis-1/4"
						>
							<div className="bg-sartorial-lightGreen p-6 rounded-sm h-80 flex flex-col justify-between text-[#1A3326]">
								<div>
									<div className="flex mb-4">
										{[...Array(review.rating)].map(
											(_, i) => (
												<Star
													key={i}
													className="w-4 h-4 fill-[#1A3326] text-[#1A3326]"
												/>
											),
										)}
									</div>
									<p className="text-sm leading-relaxed font-medium">
										{review.comment}
									</p>
								</div>

								<div className="flex items-center gap-3 mt-4">
									<UserCircle2 className="w-6 h-6 text-sartorial-green" />
									<div>
										<p className="text-xs font-bold">
											{review.customerName}
										</p>
										<p className="text-[12px]">
											{formatDate(
												review?.date ? review.date : "",
											)}
										</p>
									</div>
								</div>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>

				<div className="absolute -top-16 left-0 right-0 flex justify-between items-end  gap-2">
					<div className="bg-sartorial-green text-white px-4 py-3 rounded-md text-sm font-medium">
						All from verified purchases
					</div>
					<div className="flex gap-2">
						<CarouselPrevious className="static translate-y-0 h-10 w-10 md:w-20 rounded-md border-2 border-sartorial-green text-sartorial-green hover:bg-sartorial-green hover:text-white cursor-pointer" />
						<CarouselNext className="static translate-y-0 h-10 w-10 md:w-20 rounded-md bg-sartorial-green text-white hover:bg-sartorial-green cursor-pointer" />
					</div>
				</div>
			</Carousel>

			<div className="flex flex-col items-center mt-30">
				<h2 className="text-center text-2xl md:text-4xl font-bold text-sartorial-green mb-8">
					Thank You! Sartorial Babes
				</h2>
			</div>

			{/* Happy Sartorial Babes */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				className="grid grid-cols-1 md:grid-cols-4 gap-3 col-span-full"
			>
				{Array.from({ length: 4 }).map((_, i) => (
					<motion.div
						key={i}
						variants={imageVariants}
						whileHover={{ y: -6, scale: 1.03 }}
						transition={{
							type: "spring",
							stiffness: 200,
							damping: 15,
						}}
						className="overflow-hidden rounded-lg w-full"
					>
						<Image
							src={SartorialBabe}
							alt="Sartorial Babe"
							className="w-full h-64 object-cover transition-transform duration-300"
						/>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
};

export default ReviewSlide;
