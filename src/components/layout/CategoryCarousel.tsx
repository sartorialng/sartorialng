"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
	banner1,
	banner2,
	banner3,
	MobileBanner1,
	MobileBanner2,
	MobileBanner3,
} from "@/assets";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CategoryCarousel = () => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	const slides = [
		{ id: 1, image: banner1, mobileImage: MobileBanner1 },
		{ id: 2, image: banner2, mobileImage: MobileBanner2 },
		{ id: 3, image: banner3, mobileImage: MobileBanner3 },
	];

	const nextSlide = useCallback(() => {
		setCurrentSlide((prev) => (prev + 1) % slides.length);
	}, [slides.length]);

	const prevSlide = () => {
		setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
	};

	const goToSlide = (index: number) => {
		setCurrentSlide(index);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 5000);
	};

	useEffect(() => {
		if (!isAutoPlaying) return;
		const interval = setInterval(() => {
			nextSlide();
		}, 5000);
		return () => clearInterval(interval);
	}, [isAutoPlaying, nextSlide]);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<>
			<div className="pt-15 md:pt-15 flex flex-col items-center w-full overflow-hidden gap-4 bg-gray-50">
				<div className="relative w-full h-30 md:h-96">
					{slides.map((slide, index) => (
						<Link
							href="/all-products"
							key={slide.id}
							className={`absolute inset-0 transition-opacity duration-700 ${
								index === currentSlide
									? "opacity-100 z-10"
									: "opacity-0 z-0"
							}`}
						>
							<Image
								// src={slide.image}
								src={isMobile ? slide.mobileImage : slide.image}
								alt={`Slide ${index + 1}`}
								fill
								priority={index === 0}
								className="object-cover sm:object-cover object-top"
								// className="object-cover"
							/>
						</Link>
					))}
				</div>

				<button
					onClick={prevSlide}
					className="hidden md:block absolute left-4 top-1/3 md:top-1/2 -translate-y-1/2 hover:bg-[#8EC09E45] bg-sartorial-lightGreen text-white p-2 rounded-full transition-all duration-300 z-20 cursor-pointer"
					aria-label="Previous slide"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>
				<button
					onClick={nextSlide}
					className="hidden md:block absolute right-4 top-1/3 md:top-1/2 -translate-y-1/2 hover:bg-[#8EC09E45] bg-sartorial-lightGreen text-white p-2 rounded-full transition-all duration-300 z-20 cursor-pointer"
					aria-label="Next slide"
				>
					<ChevronRight className="w-6 h-6" />
				</button>

				<div className="flex gap-3 py-2">
					{slides.map((_, index) => (
						<button
							key={index}
							onClick={() => goToSlide(index)}
							className={`transition-all duration-300 rounded-full w-3 h-3 ${
								index === currentSlide
									? "bg-sartorial-green scale-110"
									: "bg-sartorial-lightGreen opacity-70"
							}`}
							aria-label={`Go to slide ${index + 1}`}
						/>
					))}
				</div>
			</div>
		</>
	);
};

export default CategoryCarousel;
