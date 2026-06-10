import { AFRICAN_COUNTRIES, INTERSTATE_DOORSTEP_COST, SHIPPING_ZONES } from "@/data/shipping";

export function calculateShipping({
	country,
	state,
	area,
	deliveryType,
}: {
	country?: string;
	state?: string;
	area?: string;
	deliveryType?: "pickup" | "doorstep";
}) {
	if (country && country !== "Nigeria") {
		// African countries
		if (AFRICAN_COUNTRIES.has(country)) {
			const african = SHIPPING_ZONES.find(
				(z) => z.area === "African Countries",
			);
			return african?.cost || 0;
		}

		// All other international
		const international = SHIPPING_ZONES.find(
			(z) => z.area === "International",
		);
		return international?.cost || 0;
	}

	// Nigeria but not Lagos → Inter-State
	if (country === "Nigeria" && state && state !== "Lagos") {
		if (deliveryType === "doorstep") return INTERSTATE_DOORSTEP_COST;
		const interstate = SHIPPING_ZONES.find((z) => z.area === "Inter-State");
		return interstate?.cost || 0;
	}

	// Lagos → match area to zone locations
	if (state === "Lagos" && area) {
		const zone = SHIPPING_ZONES.find((z) => z.locations.includes(area));
		return zone?.cost || 0;
	}

	return 0;
}

export const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-GB", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};
