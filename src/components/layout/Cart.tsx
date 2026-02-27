"use client";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useBasketStore } from "@/store/store";
import { CartIcon, SartorialBag } from "@/assets";
import { useRouter } from "next/navigation";
import { urlFor } from "@/lib/imageUrl";
import { convertNGNtoUSD } from "@/lib/currency";
import Link from "next/link";

const Cart = () => {
	const router = useRouter();
	const groupedItems = useBasketStore((s) => s.getGroupedItems());
	const addItem = useBasketStore((s) => s.addItem);
	const removeItem = useBasketStore((s) => s.removeItem);
	const subtotal = useBasketStore((s) => s.getTotalPrice());

	const totalItems = groupedItems.reduce(
		(total, item) => total + item.quantity,
		0,
	);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<button className="relative">
					<CartIcon className="h-7 w-7 text-sartorial-green cursor-pointer" />
					{totalItems > 0 && (
						<span className="absolute -top-2 -right-2 bg-white text-green-900 text-xs px-2 rounded-full">
							{totalItems}
						</span>
					)}
				</button>
			</DialogTrigger>

			<DialogContent className="max-w-175 max-h-[90vh] flex flex-col rounded-3xl bg-sartorial-green text-white p-5 md:p-8 border-none">
				<DialogHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
					<DialogTitle className="text-xl font-semibold">
						Cart ({totalItems})
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
					{groupedItems.length === 0 && (
						<p className="py-10 text-center text-white/70">
							Your cart is empty 🛒
						</p>
					)}

					{groupedItems.map((item) => (
						<div
							key={item.product._id}
							className="flex items-center justify-between gap-6 py-6 border-b border-white/20"
						>
							<div className="flex items-center gap-4">
								<Image
									src={
										item.product?.images?.[0]?.asset
											? urlFor(item.product.images[0])
											: SartorialBag
									}
									alt={item.product.name ?? "pic"}
									width={50}
									height={50}
									className="rounded-lg object-cover"
								/>

								<div>
									<p className="text-sm md:text-base font-medium">
										{item.product.name}
									</p>
									{item.selectedColor && (
										<p className="text-xs text-white/70 mt-1">
											Color: {item.selectedColor.title}
										</p>
									)}
									<div className="flex items-center gap-3 mt-2">
										<button
											onClick={() =>
												// removeItem(item.product._id)
												removeItem(
													item.product._id,
													item.selectedColor,
												)
											}
											className="border border-white/40 rounded-sm py-2 px-2 hover:bg-white hover:text-green-900 cursor-pointer"
										>
											<Minus size={16} />
										</button>
										<span>{item.quantity}</span>
										<button
											onClick={() =>
												// addItem(item.product)
												addItem(
													item.product,
													item.selectedColor,
												)
											}
											className="border border-white/40 rounded-sm py-2 px-2 hover:bg-white hover:text-green-900 cursor-pointer"
										>
											<Plus size={16} />
										</button>
									</div>
								</div>
							</div>

							<div className="text-right space-y-2">
								<button
									onClick={() =>
										removeItem(
											item.product._id,
											item.selectedColor,
										)
									}
									className="text-white/70 hover:text-red-400 cursor-pointer"
								>
									<Trash2 size={18} />
								</button>
								<p className="font-semibold">
									{`₦${(
										(item.product.onSale
											? (item.product.salePrice ?? 0)
											: (item.product.price ?? 0)) *
										item.quantity
									).toLocaleString()}`}
								</p>

								<p className="font-semibold">
									{`$${convertNGNtoUSD(
										(item.product.onSale
											? (item.product.salePrice ?? 0)
											: (item.product.price ?? 0)) *
											item.quantity,
									).toLocaleString(undefined, {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}`}
								</p>
							</div>
						</div>
					))}
				</div>

				{groupedItems.length > 0 && (
					<div className="pt-6 mt-auto">
						<div className="flex items-center justify-between text-lg font-medium">
							<span>Subtotal</span>
							<div className="flex flex-col text-end">
								<p className="text-base">
									₦{subtotal.toLocaleString()}
								</p>
								<p className="text-sm">
									$
									{convertNGNtoUSD(subtotal).toLocaleString(
										undefined,
										{
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										},
									)}
								</p>
							</div>
						</div>

						<DialogClose asChild>
							<Button
								className="mt-6 h-10 w-full rounded-full bg-white text-green-900 hover:bg-white/90 cursor-pointer"
								onClick={() => router.push("/checkout")}
							>
								Checkout
							</Button>
						</DialogClose>
						<DialogClose asChild>
							<Link
								href="/"
								className="mx-auto mt-3 block text-center text-sm text-white/70 hover:text-white cursor-pointer"
							>
								Continue Shopping
							</Link>
						</DialogClose>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default Cart;
