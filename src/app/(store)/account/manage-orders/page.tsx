"use client";
import { useEffect, useState, useMemo } from "react";
import { Package, TrendingUp, ShoppingCart, Clock } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import { columns } from "./columns";
import { getAllOrders } from "@/sanity/lib/product/getAllOrders";
import { formatCurrency, Order } from "./types";
import { DataTable } from "./data-table";

const StatCard = ({
	icon: Icon,
	label,
	value,
	sub,
	color,
}: {
	icon: React.ElementType;
	label: string;
	value: string;
	sub?: string;
	color: string;
}) => (
	<div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
		<div
			className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}
		>
			<Icon className="w-5 h-5 text-white" />
		</div>
		<div>
			<p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
				{label}
			</p>
			<p className="text-xl font-bold text-gray-900 leading-tight">
				{value}
			</p>
			{sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
		</div>
	</div>
);

const SkeletonRows = () => (
	<>
		{Array.from({ length: 7 }).map((_, i) => (
			<div
				key={i}
				className="h-15 bg-gray-100 rounded-lg animate-pulse mb-2"
			/>
		))}
	</>
);

const ManageOrders = () => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getAllOrders()
			.then(setOrders)
			.finally(() => setLoading(false));
	}, []);

	const stats = useMemo(() => {
		const total = orders.length;
		const currency = orders[0]?.currency ?? "NGN";
		const revenue = orders
			.filter((o) => o.status !== "cancelled")
			.reduce((acc, o) => acc + (o.totalPrice ?? 0), 0);
		const pending = orders.filter((o) => o.status === "pending").length;
		const delivered = orders.filter((o) => o.status === "delivered").length;
		return { total, revenue, pending, delivered, currency };
	}, [orders]);

	return (
		<div className="min-h-screen flex flex-col bg-[#f7f8f6]">
			<Header />

			<main className="grow w-full pt-20 md:pt-30 pb-20 px-4 md:px-10 lg:px-20">
				<div className="max-w-350 mx-auto space-y-6">
					{/* Page heading */}
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
							Orders
						</h1>
						<p className="text-sm text-gray-500 mt-1">
							Monitor and manage all customer orders
						</p>
					</div>

					{/* Stats */}
					{!loading && (
						<div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
							<StatCard
								icon={ShoppingCart}
								label="Total Orders"
								value={String(stats.total)}
								color="bg-[#2c5b42]"
							/>
							<StatCard
								icon={TrendingUp}
								label="Revenue"
								value={formatCurrency(
									stats.revenue,
									stats.currency,
								)}
								sub="Excluding cancelled"
								color="bg-emerald-500"
							/>
							<StatCard
								icon={Clock}
								label="Pending"
								value={String(stats.pending)}
								color="bg-amber-500"
							/>
							<StatCard
								icon={Package}
								label="Delivered"
								value={String(stats.delivered)}
								color="bg-blue-500"
							/>
						</div>
					)}

					{/* Data table */}
					{loading ? (
						<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
							<SkeletonRows />
						</div>
					) : (
						<DataTable columns={columns} data={orders} />
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
};

export default ManageOrders;
