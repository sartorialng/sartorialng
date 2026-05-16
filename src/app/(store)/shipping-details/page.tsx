import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { SHIPPING_ZONES } from "@/data/shipping";

const lagosZones = SHIPPING_ZONES.filter((z) => z.locations.length > 0);

const formatCost = (cost: number) => `₦${cost.toLocaleString("en-NG")}`;

const shippingTableData = [
	...lagosZones.map((z) => ({
		area: z.area,
		cost: formatCost(z.cost),
		time: "24 – 48 hours",
		tracking: "Not available",
	})),
	{
		area: "Inter-State Deliveries",
		cost: formatCost(
			SHIPPING_ZONES.find((z) => z.area === "Inter-State")?.cost ?? 8000,
		),
		time: "2 – 5 working days",
		tracking: "Available",
	},
	{
		area: "African Deliveries",
		cost: formatCost(
			SHIPPING_ZONES.find((z) => z.area === "African Countries")?.cost ??
				125000,
		),
		time: "5 – 8 working days",
		tracking: "Available",
	},
	{
		area: "International (Europe, North America, Asia, etc.)",
		cost: formatCost(
			SHIPPING_ZONES.find((z) => z.area === "International")?.cost ??
				268000,
		),
		time: "14 working days",
		tracking: "Available",
	},
];

const ShippingDetails = () => {
	return (
		<div className="h-auto w-full bg-gray-50 flex flex-col">
			<Header />
			<div className="w-full mt-10 md:mt-20 py-10 px-5 md:px-20">
				<div className="bg-[#8EC09E45] text-sartorial-green p-6 md:p-8 rounded-sm">
					<h1 className="text-2xl font-bold text-center mb-8 uppercase tracking-wide">
						Shipping Details
					</h1>

					<div className="mb-8 space-y-3">
						<p className="font-medium text-lg italic">
							Here is your shipping fees according to your
							location:
						</p>
						<ul className="list-disc ml-5 space-y-2">
							<li>
								Please pay more attention to your order address
								which <strong>MUST MATCH</strong> your shipping
								address.
							</li>
							<li>
								Items will be shipped within{" "}
								<strong>3 business days</strong> after payment.
							</li>
							<li>
								Please check items when delivered; if damaged,
								please contact us immediately for prompt
								resolution.
							</li>
						</ul>
					</div>

					{/* Shipping Table */}
					<div className="overflow-x-auto border border-[#1B4332]/20 rounded-lg">
						<table className="w-full text-left border-collapse bg-white/50">
							<thead>
								<tr className="bg-[#1B4332] text-white">
									<th className="p-4 border border-[#1B4332]/10 uppercase text-sm">
										Order Summary
									</th>
									<th className="p-4 border border-[#1B4332]/10 uppercase text-sm">
										Shipping Cost
									</th>
									<th className="p-4 border border-[#1B4332]/10 uppercase text-sm whitespace-nowrap">
										Estimated Delivery
									</th>
									<th className="p-4 border border-[#1B4332]/10 uppercase text-sm">
										Tracking
									</th>
								</tr>
							</thead>
							<tbody>
								{shippingTableData.map((item, index) => (
									<tr
										key={index}
										className="hover:bg-white/80 transition-colors"
									>
										<td className="p-4 border border-[#1B4332]/10 font-medium">
											{item.area}
										</td>
										<td className="p-4 border border-[#1B4332]/10">
											{item.cost}
										</td>
										<td className="p-4 border border-[#1B4332]/10">
											{item.time}
										</td>
										<td className="p-4 border border-[#1B4332]/10 text-sm italic">
											{item.tracking}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<p className="mt-4 text-xs italic text-right">
						*International shipping is calculated based on weight.
						Estimated delivery for international excludes public
						holidays.
					</p>

					{/* Area Included (Quick Reference) */}
					<div className="mt-10 space-y-6">
						<section>
							<h2 className="text-xl font-bold mb-4 border-b border-[#1B4332]/20 pb-2">
								Area Included (Quick Reference)
							</h2>
							<ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
								{lagosZones.map((zone) => (
									<li key={zone.area}>
										<strong>{zone.area}:</strong>{" "}
										{zone.locations.join(", ")}.
									</li>
								))}
							</ul>
						</section>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
							{/* Shipping Duration */}
							<section>
								<h3 className="font-bold uppercase mb-3">
									Shipping Duration
								</h3>
								<ul className="space-y-2 text-sm list-disc ml-5">
									<li>
										<strong>Within Lagos:</strong> 24 – 48
										hours
									</li>
									<li>
										<strong>Inter-state:</strong> 2 – 5
										working days
									</li>
									<li>
										<strong>International:</strong> 14
										working days (excluding public holidays)
									</li>
								</ul>
							</section>

							{/* Return Policy Quick Summary */}
							<section>
								<h3 className="font-bold uppercase mb-3 text-red-800">
									Return Policy
								</h3>
								<p className="text-sm leading-relaxed">
									Returns are accepted within{" "}
									<strong>24 hours</strong> after receiving
									the product. Please note that the{" "}
									<strong>
										customer covers the return shipping fee
									</strong>
									.
								</p>
							</section>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default ShippingDetails;
