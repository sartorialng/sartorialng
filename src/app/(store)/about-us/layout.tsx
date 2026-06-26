import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About Us | Sartorial – Premium Bags for Women",
	description:
		"Learn about Sartorial, a premium online bag store for women that has served over 10,000 customers across five continents. Discover our story, values, and commitment to quality fashion.",
	alternates: { canonical: "/about-us" },
	openGraph: {
		title: "About Sartorial – Premium Bags for Women",
		description:
			"Discover the story behind Sartorial, a global destination for premium bags and accessories for women.",
		url: "https://www.sartorial.ng/about-us",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
