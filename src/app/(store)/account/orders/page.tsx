"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Image from "next/image";
import { SartorialBag } from "@/assets";
import { urlFor } from "@/lib/imageUrl";
import { useUser } from "@clerk/nextjs";
import { getMyOrders } from "@/sanity/lib/product/getMyOrders";
import {
	getOrderLineName,
	getOrderLineTotal,
	isFreeGiftLine,
} from "@/lib/orderLine";
import { Loader2, CheckCircle2, Circle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
	_id: string;
	currency: "NGN" | string;
	orderDate: string;
	orderNumber: string;
	status: "paid" | "pending" | "shipped" | "failed" | "cancelled" | "delivered";
	totalPrice: number;
	products: OrderProduct[];
};

type OrderProduct = {
	product: Product;
	quantity: number;
	selectedColor: {
		colorId: string;
		colorTitle: string;
	};
};

type Product = {
	name: string;
	price: number;
	images: ProductImage[];
};

type ProductImage = {
	alt: string;
	asset: { url: string };
};

const STEPS = [
	{ key: "placed", label: "Order Placed" },
	{ key: "paid", label: "Payment Confirmed" },
	{ key: "shipped", label: "Shipped" },
	{ key: "delivered", label: "Delivered" },
];

const STEP_REACHED: Record<string, number> = {
	pending: 0,
	paid: 1,
	shipped: 2,
	delivered: 3,
};

const formatDate = (dateStr: string) =>
	new Date(dateStr).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

const formatCurrency = (amount: number, currency: string) => {
	const symbol = currency?.toUpperCase() === "USD" ? "$" : "₦";
	return `${symbol}${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const OrderTracker = ({ status }: { status: Order["status"] }) => {
	if (status === "cancelled") {
		return (
			<div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100">
				<XCircle className="w-4 h-4 text-red-500 shrink-0" />
				<span className="text-sm font-medium text-red-600">This order has been cancelled.</span>
			</div>
		);
	}

	const reached = STEP_REACHED[status] ?? 0;

	return (
		<div className="mt-5 pt-5 border-t border-gray-100">
			<p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">
				Order Progress
			</p>

			{/* Mobile: vertical timeline */}
			<div className="flex flex-col md:hidden">
				{STEPS.map((step, idx) => {
					const isCompleted = idx <= reached;
					const isCurrent = idx === reached;
					return (
						<div key={step.key} className="flex items-start gap-3">
							<div className="flex flex-col items-center shrink-0">
								<div
									className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
										isCompleted
											? "bg-[#2D5A43] border-[#2D5A43]"
											: "bg-white border-gray-200"
									}`}
								>
									{isCompleted ? (
										<CheckCircle2 className="w-3.5 h-3.5 text-white" />
									) : (
										<Circle className="w-3.5 h-3.5 text-gray-300" />
									)}
								</div>
								{idx < STEPS.length - 1 && (
									<div
										className={`w-0.5 h-5 my-1 transition-all duration-300 ${
											idx < reached ? "bg-[#2D5A43]" : "bg-gray-200"
										}`}
									/>
								)}
							</div>
							<span
								className={`text-sm pt-1 leading-tight ${
									isCurrent
										? "text-[#2D5A43] font-semibold"
										: isCompleted
											? "text-gray-600"
											: "text-gray-300"
								}`}
							>
								{step.label}
							</span>
						</div>
					);
				})}
			</div>

			{/* Desktop: horizontal stepper */}
			<div className="hidden md:flex items-center w-full">
				{STEPS.map((step, idx) => {
					const isCompleted = idx <= reached;
					const isCurrent = idx === reached;

					return (
						<div key={step.key} className="flex items-center flex-1 last:flex-none">
							<div className="flex flex-col items-center gap-1.5 shrink-0">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
										isCompleted
											? "bg-[#2D5A43] border-[#2D5A43]"
											: "bg-white border-gray-200"
									}`}
								>
									{isCompleted ? (
										<CheckCircle2 className="w-4 h-4 text-white" />
									) : (
										<Circle className="w-4 h-4 text-gray-300" />
									)}
								</div>
								<span
									className={`text-[10px] font-medium text-center leading-tight max-w-[60px] ${
										isCurrent
											? "text-[#2D5A43] font-semibold"
											: isCompleted
												? "text-gray-600"
												: "text-gray-300"
									}`}
								>
									{step.label}
								</span>
							</div>
							{idx < STEPS.length - 1 && (
								<div
									className={`flex-1 h-0.5 mx-1 mb-5 transition-all duration-300 ${
										idx < reached ? "bg-[#2D5A43]" : "bg-gray-200"
									}`}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

const OrderCard = ({ order }: { order: Order }) => (
	<motion.div
		initial={{ opacity: 0, y: 8 }}
		animate={{ opacity: 1, y: 0 }}
		className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6"
	>
		{/* Order meta header */}
		<div className="flex items-start justify-between gap-2 mb-5 pb-4 border-b border-gray-100">
			<div className="min-w-0">
				<p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
					Order
				</p>
				<p className="font-mono text-xs sm:text-sm text-gray-700 font-semibold mt-0.5 truncate max-w-[180px] sm:max-w-none">
					{order.orderNumber}
				</p>
			</div>
			<div className="text-xs sm:text-sm text-gray-500 shrink-0">
				{formatDate(order.orderDate)}
			</div>
		</div>

		{/* Products */}
		<div className="space-y-4">
			{order.products?.map((item, idx) => {
				const imgSrc = item.product?.images?.[0]
					? urlFor(item.product.images[0])
					: SartorialBag;

				return (
					<div
						key={idx}
						className="flex items-center gap-4"
					>
						<div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
							<Image
								src={imgSrc}
								alt={item.product?.name ?? "Product"}
								fill
								className="object-contain p-1.5"
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-medium text-sm text-gray-900 truncate">
								{getOrderLineName(item)}
							</p>
							{isFreeGiftLine(item) && (
								<p className="text-xs font-semibold text-sartorial-green mt-0.5">
									🎁 Free gift
								</p>
							)}
							{item.selectedColor?.colorTitle && (
								<p className="text-xs text-gray-500 mt-0.5">
									Colour: {item.selectedColor.colorTitle}
								</p>
							)}
							<p className="text-xs text-gray-500">
								Qty: {item.quantity}
							</p>
						</div>
						<p className="font-semibold text-sm text-gray-800 shrink-0">
							{isFreeGiftLine(item)
								? "FREE"
								: formatCurrency(
										getOrderLineTotal(item),
										order.currency,
									)}
						</p>
					</div>
				);
			})}
		</div>

		{/* Order total */}
		<div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
			<span className="text-sm font-bold text-[#2D5A43]">
				Total: {formatCurrency(order.totalPrice, order.currency)}
			</span>
		</div>

		{/* Tracking stepper */}
		<OrderTracker status={order.status} />
	</motion.div>
);

const MyOrders = () => {
	const { user, isLoaded, isSignedIn } = useUser();
	const router = useRouter();

	const [orders, setOrders] = useState<Order[]>([]);
	const [fetchingData, setFetchingData] = useState(true);
	const [activeTab, setActiveTab] = useState("ongoing");

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.push("/");
			return;
		}

		const fetchOrders = async () => {
			if (user?.id) {
				try {
					const data = await getMyOrders(user.id);
					setOrders(data);
				} catch (error) {
					console.error("Error fetching orders:", error);
				} finally {
					setFetchingData(false);
				}
			}
		};

		if (isSignedIn) {
			fetchOrders();
		}
	}, [isLoaded, isSignedIn, user?.id, router]);

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Loader2 className="w-10 h-10 animate-spin text-sartorial-green" />
			</div>
		);
	}

	if (!isSignedIn) return null;

	const tabs = [
		{ id: "ongoing", label: "Ongoing Orders" },
		{ id: "delivered", label: "Delivered Orders" },
	];

	const filteredOrders = orders.filter((order) =>
		activeTab === "delivered"
			? order.status === "delivered"
			: order.status !== "delivered",
	);

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="grow w-full pt-28 md:pt-40 pb-20 px-4 sm:px-6 md:px-20 lg:px-32">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-xl sm:text-2xl font-bold mb-6 md:mb-8 text-gray-800">
						My Orders
					</h1>

					{/* Tabs */}
					<div className="flex justify-center mb-6 md:mb-8">
						<div className="relative flex bg-[#E9F2EB] p-1.5 rounded-full w-full sm:w-auto">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`relative z-10 flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-medium transition-colors duration-300 ${
										activeTab === tab.id
											? "text-white"
											: "text-[#2D533E]"
									}`}
								>
									{tab.label}
									{activeTab === tab.id && (
										<motion.div
											layoutId="active-pill"
											className="absolute inset-0 bg-[#2D533E] rounded-full -z-10"
											transition={{
												type: "spring",
												bounce: 0.2,
												duration: 0.6,
											}}
										/>
									)}
								</button>
							))}
						</div>
					</div>

					{fetchingData ? (
						<div className="flex items-center justify-center py-20">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sartorial-green" />
						</div>
					) : (
						<AnimatePresence mode="wait">
							{filteredOrders.length > 0 ? (
								<motion.div
									key={activeTab}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="space-y-5"
								>
									{filteredOrders.map((order) => (
										<OrderCard key={order._id} order={order} />
									))}
								</motion.div>
							) : (
								<motion.div
									key={`${activeTab}-empty`}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="py-20 text-center text-gray-400"
								>
									No {activeTab === "delivered" ? "delivered" : "ongoing"} orders found.
								</motion.div>
							)}
						</AnimatePresence>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default MyOrders;
