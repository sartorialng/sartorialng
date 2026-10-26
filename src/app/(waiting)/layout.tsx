import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
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
	title: "Sartorial – Black Friday is coming",
	description:
		"Sartorial's Black Friday sale is almost here. Join the list for early access.",
	robots: { index: false, follow: false },
};

/**
 * Its own root layout, so the waiting room shows none of the store's chrome
 * or popups. Pixels stay so ad traffic is still counted while the store is shut.
 */
export default function WaitingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body className={`${inter.variable} antialiased`}>
					{children}
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
