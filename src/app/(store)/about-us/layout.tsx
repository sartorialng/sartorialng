import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About Us | Sartorial – Premium Bags for Women in Nigeria",
	description:
		"Learn about Sartorial, Nigeria's premium online bag store for women. Discover our story, values, and commitment to quality fashion.",
	alternates: { canonical: "/about-us" },
	openGraph: {
		title: "About Sartorial – Premium Bags for Women in Nigeria",
		description:
			"Discover the story behind Sartorial, Nigeria's destination for premium bags and accessories for women.",
		url: "https://www.sartorial.ng/about-us",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
