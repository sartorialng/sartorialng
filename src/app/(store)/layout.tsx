import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import PayPalProvider from "@/components/layout/PayPalProvider";
import { Suspense } from "react";
import FacebookPixel from "@/components/pixel/FacebookPixel";
import SnapPixel from "@/components/pixel/SnapPixel";
import TikTokPixel from "@/components/pixel/TikTokPixel";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://www.sartorial.ng"),
	title: "Sartorial – Premium Bags for Every Woman",
	description:
		"Shop premium bags and accessories for women on Sartorial. Quality styles delivered to your doorstep.",
	keywords: [
		"fashion store",
		"fashion bags",
		"online store",
		"buy bags online",
		"women fashion",
		"Sartorial",
		"sartorial.ng",
	],
	openGraph: {
		title: "Sartorial – Premium Bags for Every Woman",
		description:
			"Shop premium bags and accessories for women on Sartorial. Quality styles delivered to your doorstep.",
		url: "https://sartorial.ng",
		siteName: "Sartorial",
		images: [
			{
				url: "https://res.cloudinary.com/dkoi9zeli/image/upload/v1770062376/sartorial_bag_l4n0le.png",
				width: 1200,
				height: 630,
				alt: "Sartorial Fashion Store",
			},
		],
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Sartorial – Premium Fashion Store",
		description: "Premium Bags for Every Woman",
		images: [
			"https://res.cloudinary.com/dkoi9zeli/image/upload/v1770062376/sartorial_bag_l4n0le.png",
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider dynamic>
			<html lang="en" className="scroll-smooth">
				<body className={`${inter.variable} antialiased`}>
					<PayPalProvider>{children}</PayPalProvider>
					<Toaster position="top-right" richColors />
					<Suspense fallback={null}>
						<FacebookPixel />
						<SnapPixel />
						<TikTokPixel />
					</Suspense>
				</body>
			</html>
		</ClerkProvider>
	);
}
