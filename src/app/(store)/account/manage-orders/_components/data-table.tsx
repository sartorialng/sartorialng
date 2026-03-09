"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Order, formatDate } from "./types";

interface DataTableProps {
	columns: ColumnDef<Order>[];
	data: Order[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_OPTIONS = [
	{ label: "All Statuses", value: "all" },
	{ label: "Pending", value: "pending" },
	{ label: "Paid", value: "paid" },
	{ label: "Shipped", value: "shipped" },
	{ label: "Delivered", value: "delivered" },
	{ label: "Cancelled", value: "cancelled" },
];

export function DataTable({ columns, data }: DataTableProps) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "orderDate", desc: true },
	]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [pageSize, setPageSize] = useState(10);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			pagination: {
				pageIndex: 0,
				pageSize,
			},
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		// Reset to page 0 whenever filters/sorting change
		autoResetPageIndex: true,
		globalFilterFn: (row, _columnId, filterValue) => {
			const q = filterValue.toLowerCase();
			const order = row.original as Order;
			return (
				order.orderNumber?.toLowerCase().includes(q) ||
				order.customerName?.toLowerCase().includes(q) ||
				order.email?.toLowerCase().includes(q)
			);
		},
	});

	// We manage pageIndex manually to allow the pagination UI to work
	const [pageIndex, setPageIndex] = useState(0);
	table.setOptions((prev) => ({
		...prev,
		state: {
			...prev.state,
			pagination: { pageIndex, pageSize },
		},
		onPaginationChange: (updater) => {
			const next =
				typeof updater === "function"
					? updater({ pageIndex, pageSize })
					: updater;
			setPageIndex(next.pageIndex);
			setPageSize(next.pageSize);
		},
	}));

	// Reset page on filter/sort changes
	const handleGlobalFilter = (val: string) => {
		setGlobalFilter(val);
		setPageIndex(0);
	};

	const handleStatusFilter = (val: string) => {
		table.getColumn("status")?.setFilterValue(val === "all" ? "" : val);
		setPageIndex(0);
	};

	const handlePageSize = (val: string) => {
		setPageSize(Number(val));
		setPageIndex(0);
	};

	// Export filtered + sorted rows (not just current page)
	const exportToExcel = () => {
		const rows = table.getFilteredRowModel().rows.map((r) => {
			const o = r.original;
			return {
				"Order Number": o.orderNumber,
				"Customer Name": o.customerName,
				Email: o.email,
				Status: o.status,
				"Payment Method": o.paymentMethod ?? "",
				"Order Date": formatDate(o.orderDate),
				Subtotal: o.subtotal ?? "",
				"Shipping Cost": o.shippingCost ?? "",
				VAT: o.vat ?? "",
				Discount: o.amountDiscount ?? "",
				"Total Price": o.totalPrice,
				Currency: o.currency,
				"Shipping Address": o.shippingAddress
					? [
							o.shippingAddress.address,
							o.shippingAddress.city,
							o.shippingAddress.state,
							o.shippingAddress.country,
						]
							.filter(Boolean)
							.join(", ")
					: "",
				Phone: o.shippingAddress?.phone ?? "",
				"Paystack Ref": o.paystackReference ?? "",
				"PayPal Order ID": o.paypalOrderId ?? "",
				"Order Note": o.orderNote ?? "",
				Products:
					o.products
						?.map(
							(p) =>
								`${p.product?.name} x${p.quantity}${p.selectedColor?.colorTitle ? ` (${p.selectedColor.colorTitle})` : ""}`,
						)
						.join("; ") ?? "",
			};
		});

		const ws = XLSX.utils.json_to_sheet(rows);
		ws["!cols"] = [
			{ wch: 28 },
			{ wch: 22 },
			{ wch: 28 },
			{ wch: 12 },
			{ wch: 16 },
			{ wch: 14 },
			{ wch: 12 },
			{ wch: 14 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 14 },
			{ wch: 10 },
			{ wch: 36 },
			{ wch: 16 },
			{ wch: 28 },
			{ wch: 24 },
			{ wch: 20 },
			{ wch: 40 },
		];
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Orders");
		XLSX.writeFile(
			wb,
			`orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
		);
	};

	const totalRows = table.getFilteredRowModel().rows.length;
	const totalPages = table.getPageCount();
	const currentPage = pageIndex;

	// Build page number list with ellipsis
	const pageNumbers = Array.from({ length: totalPages }, (_, i) => i)
		.filter(
			(p) =>
				p === 0 ||
				p === totalPages - 1 ||
				Math.abs(p - currentPage) <= 1,
		)
		.reduce<(number | "...")[]>((acc, p, idx, arr) => {
			if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
			acc.push(p);
			return acc;
		}, []);

	return (
		<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
			{/* ── Toolbar ── */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-gray-100">
				{/* Search */}
				<div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
					<Input
						placeholder="Search name, email, order #…"
						value={globalFilter}
						onChange={(e) => handleGlobalFilter(e.target.value)}
						className="pl-9 h-9 text-sm border-gray-200 focus-visible:ring-sartorial-green"
					/>
				</div>

				<div className="flex items-center gap-2 w-full sm:w-auto">
					{/* Status filter */}
					<Select
						defaultValue="all"
						onValueChange={handleStatusFilter}
					>
						<SelectTrigger className="h-9 text-sm border-gray-200 w-36 focus:ring-sartorial-green">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((s) => (
								<SelectItem key={s.value} value={s.value}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Export */}
					<Button
						onClick={exportToExcel}
						variant="outline"
						size="sm"
						className="h-9 text-white text-sm border-gray-200 gap-1.5 hover:bg-sartorial-green hover:text-white hover:border-sartorial-green bg-sartorial-green transition-colors cursor-pointer"
					>
						<Download className="w-4 h-4" />
						Export
					</Button>
				</div>
			</div>

			{/* ── Table ── */}
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((hg) => (
							<TableRow
								key={hg.id}
								className="bg-gray-50/80 hover:bg-gray-50/80"
							>
								{hg.headers.map((header) => (
									<TableHead
										key={header.id}
										className="pl-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="text-center py-16 text-gray-400"
								>
									<p className="text-sm">No orders found</p>
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									className="hover:bg-gray-50/60 transition-colors group"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="p-4"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* ── Pagination ── */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
				{/* Rows per page */}
				<div className="flex items-center gap-2 text-sm text-gray-500">
					<span>Rows per page</span>
					<Select
						value={String(pageSize)}
						onValueChange={handlePageSize}
					>
						<SelectTrigger className="h-8 w-16 text-sm border-gray-200">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((n) => (
								<SelectItem key={n} value={String(n)}>
									{n}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Page info + controls */}
				<div className="flex items-center gap-3">
					<span className="text-sm text-gray-500">
						{totalRows === 0
							? "0 orders"
							: `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, totalRows)} of ${totalRows}`}
					</span>

					<div className="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8 border-gray-200"
							onClick={() =>
								setPageIndex((p) => Math.max(0, p - 1))
							}
							disabled={!table.getCanPreviousPage()}
						>
							<ChevronLeft className="w-4 h-4" />
						</Button>

						{pageNumbers.map((p, i) =>
							p === "..." ? (
								<span
									key={`ellipsis-${i}`}
									className="px-1 text-gray-400 text-sm"
								>
									…
								</span>
							) : (
								<Button
									key={p}
									variant={
										p === currentPage
											? "default"
											: "outline"
									}
									size="icon"
									className={`h-8 w-8 text-sm border-gray-200 ${
										p === currentPage
											? "bg-sartorial-green hover:bg-[#234a36] border-sarbg-sartorial-green text-white"
											: ""
									}`}
									onClick={() => setPageIndex(p as number)}
								>
									{(p as number) + 1}
								</Button>
							),
						)}

						<Button
							variant="outline"
							size="icon"
							className="h-8 w-8 border-gray-200"
							onClick={() =>
								setPageIndex((p) =>
									Math.min(totalPages - 1, p + 1),
								)
							}
							disabled={!table.getCanNextPage()}
						>
							<ChevronRight className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
