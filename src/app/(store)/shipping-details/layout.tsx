import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Shipping Information | Sartorial",
	description:
		"Learn about Sartorial's shipping policy. Fast and reliable delivery of premium bags across Nigeria.",
	alternates: { canonical: "/shipping-details" },
	openGraph: {
		title: "Shipping Information – Sartorial",
		description:
			"Everything you need to know about shipping and delivery at Sartorial Nigeria.",
		url: "https://www.sartorial.ng/shipping-details",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
