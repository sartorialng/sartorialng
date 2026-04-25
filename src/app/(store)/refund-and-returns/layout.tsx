import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Refund & Returns Policy | Sartorial",
	description:
		"Read Sartorial's refund and returns policy. We make returns easy so you can shop with confidence.",
	alternates: { canonical: "/refund-and-returns" },
	openGraph: {
		title: "Refund & Returns – Sartorial",
		description:
			"Sartorial's hassle-free refund and returns policy explained.",
		url: "https://www.sartorial.ng/refund-and-returns",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
