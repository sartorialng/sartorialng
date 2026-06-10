"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	Printer,
	MapPin,
	Phone,
	Mail,
	Package,
	CreditCard,
	Hash,
	StickyNote,
	User,
	Truck,
} from "lucide-react";
import { getOrderById } from "@/sanity/lib/product/getOrderById";
import { Order } from "../manage-orders/_components/types";
import Image from "next/image";

const STATUS_STYLES: Record<string, string> = {
	pending: "bg-amber-100 text-amber-800 border-amber-200",
	paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
	shipped: "bg-blue-100 text-blue-800 border-blue-200",
	delivered: "bg-purple-100 text-purple-800 border-purple-200",
	cancelled: "bg-red-100 text-red-800 border-red-200",
};

const formatDate = (dateStr: string) =>
	new Date(dateStr).toLocaleDateString("en-GB", {
		weekday: "long",
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

const formatCurrency = (amount: number | undefined, currency: string) => {
	if (amount === undefined || amount === null) return "—";
	const symbol =
		currency?.toUpperCase() === "NGN"
			? "₦"
			: currency?.toUpperCase() === "USD"
				? "$"
				: currency + " ";
	return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const InfoRow = ({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value?: string | null;
}) => {
	if (!value) return null;
	return (
		<div className="flex items-start gap-2.5">
			<Icon className="w-4 h-4 text-sartorial-green mt-0.5 shrink-0" />
			<div>
				<p className="text-xs text-gray-400 font-medium">{label}</p>
				<p className="text-sm text-gray-800">{value}</p>
			</div>
		</div>
	);
};

const SectionCard = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
		<h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
			{title}
		</h2>
		{children}
	</div>
);

const OrderDetailContent = () => {
	const searchParams = useSearchParams();
	const orderId = searchParams.get("orderId");
	const router = useRouter();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const printRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		getOrderById(orderId || "").then((order: Order) => {
			setOrder(order || null);
			setLoading(false);
		});
	}, [orderId]);

	const handlePrint = () => {
		if (!printRef.current) return;
		const printContents = printRef.current.innerHTML;
		const win = window.open("", "_blank", "width=900,height=700");
		if (!win) return;
		win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order ${order?.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Georgia', serif; color: #1a1a1a; padding: 40px; font-size: 13px; }
            h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
            h2 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 12px; margin-top: 24px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #2c5b42; padding-bottom: 20px; }
            .brand { color: #2c5b42; font-size: 13px; font-weight: 600; }
            .meta { font-size: 12px; color: #555; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .info-row { margin-bottom: 8px; }
            .info-label { font-size: 10px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
            .info-value { font-size: 13px; color: #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; padding: 8px 10px; text-align: left; border-bottom: 1px solid #eee; }
            td { font-size: 12px; padding: 10px 10px; border-bottom: 1px solid #f3f3f3; vertical-align: top; }
            .text-right { text-align: right; }
            .totals { margin-top: 16px; margin-left: auto; width: 240px; }
            .totals-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; color: #555; }
            .totals-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; padding-top: 8px; border-top: 1px solid #ddd; margin-top: 6px; color: #2c5b42; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize; background: #d1fae5; color: #065f46; }
            .note { background: #f9fafb; border-left: 3px solid #2c5b42; padding: 10px 14px; font-size: 12px; color: #555; margin-top: 8px; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
		win.document.close();
		win.focus();
		setTimeout(() => {
			win.print();
			win.close();
		}, 400);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col bg-[#f7f8f6]">
				<Header />
				<main className="grow flex items-center justify-center pt-40">
					<div className="flex flex-col items-center gap-3 text-gray-400">
						<Package className="w-8 h-8 animate-pulse" />
						<p className="text-sm">Loading order...</p>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	if (!order) {
		return (
			<div className="min-h-screen flex flex-col bg-[#f7f8f6]">
				<Header />
				<main className="grow flex items-center justify-center pt-40">
					<div className="text-center">
						<Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
						<p className="text-gray-600 font-medium">
							Order not found
						</p>
						<Button
							className="mt-4 bg-sartorial-green hover:bg-[#234a36]"
							onClick={() => router.push("/account/orders")}
						>
							Back to Orders
						</Button>
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	const shippingFull = order.shippingAddress
		? [
				order.shippingAddress.address,
				order.shippingAddress.city,
				order.shippingAddress.state,
				order.shippingAddress.country,
				order.shippingAddress.postalCode,
			]
				.filter(Boolean)
				.join(", ")
		: null;

	const printContent = `
    <div class="header">
      <div>
        <h1>Order Receipt</h1>
        <div class="meta">Order #${order.orderNumber}</div>
        <div class="meta">${formatDate(order.orderDate)}</div>
      </div>
      <div style="text-align:right">
        <div class="brand">Sartorial</div>
        <div class="meta">Admin Portal</div>
        <div class="badge" style="margin-top:6px">${order.status}</div>
      </div>
    </div>

    <div class="grid2">
      <div>
        <h2>Customer</h2>
        <div class="info-row"><div class="info-label">Name</div><div class="info-value">${order.customerName}</div></div>
        <div class="info-row"><div class="info-label">Email</div><div class="info-value">${order.email}</div></div>
        ${order.shippingAddress?.phone ? `<div class="info-row"><div class="info-label">Phone</div><div class="info-value">${order.shippingAddress.phone}</div></div>` : ""}
        ${order.shippingAddress?.secondaryPhone ? `<div class="info-row"><div class="info-label">Alt. Phone</div><div class="info-value">${order.shippingAddress.secondaryPhone}</div></div>` : ""}
      </div>
      <div>
        <h2>Shipping Address</h2>
        ${shippingFull ? `<div class="info-value">${shippingFull}</div>` : "<div class='info-value'>—</div>"}
        <h2 style="margin-top:16px">Payment</h2>
        <div class="info-row"><div class="info-label">Method</div><div class="info-value">${order.paymentMethod || "—"}</div></div>
        ${order.paystackReference ? `<div class="info-row"><div class="info-label">Paystack Ref</div><div class="info-value">${order.paystackReference}</div></div>` : ""}
        ${order.paypalOrderId ? `<div class="info-row"><div class="info-label">PayPal ID</div><div class="info-value">${order.paypalOrderId}</div></div>` : ""}
      </div>
    </div>

    <h2>Products</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Color</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.products
			?.map(
				(p) => `
          <tr>
            <td>${p.product?.name || "—"}</td>
            <td>${p.selectedColor?.colorTitle || "—"}</td>
            <td class="text-right">${p.quantity}</td>
            <td class="text-right">${formatCurrency(p.product?.price, order.currency)}</td>
            <td class="text-right">${formatCurrency((p.product?.price || 0) * p.quantity, order.currency)}</td>
          </tr>
        `,
			)
			.join("")}
      </tbody>
    </table>

    <div class="totals">
      ${order.subtotal !== undefined ? `<div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal, order.currency)}</span></div>` : ""}
      ${order.shippingCost !== undefined ? `<div class="totals-row"><span>Shipping</span><span>${formatCurrency(order.shippingCost, order.currency)}</span></div>` : ""}
      ${order.vat !== undefined ? `<div class="totals-row"><span>VAT</span><span>${formatCurrency(order.vat, order.currency)}</span></div>` : ""}
      ${order.amountDiscount ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(order.amountDiscount, order.currency)}</span></div>` : ""}
      <div class="totals-total"><span>Total</span><span>${formatCurrency(order.totalPrice, order.currency)}</span></div>
    </div>

    ${order.orderNote ? `<h2>Order Note</h2><div class="note">${order.orderNote}</div>` : ""}
  `;

	return (
		<div className="min-h-screen flex flex-col bg-[#f7f8f6]">
			<Header />
			<main className="grow w-full pt-20 md:pt-30 pb-20 px-4 md:px-10 lg:px-20">
				<div className="max-w-4xl mx-auto space-y-5">
					{/* Nav + Actions */}
					<div className="flex items-center justify-between">
						<button
							onClick={() =>
								router.push("/account/manage-orders")
							}
							className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-sartorial-green transition-colors cursor-pointer"
						>
							<ArrowLeft className="w-4 h-4" />
							Back to Orders
						</button>
						<Button
							onClick={handlePrint}
							className="bg-sartorial-green hover:bg-[#234a36] gap-2 text-sm h-9 cursor-pointer"
						>
							<Printer className="w-4 h-4" />
							Print / Save PDF
						</Button>
					</div>

					{/* Order Header */}
					<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 md:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div>
								<div className="flex items-center gap-2 mb-1">
									<Hash className="w-4 h-4 text-gray-400" />
									<p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
										Order Number
									</p>
								</div>
								<p className="font-mono text-sm text-gray-700 break-all">
									{order.orderNumber}
								</p>
							</div>
							<div className="flex items-center gap-3">
								<Badge
									variant="outline"
									className={`text-sm font-semibold capitalize px-3 py-1 ${STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700"}`}
								>
									{order.status}
								</Badge>
							</div>
						</div>
						<Separator className="my-4" />
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<p className="text-xs text-gray-400 font-medium mb-1">
									Date
								</p>
								<p className="text-gray-700 font-medium">
									{formatDate(order.orderDate)}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 font-medium mb-1">
									Payment
								</p>
								<p className="text-gray-700 capitalize font-medium">
									{order.paymentMethod || "—"}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 font-medium mb-1">
									Items
								</p>
								<p className="text-gray-700 font-medium">
									{order.products?.reduce(
										(acc, p) => acc + (p.quantity || 0),
										0,
									)}{" "}
									item(s)
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-400 font-medium mb-1">
									Total
								</p>
								<p className="text-sartorial-green font-bold">
									{formatCurrency(
										order.totalPrice,
										order.currency,
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						{/* Customer */}
						<SectionCard title="Customer">
							<div className="space-y-3">
								<InfoRow
									icon={User}
									label="Full Name"
									value={order.customerName}
								/>
								<InfoRow
									icon={Mail}
									label="Email"
									value={order.email}
								/>
								{order.shippingAddress?.phone && (
									<InfoRow
										icon={Phone}
										label="Phone"
										value={order.shippingAddress.phone}
									/>
								)}
								{order.shippingAddress?.secondaryPhone && (
									<InfoRow
										icon={Phone}
										label="Alt. Phone"
										value={
											order.shippingAddress.secondaryPhone
										}
									/>
								)}
							</div>
						</SectionCard>

						{/* Shipping */}
						<SectionCard title="Shipping Address">
							<div className="space-y-3">
								{shippingFull ? (
									<InfoRow
										icon={MapPin}
										label="Full Address"
										value={shippingFull}
									/>
								) : (
									<p className="text-sm text-gray-400">
										No address provided
									</p>
								)}
								{order.deliveryType && (
									<InfoRow
										icon={Truck}
										label="Delivery Type"
										value={
											order.deliveryType === "doorstep"
												? "Doorstep Delivery"
												: "Pick Up"
										}
									/>
								)}
							</div>
						</SectionCard>
					</div>

					{/* Payment Details */}
					{(order.paystackReference || order.paypalOrderId) && (
						<SectionCard title="Payment Reference">
							<div className="space-y-3">
								{order.paystackReference && (
									<InfoRow
										icon={CreditCard}
										label="Paystack Reference"
										value={order.paystackReference}
									/>
								)}
								{order.paypalOrderId && (
									<InfoRow
										icon={CreditCard}
										label="PayPal Order ID"
										value={order.paypalOrderId}
									/>
								)}
							</div>
						</SectionCard>
					)}

					{/* Products */}
					<SectionCard title="Products Ordered">
						<div className="space-y-3">
							{order.products?.map((item, idx) => {
								const img =
									item.product?.images?.[0]?.asset?.url;
								return (
									<div
										key={idx}
										className="flex items-center gap-4 p-3 rounded-lg bg-gray-50/70 border border-gray-100"
									>
										{img ? (
											<Image
												height={100}
												width={100}
												src={img}
												alt={
													item.product?.name ||
													"product"
												}
												className="w-14 h-14 object-cover rounded-lg shrink-0 border border-gray-200"
											/>
										) : (
											<div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
												<Package className="w-5 h-5 text-gray-400" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm text-gray-900 truncate">
												{item.product?.name}
											</p>
											{item.selectedColor?.colorTitle && (
												<p className="text-xs text-gray-500">
													Color:{" "}
													{
														item.selectedColor
															.colorTitle
													}
												</p>
											)}
											<p className="text-xs text-gray-500">
												Qty: {item.quantity} ×{" "}
												{formatCurrency(
													item.product?.price,
													order.currency,
												)}
											</p>
										</div>
										<p className="font-semibold text-sm text-gray-900 shrink-0">
											{formatCurrency(
												(item.product?.price || 0) *
													item.quantity,
												order.currency,
											)}
										</p>
									</div>
								);
							})}
						</div>

						{/* Totals */}
						<div className="mt-5 border-t border-gray-100 pt-4 space-y-2 max-w-xs ml-auto">
							{order.subtotal !== undefined && (
								<div className="flex justify-between text-sm text-gray-600">
									<span>Subtotal</span>
									<span>
										{formatCurrency(
											order.subtotal,
											order.currency,
										)}
									</span>
								</div>
							)}
							{order.shippingCost !== undefined && (
								<div className="flex justify-between text-sm text-gray-600">
									<span>Shipping</span>
									<span>
										{formatCurrency(
											order.shippingCost,
											order.currency,
										)}
									</span>
								</div>
							)}
							{order.vat !== undefined && (
								<div className="flex justify-between text-sm text-gray-600">
									<span>VAT</span>
									<span>
										{formatCurrency(
											order.vat,
											order.currency,
										)}
									</span>
								</div>
							)}
							{!!order.amountDiscount && (
								<div className="flex justify-between text-sm text-red-600">
									<span>Discount</span>
									<span>
										−
										{formatCurrency(
											order.amountDiscount,
											order.currency,
										)}
									</span>
								</div>
							)}
							<div className="flex justify-between text-base font-bold text-sartorial-green border-t border-gray-100 pt-2 mt-1">
								<span>Total</span>
								<span>
									{formatCurrency(
										order.totalPrice,
										order.currency,
									)}
								</span>
							</div>
						</div>
					</SectionCard>

					{/* Order Note */}
					{order.orderNote && (
						<SectionCard title="Order Note">
							<div className="flex items-start gap-2.5">
								<StickyNote className="w-4 h-4 text-sartorial-green mt-0.5 shrink-0" />
								<p className="text-sm text-gray-700 leading-relaxed">
									{order.orderNote}
								</p>
							</div>
						</SectionCard>
					)}
				</div>
			</main>

			{/* Hidden print div */}
			<div style={{ display: "none" }}>
				<div
					ref={printRef}
					dangerouslySetInnerHTML={{ __html: printContent }}
				/>
			</div>

			<Footer />
		</div>
	);
};

export default function OrderDetailPage() {
	return (
		<Suspense>
			<OrderDetailContent />
		</Suspense>
	);
}
