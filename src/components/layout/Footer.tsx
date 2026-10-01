import {
	IgIcon,
	LocationIcon,
	MailIcon,
	NewFooterBrandLogo,
	PhoneIcon,
	SnapIcon,
	TikTokIcon,
	WhatsappIcon,
} from "@/assets";
import NewsletterForm from "@/components/form/NewsletterForm";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
	return (
		<div className="w-full px-10 md:px-20 pt-10 pb-5 bg-sartorial-green">
			{/* Mailing list band */}
			<div className="mb-12 rounded-3xl border border-white/15 bg-white/5 px-6 py-8 text-white md:px-10 md:py-10">
				<div className="grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:gap-12">
					<div>
						<p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/60">
							The Sartorial List
						</p>
						<p className="mt-2 text-2xl font-semibold md:text-3xl">
							Be the first to know
						</p>
						<p className="mt-2 text-sm text-white/75 md:text-base">
							Early access, promos, sales and discount codes,
							straight to your inbox and WhatsApp.
						</p>
					</div>
					<NewsletterForm source="footer" variant="footer" />
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-20">
				<div className="">
					<Image
						src={NewFooterBrandLogo}
						width={197}
						height={50}
						alt="sartorial-footer"
						className="w-40 h-auto md:w-50"
					/>

					<div className="ml-5 mt-10 text-white flex flex-col gap-4">
						<div className="flex items-center gap-3">
							<PhoneIcon />
							<p>+234 916 987 0900</p>
						</div>
						<div className="flex items-center gap-3">
							<WhatsappIcon />
							<p>+234 916 987 1900</p>
						</div>
						<div className="flex items-center gap-3">
							<MailIcon />
							<p>info@sartorial.ng</p>
						</div>
						<div className="flex items-center gap-3">
							<LocationIcon />
							<p>Lagos, Nigeria</p>
						</div>
					</div>
				</div>
				<div className="mt-4 md:mt-8 text-white">
					<p className="font-semibold text-2xl">Help</p>

					<div className="mt-3 text-white flex flex-col gap-4">
						<Link href={"/contact-us"}>Contact Us</Link>
						<Link href={"/shipping-details"}>Shipping details</Link>
						<Link href={"/refund-and-returns"}>Refund & Returns</Link>
					</div>
				</div>
				<div className="mt-4 md:mt-8 text-white">
					<p className="font-semibold text-2xl">Our Company</p>

					<div className="mt-3 text-white flex flex-col gap-4">
						<Link href={"/about-us"}>About Us</Link>
						<Link href={"/faqs"}>FAQs</Link>
						<Link href={"/terms-and-condition"}>Terms & Conditions</Link>
						<Link href={"/privacy-policy"}>Privacy Policy</Link>{" "}
					</div>
				</div>
				<div className="mt-4 md:mt-8 text-white">
					<p className="font-semibold text-2xl">Connect with Us</p>

					<div className="mt-3 text-white flex flex-col gap-4">
						<Link
							href={"https://www.instagram.com/sartorialhq"}
							target="_blank"
							className="hover:opacity-80 transition-opacity flex items-center gap-3"
						>
							<IgIcon />
							<p>Instagram</p>
						</Link>
						<Link
							href={"https://www.tiktok.com/@thesartorialstore"}
							target="_blank"
							className="hover:opacity-80 transition-opacity not-last:flex items-center gap-3"
						>
							<TikTokIcon />
							<p>TikTok</p>
						</Link>
						<Link
							href="https://www.snapchat.com/add/sartobaby"
							target="_blank"
							className="hover:opacity-80 transition-opacity flex items-center gap-3"
						>
							<SnapIcon />
							<p>Snapchat</p>
						</Link>
						<Link
							href="https://wa.me/message/QH63ZFF2HQA3O1"
							target="_blank"
							className="hover:opacity-80 transition-opacity flex items-center gap-3"
						>
							<WhatsappIcon />
							<p>WhatsApp</p>
						</Link>
					</div>
				</div>
			</div>
			<div className="mt-10 text-white flex flex-col gap-4 items-center">
				<span className="bg-gray-500 h-0.5 w-full"></span>
				<p className="text-sm">© 2026 Sartorial. All rights reserved.</p>
			</div>
		</div>
	);
};

export default Footer;
