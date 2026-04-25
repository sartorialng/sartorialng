import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "FAQs | Sartorial – Frequently Asked Questions",
	description:
		"Find answers to frequently asked questions about Sartorial — shipping, returns, payments, and more.",
	alternates: { canonical: "/faqs" },
	openGraph: {
		title: "FAQs – Sartorial",
		description:
			"Got questions? Find answers about shipping, returns, payments, and more at Sartorial.",
		url: "https://www.sartorial.ng/faqs",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
