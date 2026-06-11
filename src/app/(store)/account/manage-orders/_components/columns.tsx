"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

import { Order, STATUS_STYLES, formatDate, formatCurrency } from "./types";
import Link from "next/link";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
	pending: ["paid", "cancelled"],
	paid: ["shipped", "cancelled"],
	shipped: ["delivered", "cancelled"],
	delivered: [],
	cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
	pending: "Pending",
	paid: "Paid",
	shipped: "Shipped",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

const StatusCell = ({ order }: { order: Order }) => {
	const [currentStatus, setCurrentStatus] = useState(order.status);
	const [loading, setLoading] = useState(false);
	const [showGigModal, setShowGigModal] = useState(false);
	const [gigTrackingId, setGigTrackingId] = useState("");
	const [gigPin, setGigPin] = useState("");

	const nextStatuses = ALLOWED_TRANSITIONS[currentStatus] ?? [];
	const isInterstate = !!order.deliveryType;

	const submitUpdate = async (newStatus: string, trackingId?: string, pin?: string) => {
		setLoading(true);
		try {
			const res = await fetch("/api/orders/update-status", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					orderId: order._id,
					status: newStatus,
					...(trackingId && { gigTrackingId: trackingId }),
					...(pin && { gigPin: pin }),
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to update");
			setCurrentStatus(newStatus);
			toast.success(`Order marked as ${STATUS_LABELS[newStatus]}`);
		} catch (err: any) {
			toast.error(err.message || "Could not update status");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (newStatus: string) => {
		if (newStatus === "shipped" && isInterstate) {
			setShowGigModal(true);
		} else {
			submitUpdate(newStatus);
		}
	};

	const handleGigConfirm = () => {
		setShowGigModal(false);
		submitUpdate("shipped", gigTrackingId.trim() || undefined, gigPin.trim() || undefined);
		setGigTrackingId("");
		setGigPin("");
	};

	return (
		<>
			<div className="flex items-center gap-2">
				<Badge
					variant="outline"
					className={`text-xs font-medium capitalize shrink-0 ${STATUS_STYLES[currentStatus] ?? "bg-gray-100 text-gray-700"}`}
				>
					{currentStatus}
				</Badge>
				{nextStatuses.length > 0 && (
					<div className="relative">
						{loading ? (
							<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
						) : (
							<Select onValueChange={handleChange}>
								<SelectTrigger className="h-7 text-xs px-2 w-28 border-dashed">
									<SelectValue placeholder="Update" />
								</SelectTrigger>
								<SelectContent>
									{nextStatuses.map((s) => (
										<SelectItem key={s} value={s} className="text-xs">
											{STATUS_LABELS[s]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</div>
				)}
			</div>

			<Dialog open={showGigModal} onOpenChange={setShowGigModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>GIG Logistics Tracking Details</DialogTitle>
						<p className="text-sm text-gray-500 mt-1">
							Enter the tracking information from GIG Logistics for{" "}
							<span className="font-semibold text-gray-700">{order.orderNumber}</span>.
							This will be included in the shipping email to the customer.
						</p>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<Label htmlFor="gig-tracking-id">Tracking ID</Label>
							<Input
								id="gig-tracking-id"
								placeholder="e.g. 1346109645"
								value={gigTrackingId}
								onChange={(e) => setGigTrackingId(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="gig-pin">Tracking PIN</Label>
							<Input
								id="gig-pin"
								placeholder="e.g. DNCTPGCP"
								value={gigPin}
								onChange={(e) => setGigPin(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setShowGigModal(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleGigConfirm}
							disabled={loading}
							className="bg-[#2c5b42] hover:bg-[#1b4332] text-white"
						>
							{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark as Shipped"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};

const ActionsCell = ({ order }: { order: Order }) => {
	return (
		<Link
			href={`/account/order-details?orderId=${order._id}`}
			className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200"
		>
			<Eye className="w-4 h-4 text-blue-500 mt-0.5" />
			<span className="text-blue-500">View Order</span>
		</Link>
	);
};

export const columns: ColumnDef<Order>[] = [
	{
		accessorKey: "orderNumber",
		header: "Order #",
		cell: ({ row }) => {
			const num: string = row.getValue("orderNumber");
			return (
				<span
					className="font-mono text-xs text-gray-600 block truncate"
					title={num}
				>
					{num?.slice(0, 8)}…{num?.slice(-6)}
				</span>
			);
		},
	},
	{
		id: "customer",
		accessorFn: (row) => row.customerName,
		header: "Customer",
		cell: ({ row }) => {
			const order = row.original;
			return (
				<div>
					<p className="font-medium text-sm text-gray-900 leading-tight">
						{order.customerName}
					</p>
					<p className="text-xs text-gray-400 truncate">
						{order.email}
					</p>
				</div>
			);
		},
	},
	{
		accessorKey: "orderDate",
		header: ({ column }) => (
			<Button
				variant="ghost"
				size="sm"
				className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-transparent"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
			>
				Date
				<ArrowUpDown className="ml-1.5 w-3 h-3" />
			</Button>
		),
		cell: ({ row }) => (
			<span className="text-sm text-gray-600">
				{formatDate(row.getValue("orderDate"))}
			</span>
		),
		sortingFn: "datetime",
	},
	{
		accessorKey: "paymentMethod",
		header: "Payment",
		cell: ({ row }) => {
			const method: string = row.getValue("paymentMethod");
			return method ? (
				<span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">
					{method}
				</span>
			) : (
				<span className="text-gray-400 text-xs">—</span>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <StatusCell order={row.original} />,
		filterFn: (row, _columnId, filterValue) => {
			if (filterValue === "all") return true;
			return row.getValue("status") === filterValue;
		},
	},
	{
		accessorKey: "totalPrice",
		header: ({ column }) => (
			<Button
				variant="ghost"
				size="sm"
				className="-mr-3 h-8 w-full justify-end text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-transparent"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
			>
				Total
				<ArrowUpDown className="ml-1.5 w-3 h-3" />
			</Button>
		),
		cell: ({ row }) => {
			const order = row.original;
			return (
				<div className="text-right font-semibold text-sm text-gray-900">
					{formatCurrency(order.totalPrice, order.currency)}
				</div>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => <ActionsCell order={row.original} />,
		enableSorting: false,
		enableHiding: false,
	},
];
