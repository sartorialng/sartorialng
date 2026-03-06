"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Order, STATUS_STYLES, formatDate, formatCurrency } from "./types";
import Link from "next/link";

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
		cell: ({ row }) => {
			const status: string = row.getValue("status");
			return (
				<Badge
					variant="outline"
					className={`text-xs font-medium capitalize ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}
				>
					{status}
				</Badge>
			);
		},
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
