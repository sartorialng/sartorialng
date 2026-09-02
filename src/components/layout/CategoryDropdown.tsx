"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	categoryHref,
	hasAllProductsCategory,
	menuLabelFor,
	useStorefrontCategories,
} from "@/hooks/useStorefrontCategories";

const CategoryDropdown = () => {
	const categories = useStorefrontCategories();
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isHovering = useRef(false);

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	useEffect(
		() => () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		},
		[],
	);

	// A small grace period stops the menu snapping shut while the pointer
	// travels the gap between the trigger and the panel.
	const openNow = () => {
		isHovering.current = true;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setIsOpen(true);
	};
	const closeSoon = () => {
		isHovering.current = false;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setIsOpen(false), 150);
	};

	// On a mouse, hovering the trigger has already opened the menu by the time
	// the click lands, so a plain toggle would close it again and read as the
	// menu refusing to open. Touch and keyboard never hover, so they toggle.
	const handleTriggerClick = () => {
		if (isHovering.current && isOpen) return;
		setIsOpen((prev) => !prev);
	};

	if (categories.length === 0) return null;

	const isActive = pathname === "/category" || pathname === "/all-products";

	return (
		<div
			ref={containerRef}
			className="relative"
			onMouseEnter={openNow}
			onMouseLeave={closeSoon}
		>
			<button
				type="button"
				onClick={handleTriggerClick}
				aria-expanded={isOpen}
				aria-haspopup="true"
				className={cn(
					"relative flex items-center gap-1 font-semibold text-sartorial-green transition-colors duration-300 cursor-pointer",
					"after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full",
					"after:origin-left after:scale-x-0 after:bg-sartorial-green after:transition-transform after:duration-300",
					"hover:after:scale-x-100",
					isActive && "after:scale-x-100",
				)}
			>
				Category
				<ChevronDown
					className={cn(
						"h-4 w-4 transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<div
					className="absolute left-0 top-full z-50 pt-3"
					onMouseEnter={openNow}
					onMouseLeave={closeSoon}
				>
					<div className="min-w-[190px] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
						{categories.map((category) => {
							const label = menuLabelFor(category);

							// Coming-soon categories have no products, so they
							// are listed but not linked.
							if (category.comingSoon) {
								return (
									<div
										key={category._id}
										aria-disabled="true"
										className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-400"
									>
										{label}
										<span className="text-[10px] uppercase tracking-wide text-gray-400">
											Soon
										</span>
									</div>
								);
							}

							return (
								<Link
									key={category._id}
									href={categoryHref(category)}
									onClick={() => setIsOpen(false)}
									className="block px-4 py-2 text-sm font-medium text-sartorial-green transition-colors hover:bg-sartorial-green/5"
								>
									{label}
								</Link>
							);
						})}

						{!hasAllProductsCategory(categories) && (
							<Link
								href="/all-products"
								onClick={() => setIsOpen(false)}
								className="block px-4 py-2 text-sm font-medium text-sartorial-green transition-colors hover:bg-sartorial-green/5"
							>
								All Products
							</Link>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default CategoryDropdown;
