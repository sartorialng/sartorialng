import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Shop All Bags | Sartorial – Premium Women's Bags in Nigeria",
	description:
		"Browse all premium bags and accessories at Sartorial. Shop mini bags, small bags, medium bags, and large bags for women in Nigeria.",
	alternates: { canonical: "/all-products" },
	openGraph: {
		title: "Shop All Bags – Sartorial Nigeria",
		description:
			"Browse our full collection of premium bags and accessories for women. Fast delivery across Nigeria.",
		url: "https://www.sartorial.ng/all-products",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
