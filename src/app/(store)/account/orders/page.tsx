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
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
	_id: string;
	currency: "NGN" | string;
	orderDate: string;
	orderNumber: string;
	status: "paid" | "pending" | "failed" | "cancelled" | "delivered";
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
	asset: {
		url: string;
	};
};

const MyOrders = () => {
	const { user, isLoaded, isSignedIn } = useUser();
	const router = useRouter();

	const [orders, setOrders] = useState([]);
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

	const tabs = [
		{ id: "ongoing", label: "Ongoing Order" },
		{ id: "delivered", label: "Delivered Order" },
	];

	const filteredOrders = orders.filter((order: Order) =>
		activeTab === "delivered"
			? order.status === "delivered"
			: order.status !== "delivered",
	);

	if (!isSignedIn) return null;

	return (
		<div className="min-h-screen flex flex-col bg-gray-50">
			<Header />
			<main className="grow w-full pt-32 md:pt-40 pb-20 px-6 md:px-20 lg:px-32">
				<div className="bg-white max-w-6xl mx-auto p-3 md:p-10 rounded-sm">
					<h1 className="text-2xl font-bold mb-8 text-gray-800">
						My Orders
					</h1>

					<div className="flex justify-center mb-8">
						<div className="relative flex bg-[#E9F2EB] p-1.5 rounded-full">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`relative z-10 px-6 py-2.5 text-sm md:text-base font-medium transition-colors duration-300 ${
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
						<div className="flex items-center justify-center">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sartorial-green mx-auto mb-4"></div>
						</div>
					) : (
						<div className="border border-gray-200 rounded-lg overflow-hidden">
							<AnimatePresence mode="wait">
								{filteredOrders.length > 0 ? (
									<motion.div
										key={activeTab}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									>
										{filteredOrders.map((order: Order) =>
											order.products?.map(
												(item, pIndex) => (
													<div
														key={`${order._id}-${pIndex}`}
														className="flex flex-col md:flex-row items-center justify-between p-3 md:p-8 gap-6 border-b border-gray-100 last:border-0"
													>
														<div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full">
															<div className="relative w-24 h-24 bg-gray-50 rounded-md overflow-hidden shrink-0">
																<Image
																	src={
																		item
																			.product
																			?.images?.[
																			pIndex
																		]
																			? urlFor(
																					item
																						.product
																						.images[
																						pIndex
																					],
																				)
																			: SartorialBag
																	}
																	alt={
																		item
																			.product
																			?.name ??
																		"Product"
																	}
																	fill
																	className="object-contain p-2"
																/>
															</div>
															<div className="text-[#2D533E]">
																<h3 className="text-xl font-medium">
																	{
																		item
																			.product
																			.name
																	}
																</h3>
																<p className="text-sm opacity-80">
																	Color -{" "}
																	{item
																		.selectedColor
																		?.colorTitle ||
																		"N/A"}
																</p>
																<p className="text-sm opacity-80">
																	Qty -{" "}
																	{
																		item.quantity
																	}
																	pcs
																</p>
																<span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">
																	ID:{" "}
																	{
																		order.orderNumber
																	}
																</span>
															</div>
														</div>

														<div className="flex flex-col items-center md:items-end flex-1 w-full">
															<p className="text-lg font-bold text-gray-800">
																₦
																{(
																	item.product
																		?.price ||
																	0
																).toLocaleString()}
															</p>
															<p className="text-gray-500 text-sm">
																Status:{" "}
																<span className="capitalize font-semibold">
																	{
																		order.status
																	}
																</span>
															</p>
														</div>
													</div>
												),
											),
										)}
									</motion.div>
								) : (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="p-20 text-center text-gray-400"
									>
										No {activeTab} orders found.
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default MyOrders;
