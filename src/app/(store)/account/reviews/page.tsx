"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const MyReviews = () => {
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { user, isSignedIn, isLoaded } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.push("/");
		}
	}, [isLoaded, isSignedIn, router]);

	const handleSubmit = async () => {
		if (rating === 0) {
			toast.info("Please select a rating");
			return;
		}

		setIsSubmitting(true);

		try {
			const customerName =
				user?.fullName ||
				user?.firstName ||
				user?.username ||
				"Anonymous";

			const response = await fetch("/api/reviews", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customerName,
					rating,
					comment: comment.trim(),
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to submit review");
			}

			toast.success(
				"Review submitted successfully! Thank you for your feedback.",
			);

			setRating(0);
			setComment("");
		} catch (error) {
			console.error("Error submitting review:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to submit review. Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Loader2 className="w-10 h-10 animate-spin text-sartorial-green" />
			</div>
		);
	}

	if (!isSignedIn) return null;

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="grow w-full pt-32 md:pt-40 pb-20 px-6 md:px-20 lg:px-32">
				<div className="bg-white max-w-6xl mx-auto p-3 md:p-10 rounded-sm">
					<h1 className="text-2xl font-bold mb-8 text-gray-800">
						Drop a review
					</h1>

					<div className="border border-gray-200 rounded-lg p-8 md:p-12">
						<div className="text-center mb-8">
							<h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
								Share your experience with us
							</h2>
							<p className="text-sm text-gray-600">
								Your feedback helps us serve you better
							</p>
						</div>

						<div className="flex flex-col items-center mb-8">
							<p className="text-sm text-gray-600 mb-4">
								Click star to rate{" "}
								<span className="text-red-500">*</span>
							</p>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setRating(star)}
										onMouseEnter={() =>
											setHoveredRating(star)
										}
										onMouseLeave={() => setHoveredRating(0)}
										className="transition-transform hover:scale-110 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
										aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
										disabled={isSubmitting}
									>
										<Star
											className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
												star <=
												(hoveredRating || rating)
													? "fill-yellow-400 text-yellow-400"
													: "fill-none text-gray-300"
											}`}
										/>
									</button>
								))}
							</div>
						</div>

						<div className="mb-6">
							<label
								htmlFor="comment"
								className="block text-sm font-medium text-gray-700 mb-2"
							>
								Comment (Optional)
							</label>
							<Textarea
								id="comment"
								placeholder="Leave a Comment..."
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								className="min-h-37.5 resize-none text-gray-700 placeholder:text-gray-400 border-gray-300 focus:border-gray-400 focus:ring-gray-400"
								disabled={isSubmitting}
							/>
						</div>

						<div className="flex justify-center">
							<Button
								onClick={handleSubmit}
								disabled={isSubmitting}
								className="w-full md:w-auto md:min-w-100 bg-sartorial-green hover:bg-sartorial-green/90 text-white py-6 rounded-full text-base font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Submitting...
									</>
								) : (
									"Submit"
								)}
							</Button>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default MyReviews;
