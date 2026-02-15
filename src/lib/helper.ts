import { SHIPPING_ZONES } from "@/data/shipping";

export function calculateShipping({
	country,
	state,
	area,
}: {
	country?: string;
	state?: string;
	area?: string;
}) {
	// International
	if (country && country !== "Nigeria") {
		const international = SHIPPING_ZONES.find(
			(z) => z.area === "International",
		);
		return international?.cost || 0;
	}

	// Nigeria but not Lagos → Inter-State
	if (country === "Nigeria" && state && state !== "Lagos") {
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
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};
