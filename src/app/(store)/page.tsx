import FloatingWhatsApp from "@/components/layout/FloatingWhatsapp";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import SalesModal from "@/components/modals/SalesModal";
import BestSellers from "@/components/sections/BestSellers";
import Hero from "@/components/sections/Hero";
import NewArrivals from "@/components/sections/NewArrivals";
import PreSale from "@/components/sections/PreSale";
import ReviewSlide from "@/components/sections/ReviewSlide";
import ShopByCategory from "@/components/sections/ShopByCategory";
import WhySartorial from "@/components/sections/WhySartorial";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
import { getNewArrivals } from "@/sanity/lib/product/getNewArrivals";
import { getPreSale } from "@/sanity/lib/product/getPreSales";
import { getAllReviews } from "@/sanity/lib/product/getReviews";
import { getSartorialBabes } from "@/sanity/lib/product/getSartorialBabes";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
	title: "Buy Premium Bags Online in Nigeria | Sartorial",
	description:
		"Sartorial is an online fashion store in Nigeria offering premium bags and accessories for women. Shop stylish handbags and more today.",
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
		images: [
			{
				url: "https://res.cloudinary.com/dkoi9zeli/image/upload/v1772530357/seo_mn0xjp.jpg",
				width: 1200,
				height: 630,
				alt: "Sartorial Premium Bags",
			},
		],
	},
	metadataBase: new URL("https://www.sartorial.ng"),
	alternates: {
		canonical: "/",
	},
};

export default async function Home() {
	const [bestSellers, newArrivals, reviews, babes, presale] =
		await Promise.all([
			getBestSellers(),
			getNewArrivals(),
			getAllReviews(),
			getSartorialBabes(),
			getPreSale(),
		]);

	return (
		<main className="h-auto w-full bg-sartorial-offWhite">
			<Script
				id="sartorial-structured-data"
				type="application/ld+json"
				strategy="afterInteractive"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "OnlineStore",
						name: "Sartorial",
						url: "https://www.sartorial.ng",
						logo: "https://res.cloudinary.com/dkoi9zeli/image/upload/v1770800367/sartorial_zn5q28.svg",
						description:
							"Premium bags and accessories for women in Nigeria.",
						address: {
							"@type": "PostalAddress",
							addressCountry: "NG",
						},
					}),
				}}
			/>
			<Header />
			<Hero />
			<WhySartorial />
			<BestSellers products={bestSellers} />
			<NewArrivals products={newArrivals} />
			<PreSale products={presale} />
			<ShopByCategory />
			<ReviewSlide reviews={reviews} babes={babes} />
			<Footer />
			<FloatingWhatsApp />
			<SalesModal />
		</main>
	);
}
