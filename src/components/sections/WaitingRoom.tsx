"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, RotateCw } from "lucide-react";
import {
	IgIcon,
	NewBrandLogo,
	SnapIcon,
	TikTokIcon,
	WhatsappIcon,
} from "@/assets";
import NewsletterForm from "@/components/form/NewsletterForm";
import {
	SALE_NAME,
	downloadSaleReminder,
	formatSaleRange,
	useSaleCountdown,
} from "@/lib/sale";

const SOCIALS = [
	{ href: "https://www.instagram.com/sartorialhq", label: "Instagram", Icon: IgIcon },
	{ href: "https://www.snapchat.com/add/sartobaby", label: "Snapchat", Icon: SnapIcon },
	{ href: "https://www.tiktok.com/@thesartorialstore", label: "TikTok", Icon: TikTokIcon },
	{ href: "https://wa.me/message/QH63ZFF2HQA3O1", label: "WhatsApp", Icon: WhatsappIcon },
];

/** Gives the server's clock a moment to agree the sale has started. */
const RELOAD_DELAY = 2000;

const TimeUnit = ({ value, label }: { value: number | null; label: string }) => (
	<div className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-white/80 px-2 py-4 shadow-sm ring-1 ring-sartorial-green/10 md:py-6">
		<span className="text-3xl font-bold leading-none text-sartorial-green tabular-nums md:text-5xl">
			{value === null ? "--" : value.toString().padStart(2, "0")}
		</span>
		<span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-sartorial-green/80 md:text-xs">
			{label}
		</span>
	</div>
);

/**
 * The whole site while the store is locked: the countdown, a reminder, and
 * the mailing list. When the countdown hits zero it reloads, and the visitor
 * lands on the page they originally asked for.
 */
const WaitingRoom = () => {
	const { phase, timeLeft, ready } = useSaleCountdown();
	const sawUpcoming = useRef(false);

	useEffect(() => {
		if (phase === "upcoming") {
			sawUpcoming.current = true;
			return;
		}
		// Only reload on the countdown actually finishing in front of the
		// visitor, so a skewed clock or a forced lock can't loop forever.
		if (!sawUpcoming.current) return;
		const timer = setTimeout(() => window.location.reload(), RELOAD_DELAY);
		return () => clearTimeout(timer);
	}, [phase]);

	const counting = !ready || phase === "upcoming";
	const show = (value: number) => (ready ? value : null);
	const range = formatSaleRange();

	return (
		<div className="flex min-h-svh flex-col bg-[radial-gradient(ellipse_at_top,_#d7eadc_0%,_#f4f9f5_45%,_#ffffff_80%)]">
			<main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 md:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-16">
				<section className="text-center lg:text-left">
					<Image
						src={NewBrandLogo}
						alt="Sartorial"
						className="mx-auto h-auto w-36 md:w-44 lg:mx-0"
						priority
					/>

					<p className="mt-10 inline-flex items-center gap-2 rounded-full bg-sartorial-green px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
						{SALE_NAME}
						{range && <span className="font-medium text-white/80">· {range}</span>}
					</p>

					{counting ? (
						<>
							<h1 className="mt-5 text-4xl font-light uppercase tracking-wide text-sartorial-green md:text-6xl">
								{SALE_NAME} starts in
							</h1>
							<div className="mt-8 flex gap-2 md:gap-4">
								<TimeUnit value={show(timeLeft.days)} label="Days" />
								<TimeUnit value={show(timeLeft.hours)} label="Hours" />
								<TimeUnit value={show(timeLeft.minutes)} label="Minutes" />
								<TimeUnit value={show(timeLeft.seconds)} label="Seconds" />
							</div>
							<p className="mt-8 text-base leading-relaxed text-gray-600 md:text-lg">
								Our store is closed while we get everything ready for{" "}
								{SALE_NAME}. Check back when the timer hits zero for our biggest
								sale of the year.
							</p>
							<button
								type="button"
								onClick={downloadSaleReminder}
								className="mt-6 inline-flex items-center gap-2 rounded-full border border-sartorial-green px-6 py-3 text-sm font-semibold text-sartorial-green transition-colors hover:bg-sartorial-green hover:text-white cursor-pointer"
							>
								<CalendarPlus className="h-4 w-4" />
								Remind me
							</button>
						</>
					) : (
						<>
							<h1 className="mt-5 text-4xl font-light uppercase tracking-wide text-sartorial-green md:text-6xl">
								Opening any moment now
							</h1>
							<p className="mt-6 text-base leading-relaxed text-gray-600 md:text-lg">
								We&apos;re putting the finishing touches on the store. Refresh in a
								moment to start shopping.
							</p>
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="mt-6 inline-flex items-center gap-2 rounded-full bg-sartorial-green px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sartorial-green/90 cursor-pointer"
							>
								<RotateCw className="h-4 w-4" />
								Refresh
							</button>
						</>
					)}
				</section>

				<section
					id="newsletter"
					className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 md:p-8"
				>
					<h2 className="text-xl font-semibold text-sartorial-green md:text-2xl">
						Get early access
					</h2>
					<p className="mt-2 mb-5 text-sm text-gray-500">
						Join the list for first pick and sale codes, straight to your inbox
						and WhatsApp before the doors open.
					</p>
					<NewsletterForm source="waiting-room" />
				</section>
			</main>

			<footer className="bg-sartorial-green px-4 py-4 text-white">
				<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs md:flex-row md:px-6">
					<p>© {new Date().getFullYear()} Sartorial. See you at the sale.</p>
					<div className="flex items-center gap-4">
						{SOCIALS.map(({ href, label, Icon }) => (
							<Link
								key={label}
								href={href}
								target="_blank"
								aria-label={label}
								className="hover:opacity-80 transition-opacity"
							>
								<Icon />
							</Link>
						))}
					</div>
				</div>
			</footer>
		</div>
	);
};

export default WaitingRoom;
