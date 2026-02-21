import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const ShippingDetails = () => {
	const shippingData = [
		{
			area: "Mainland 1",
			cost: "₦3,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Mainland 2",
			cost: "₦4,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Mainland 3",
			cost: "₦6,000",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Mainland 4",
			cost: "₦5,000",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Mainland 5",
			cost: "₦6,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Mainland 6",
			cost: "₦4,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Island 1",
			cost: "₦3,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Island 2",
			cost: "₦4,000",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Chevron/VGC area",
			cost: "₦4,500",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Island 3",
			cost: "₦5,000",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Island 4",
			cost: "₦6,000",
			time: "24 – 48 hours",
			tracking: "Not available",
		},
		{
			area: "Inter-State Deliveries",
			cost: "₦7,000",
			time: "2 – 5 working days",
			tracking: "Available",
		},
		{
			area: "African Deliveries",
			cost: "₦125,000",
			time: "5 – 8 working days",
			tracking: "Available",
		},
		{
			area: "International (Europe, North America, Asia, etc.)",
			cost: "₦268,000",
			time: "14 working days",
			tracking: "Available",
		},
	];

	return (
		<div className="h-auto w-full bg-gray-50 flex flex-col">
			<Header />
			<div className="w-full mt-10 md:mt-20 py-10 px-5 md:px-20">
				<div className="bg-[#8EC09E45] text-[#1B4332] p-6 md:p-8 rounded-sm">
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

					{/* Responsive Table Wrapper */}
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
								{shippingData.map((item, index) => (
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
								<li>
									<strong>Mainland 1:</strong> Yaba, Gbagada,
									Oshodi, Akoka, Unilag, Fadeyi, Mushin,
									Anthony, Ilupeju, Surulere.
								</li>
								<li>
									<strong>Mainland 2:</strong> Ago Palace,
									Okota, Festac, Mile 2, Isolo, Ijesha, Ikeja,
									Maryland.
								</li>
								<li>
									<strong>Mainland 3:</strong> Apapa,
									Ajegunle, Abule-Ado, Satellite Town, Trade
									Fair, Iyana-Iba, LASU.
								</li>
								<li>
									<strong>Mainland 4:</strong> Ikorodu,
									Abulegba, Ogba, Ikotun, Agege, Ketu, Ipaja,
									Iyana Ipaja, Ejigbo, Iju Ishaga.
								</li>
								<li>
									<strong>Mainland 5:</strong> Akute, Arepo,
									Badagry, Olowora.
								</li>
								<li>
									<strong>Mainland 6:</strong> Magodo, Omole,
									Ogudu, Ketu, Ojota.
								</li>
								<li>
									<strong>Island 1:</strong> Obalende, Ikoyi,
									Victoria Island, Oniru, Lekki Phase 1, Ikate
									Elegushi, Ikate.
								</li>
								<li>
									<strong>Island 2:</strong> Ilaje, Osapa
									London, Elegushi, Jakande, Agungi, Ologolo.
								</li>
								<li>
									<strong>Chevron / VGC Area:</strong>{" "}
									Chevron, Conservation, Orchid VGC.
								</li>
								<li>
									<strong>Island 3:</strong> Ajah, Badore,
									Abraham Adesanya, Lekki Gardens.
								</li>
								<li>
									<strong>Island 4:</strong> Sangotedo, etc.
								</li>
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
