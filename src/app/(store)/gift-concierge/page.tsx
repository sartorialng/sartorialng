import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import BecomeCreator from "@/components/sections/BecomeCreator";
import GiftGrid from "@/components/sections/GiftGrid";
import GiftHero from "@/components/sections/GiftHero";
import { getGifts } from "@/sanity/lib/product/getGifts";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Create a Gift Box | Sartorial Gift Concierge",
	description:
		"Build a Sartorial gift box for someone you love. Choose from our collection and we'll fill a box with carefully selected pieces, beautifully packaged with a handwritten card and nationwide delivery.",
	keywords: [
		"gift box Nigeria",
		"luxury gift box",
		"gift concierge",
		"curated gift box",
		"Sartorial gift box",
		"sartorial.ng",
	],
	openGraph: {
		title: "Create a Gift Box | Sartorial Gift Concierge",
		description:
			"Build a Sartorial gift box for someone you love — carefully selected pieces, beautifully packaged, delivered nationwide.",
		url: "https://www.sartorial.ng/gift-concierge",
	},
	alternates: {
		canonical: "/gift-concierge",
	},
};

const GiftConciergePage = async () => {
	const gifts = await getGifts();

	return (
		<div className="w-full">
			<Header />

			<main className="pt-23 md:pt-24">
				<GiftHero />
				<GiftGrid gifts={gifts} />
			</main>

			<BecomeCreator />
			<Footer />
		</div>
	);
};

export default GiftConciergePage;
