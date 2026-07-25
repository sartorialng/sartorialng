"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBasketStore } from "@/store/store";
import Image from "next/image";
import { PaymentSuccess } from "@/assets";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";

const Confetti = dynamic(() => import("react-confetti"), {
	ssr: false,
});

const SuccessContent = () => {
	const { isSignedIn } = useUser();
	const searchParams = useSearchParams();
	const initialOrderNumber = searchParams.get("orderNumber");
	const reference = searchParams.get("reference");
	const clearBasket = useBasketStore((state) => state.clearBasket);

	const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
	const [isConfirming, setIsConfirming] = useState(
		Boolean(reference) && !initialOrderNumber,
	);
	const [showConfetti, setShowConfetti] = useState(true);
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		const updateDimensions = () => {
			setWindowDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		updateDimensions();

		window.addEventListener("resize", updateDimensions);
		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

	useEffect(() => {
		if (orderNumber) {
			clearBasket();
		}
	}, [orderNumber, clearBasket]);

	// Last line of defence: the customer paid but arrived without an order
	// number, so ask the server to confirm the reference with Paystack and
	// fulfil it. Idempotent, so it's harmless if the webhook already did.
	useEffect(() => {
		if (!reference || initialOrderNumber) return;

		let cancelled = false;

		const confirm = async () => {
			for (let attempt = 0; attempt < 6 && !cancelled; attempt++) {
				try {
					const res = await fetch("/api/paystack/verify", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ reference }),
					});
					const data = await res.json();

					if (!cancelled && data?.order?.orderNumber) {
						setOrderNumber(data.order.orderNumber);
						setIsConfirming(false);
						return;
					}
				} catch {
					// Retry below.
				}
				await new Promise((resolve) => setTimeout(resolve, 4000));
			}

			if (!cancelled) setIsConfirming(false);
		};

		confirm();

		return () => {
			cancelled = true;
		};
	}, [reference, initialOrderNumber]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowConfetti(false);
		}, 10000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<>
			{showConfetti && windowDimensions.width > 0 && (
				<Confetti
					width={windowDimensions.width}
					height={windowDimensions.height}
					recycle={false}
					numberOfPieces={250}
				/>
			)}

			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
				<div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg max-w-md sm:max-w-2xl w-full">
					<div className="flex justify-center mb-6">
						<div className="h-14 w-14 sm:h-16 sm:w-16 bg-green-100 rounded-full flex items-center justify-center">
							<Image
								src={PaymentSuccess}
								alt="payment-success"
								className="h-8 w-8 sm:h-10 sm:w-10"
							/>
						</div>
					</div>

					<h1 className="text-2xl sm:text-4xl font-bold mb-4 text-center text-sartorial-green">
						Thank You!
					</h1>

					<div className="border-t border-b border-gray-200 py-4 sm:py-6 mb-4 sm:mb-6">
						<p className="text-sm sm:text-lg text-gray-700 mb-4 text-center">
							Your order has been placed successfully. Check your
							email for more details.
						</p>

						<div className="space-y-2 text-sm sm:text-base">
							{!orderNumber && isConfirming && (
								<p className="text-gray-600 text-center">
									Confirming your order…
								</p>
							)}
							{!orderNumber && !isConfirming && (
								<p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 text-center">
									Your payment went through. We&apos;re still
									finalising your order — you&apos;ll get a
									confirmation email shortly. Keep the payment
									reference below in case you need to contact us.
								</p>
							)}
							{orderNumber && (
								<p className="text-gray-600 flex justify-between">
									<span>Order Number:</span>
									<span className="font-mono font-bold text-green-700">
										{orderNumber}
									</span>
								</p>
							)}
							{reference && (
								<p className="text-gray-600 flex justify-between">
									<span>Payment Ref:</span>
									<span className="font-mono text-xs sm:text-sm text-gray-500">
										{reference}
									</span>
								</p>
							)}
						</div>
					</div>

					{isSignedIn ? (
						<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-4">
							<Button className="px-8 h-11 bg-sartorial-green hover:bg-sartorial-green/90 rounded-full">
								<Link href="/account/orders">View Order</Link>
							</Button>

							<Button
								variant="outline"
								className="px-8 h-11 rounded-full"
							>
								<Link href="/">Continue Shopping</Link>
							</Button>
						</div>
					) : (
						<div className="flex justify-center mt-4">
							<Button className="px-8 h-11 bg-sartorial-green hover:bg-sartorial-green/90 rounded-full">
								<Link href="/">Continue Shopping</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default function SuccessPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					Loading...
				</div>
			}
		>
			<SuccessContent />
		</Suspense>
	);
}
