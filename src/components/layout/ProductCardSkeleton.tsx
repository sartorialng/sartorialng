const ProductCardSkeleton = () => {
	return (
		<div className="w-full max-w-sm border-none animate-pulse">
			{/* Main Card Container */}
			<div className="bg-white p-3 md:p-5 rounded-lg">
				{/* Wishlist Heart Icon Placeholder */}
				<div className="flex justify-end mb-2 md:mb-4">
					<div className="w-4 h-4 md:w-6 md:h-6 bg-gray-200 rounded-full"></div>
				</div>

				{/* Product Image Placeholder - Matches h-30 md:h-50 */}
				<div className="flex justify-center mb-2">
					<div className="w-full h-30 md:h-50 bg-gray-200 rounded-sm"></div>
				</div>
			</div>

			{/* Content Area */}
			<div className="mt-3">
				<div className="text-center space-y-2">
					{/* Title Placeholder */}
					<div className="h-5 md:h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>

					{/* Price Row Placeholder - Matches the flex md:flex-col layout */}
					<div className="flex md:flex-col items-center gap-2 md:gap-1 justify-center">
						<div className="h-4 md:h-5 bg-gray-200 rounded w-20"></div>
						<div className="h-3 md:h-4 bg-gray-200 rounded w-16"></div>
					</div>
				</div>

				{/* Buttons Placeholder */}
				<div className="flex flex-row items-center justify-between gap-2 sm:gap-3 mt-2 md:mt-4">
					<div className="flex-1 h-8 md:h-10 bg-gray-200 rounded-sm"></div>
					<div className="flex-1 h-8 md:h-10 bg-gray-200 rounded-sm"></div>
				</div>
			</div>
		</div>
	);
};

export default ProductCardSkeleton;
