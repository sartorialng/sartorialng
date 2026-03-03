"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useBasketStore } from "@/store/store";
import { useSyncExternalStore } from "react";
import { SartorialBag } from "@/assets";
import { urlFor } from "@/lib/imageUrl";
import { convertNGNtoUSD } from "@/lib/currency";

interface OrderSummaryProps {
	shipping: number;
	total: number;
	couponCode: string;
	setCouponCode: (val: string) => void;
	discount: number;
	couponStatus: "idle" | "loading" | "success" | "error";
	couponMessage: string;
	onApplyCoupon: () => void;
	vat: number;
}

const OrderSummary = ({
	shipping,
	total,
	couponCode,
	setCouponCode,
	discount,
	couponStatus,
	couponMessage,
	onApplyCoupon,
	vat,
}: OrderSummaryProps) => {
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	const groupedItems = useBasketStore((s) => s.getGroupedItems());
	const subtotal = useBasketStore((s) => s.getTotalPrice());

	if (!mounted)
		return (
			<div className="w-full md:w-[40%] h-64 bg-gray-100 animate-pulse rounded-sm" />
		);

	return (
		<div className="w-full md:w-[40%] bg-white p-5 md:p-8 rounded-sm shadow-sm">
			<h2 className="text-xl font-bold mb-6">Order Summary</h2>

			<div className="space-y-6">
				{groupedItems.map((item) => {
					const unitPrice = item.product.onSale
						? (item.product.salePrice ?? 0)
						: (item.product.price ?? 0);

					const nairaTotal = unitPrice * item.quantity;
					const dollarTotal = convertNGNtoUSD(nairaTotal);

					const imageUrl = item.product?.images?.[0]?.asset
						? urlFor(item.product.images[0])
						: SartorialBag;

					const imageAlt = item?.product?.name ?? "product-name";

					return (
						<div
							key={`${item.product._id}-${item.selectedColor?.title ?? "default"}`}
							className="flex items-center justify-between"
						>
							<div className="flex items-center gap-3">
								<Image
									src={imageUrl}
									alt={imageAlt}
									width={40}
									height={40}
									className="rounded-md object-cover"
								/>
								<div className="flex flex-col">
									<p className="text-sm md:text-base font-medium">
										{item.product.name}
									</p>
									{item.selectedColor && (
										<p className="text-xs">
											Color: {item.selectedColor.title}
										</p>
									)}
								</div>
							</div>

							<div className="text-right text-sm">
								<p>{`₦${nairaTotal.toLocaleString()}`}</p>
								<p className="text-gray-500">
									{`$${dollarTotal.toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}`}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			<div className="my-4 border-t" />

			<div className="flex justify-between mb-4">
				<span className="font-medium">Subtotal:</span>
				<div className="text-right">
					<p>₦{subtotal.toLocaleString()}</p>
					<p className="text-gray-500 text-sm">
						$
						{convertNGNtoUSD(subtotal).toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>
			<div className="my-4 border-t" />

			<div className="flex justify-between mb-4">
				<p className="flex items-baseline gap-1 font-medium text-gray-900">
					<span>VAT</span>
					<span className="text-sm font-normal text-gray-500">
						(7.5% on items only)
					</span>
					<span>:</span>
				</p>
				<div className="text-right">
					<p>₦{vat.toLocaleString()}</p>
					<p className="text-gray-500 text-sm">
						$
						{convertNGNtoUSD(vat).toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>
			<div className="my-4 border-t" />

			<div className="flex justify-between mb-4">
				<span className="font-medium">Shipping:</span>
				<div className="text-right">
					<p>₦{shipping.toLocaleString()}</p>
					<p className="text-gray-500 text-sm">
						$
						{convertNGNtoUSD(shipping).toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>
			<div className="my-4 border-t" />

			{discount > 0 && (
				<div>
					<div className="flex justify-between text-green-600 font-medium">
						<span>Discount:</span>
						<span>- ₦{discount.toLocaleString()}</span>
					</div>
					<div className="my-4 border-t" />
				</div>
			)}

			<div className="flex justify-between mb-6 font-bold">
				<span>Total:</span>
				<div className="text-right">
					<p>₦{total.toLocaleString()}</p>
					<p className="text-sm text-gray-600">
						$
						{convertNGNtoUSD(total).toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<div className="flex gap-3">
					<input
						type="text"
						placeholder="Coupon Code"
						value={couponCode}
						onChange={(e) => setCouponCode(e.target.value)}
						className="w-full border rounded-full px-4 h-11 outline-none focus:ring-2 focus:ring-green-700 text-xs md:text-base"
					/>
					<Button
						onClick={onApplyCoupon}
						disabled={couponStatus === "loading" || !couponCode}
						className="text-xs md:text-base rounded-full bg-sartorial-green text-white hover:bg-green-800 h-11 cursor-pointer"
					>
						{couponStatus === "loading"
							? "Applying..."
							: "Apply Coupon"}
					</Button>
				</div>

				{/* Feedback message */}
				{couponMessage && (
					<p
						className={`text-sm px-1 ${couponStatus === "success" ? "text-green-600" : "text-red-500"}`}
					>
						{couponMessage}
					</p>
				)}
			</div>
		</div>
	);
};

export default OrderSummary;
