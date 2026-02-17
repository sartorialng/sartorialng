"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function OrderPendingPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const reference = searchParams.get("reference");

	const hasProcessed = useRef(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const maxChecks = 20;

	const [displayCount, setDisplayCount] = useState(0);

	useEffect(() => {
		if (!reference) {
			router.push("/");
			return;
		}

		let attempts = 0;

		const checkOrder = async () => {
			// Guard at the very top — bail immediately if already handled
			if (hasProcessed.current) return;

			attempts++;
			setDisplayCount(attempts);

			try {
				console.log(
					`Checking order... Attempt ${attempts}/${maxChecks}`,
				);

				const res = await fetch(
					`/api/orders/check-order?reference=${reference}`,
				);
				const data = await res.json();

				console.log("Check order response:", data);

				if (data.status === "success") {
					if (hasProcessed.current) return; // Double-check after async wait
					hasProcessed.current = true;

					if (intervalRef.current) clearInterval(intervalRef.current);

					toast.success("Order placed successfully!");
					router.push(
						`/success?orderNumber=${data.order.orderNumber}&reference=${reference}`,
					);
					return;
				}

				if (attempts >= maxChecks) {
					if (hasProcessed.current) return;
					hasProcessed.current = true;

					if (intervalRef.current) clearInterval(intervalRef.current);

					toast.info(
						"Your order is being processed. You'll receive an email confirmation shortly.",
					);
					router.push("/");
				}
			} catch (error) {
				console.error("Error checking order:", error);

				if (attempts >= maxChecks) {
					if (hasProcessed.current) return;
					hasProcessed.current = true;

					if (intervalRef.current) clearInterval(intervalRef.current);

					toast.error(
						"Error verifying order. Please check your email.",
					);
					router.push("/");
				}
			}
		};

		intervalRef.current = setInterval(checkOrder, 2000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [reference, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sartorial-green mx-auto mb-4"></div>

				<h2 className="text-2xl font-semibold text-gray-800 mb-2">
					Processing Your Order
				</h2>

				<p className="text-gray-600">
					Please wait while we confirm your payment...
				</p>

				<p className="text-sm text-gray-500 mt-2">
					This usually takes just a few seconds
				</p>

				{displayCount > 5 && (
					<p className="text-xs text-gray-400 mt-4">
						Still processing... ({displayCount}/{maxChecks})
					</p>
				)}
			</div>
		</div>
	);
}
