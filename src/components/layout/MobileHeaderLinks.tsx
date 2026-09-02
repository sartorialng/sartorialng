"use client";
import { BrandLogo } from "@/assets";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { headerLinks } from "@/data";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import {
	categoryHref,
	hasAllProductsCategory,
	menuLabelFor,
	useStorefrontCategories,
} from "@/hooks/useStorefrontCategories";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MobileHeaderLinks = () => {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="md:hidden">
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetTrigger asChild>
					<button
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						aria-label="Open menu"
					>
						<Menu className="h-6 w-6 text-sartorial-green" />
					</button>
				</SheetTrigger>
				<SheetContent
					side="left"
					className="w-70 sm:w-[320px] p-0 bg-white border-r border-gray-200"
					showCloseButton={false}
				>
					<div className="px-6 py-5 border-b border-gray-200 bg-sartorial-offWhite">
						<SheetTitle className="flex items-center justify-between">
							<Link
								href="/"
								onClick={() => setIsOpen(false)}
								className="hover:opacity-80 transition-opacity"
							>
								<Image
									src={BrandLogo}
									alt="Sartorial Logo"
									width={100}
									height={40}
								/>
							</Link>
							<button
								onClick={() => setIsOpen(false)}
								className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
								aria-label="Close menu"
							>
								<X className="h-5 w-5 text-sartorial-green" />
							</button>
						</SheetTitle>
					</div>

					<nav className="py-6 px-4">
						<div className="flex flex-col space-y-1">
							{headerLinks.map((link) =>
								link.kind === "categoryDropdown" ? (
									<MobileCategoryLinks
										key="category"
										label={link.label}
										onNavigate={() => setIsOpen(false)}
									/>
								) : (
									<Link
										key={link.href}
										href={link.href}
										onClick={() => setIsOpen(false)}
										className={cn(
											"group relative px-4 py-3 rounded-lg font-semibold text-base",
											"transition-all duration-200",
											"hover:bg-sartorial-green/5",
											pathname === link.href
												? "bg-sartorial-green/10 text-sartorial-green"
												: "text-gray-700 hover:text-sartorial-green",
										)}
									>
										<span className="relative z-10">
											{link.label}
										</span>

										{pathname === link.href && (
											<div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sartorial-green rounded-r-full" />
										)}
									</Link>
								),
							)}
						</div>
					</nav>

					<div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-sartorial-offWhite/50">
						<p className="text-xs text-gray-600 text-center">
							© 2026 Sartorial
						</p>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
};

const MobileCategoryLinks = ({
	label,
	onNavigate,
}: {
	label: string;
	onNavigate: () => void;
}) => {
	const categories = useStorefrontCategories();
	const [isExpanded, setIsExpanded] = useState(false);

	if (categories.length === 0) return null;

	return (
		<div>
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				className={cn(
					"w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold text-base",
					"transition-all duration-200 cursor-pointer",
					"text-gray-700 hover:bg-sartorial-green/5 hover:text-sartorial-green",
				)}
			>
				{label}
				<ChevronDown
					className={cn(
						"h-4 w-4 transition-transform duration-200",
						isExpanded && "rotate-180",
					)}
				/>
			</button>

			{isExpanded && (
				<div className="mt-1 ml-4 flex flex-col border-l border-gray-200 pl-3">
					{categories.map((category) =>
						category.comingSoon ? (
							<div
								key={category._id}
								aria-disabled="true"
								className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-gray-400"
							>
								{menuLabelFor(category)}
								<span className="text-[10px] uppercase tracking-wide">
									Soon
								</span>
							</div>
						) : (
							<Link
								key={category._id}
								href={categoryHref(category)}
								onClick={onNavigate}
								className="px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-colors hover:bg-sartorial-green/5 hover:text-sartorial-green"
							>
								{menuLabelFor(category)}
							</Link>
						),
					)}

					{!hasAllProductsCategory(categories) && (
						<Link
							href="/all-products"
							onClick={onNavigate}
							className="px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-colors hover:bg-sartorial-green/5 hover:text-sartorial-green"
						>
							All Products
						</Link>
					)}
				</div>
			)}
		</div>
	);
};

export default MobileHeaderLinks;
