import { Cat1, Cat2, Cat3, Cat4 } from "@/assets";
import Image from "next/image";
import Link from "next/link";

const ShopByCategory = () => {
	return (
		<div className="w-full px-6 md:px-20 py-20 bg-sartorial-green">
			<div className="flex justify-center">
				<p className="text-center text-2xl md:text-4xl md:font-bold text-white">
					Shop by Category
				</p>
			</div>
			<div className="mt-10 md:mt-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
				<Link
					href={{
						pathname: "/category",
						query: { value: "Mini Bags" },
					}}
					className="group flex flex-col gap-5 items-center transition-transform duration-300 ease-out hover:-translate-y-2"
				>
					<div className="overflow-visible">
						<Image
							src={Cat1}
							alt="Category 1"
							className="transition-transform duration-300 ease-out group-hover:scale-110"
						/>
					</div>
					<p className="text-white text-center text-lg md:text-2xl transition-colors duration-300 group-hover:text-gray-200">
						Mini Bags
					</p>
				</Link>

				<Link
					href={{
						pathname: "/category",
						query: { value: "Small Bags" },
					}}
					className="group flex flex-col gap-5 items-center transition-transform duration-300 hover:-translate-y-2"
				>
					<div className="overflow-visible">
						<Image
							src={Cat2}
							alt="Category 2"
							className="transition-transform duration-300 group-hover:scale-110"
						/>
					</div>
					<p className="text-white text-center text-lg md:text-2xl transition-colors duration-300 group-hover:text-gray-200">
						Small Bags
					</p>
				</Link>

				<Link
					href={{
						pathname: "/category",
						query: { value: "Medium Bags" },
					}}
					className="group flex flex-col gap-5 items-center transition-transform duration-300 hover:-translate-y-2"
				>
					<div className="overflow-visible">
						<Image
							src={Cat3}
							alt="Category 3"
							className="transition-transform duration-300 group-hover:scale-110"
						/>
					</div>
					<p className="text-white text-center text-lg md:text-2xl transition-colors duration-300 group-hover:text-gray-200">
						Medium Bags
					</p>
				</Link>

				<Link
					href={{
						pathname: "/category",
						query: { value: "Large Bags" },
					}}
					className="group flex flex-col gap-5 items-center transition-transform duration-300 hover:-translate-y-2"
				>
					<div className="overflow-visible">
						<Image
							src={Cat4}
							alt="Category 4"
							className="transition-transform duration-300 group-hover:scale-110"
						/>
					</div>
					<p className="text-white text-center text-lg md:text-2xl transition-colors duration-300 group-hover:text-gray-200">
						Large Bags
					</p>
				</Link>
			</div>
		</div>
	);
};

export default ShopByCategory;
