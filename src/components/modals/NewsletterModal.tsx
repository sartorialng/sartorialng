"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Percent, Sparkles, Tag, XCircle } from "lucide-react";
import { NewFooterBrandLogo } from "@/assets";
import NewsletterForm from "@/components/form/NewsletterForm";
import { isNewsletterSubscribed } from "@/lib/newsletter";
import {
	IG_NOTICE_DONE_EVENT,
	getIgNoticeDueAt,
} from "@/components/modals/InstagramNoticeModal";

/** Shown this long after the site loads. */
const SHOW_AFTER = 60 * 1000;
/** Breathing room between the IG notice closing and this one opening. */
const AFTER_IG_NOTICE = 30 * 1000;
/** How often to re-check while another popup (e.g. the IG notice) is open. */
const BUSY_RETRY = 15 * 1000;

/** Pages where an interruption would cost a sale or makes no sense. */
const HIDDEN_ON = ["/checkout", "/success", "/order-pending", "/account"];

const PERKS = [
	{ icon: Tag, label: "Early sale access" },
	{ icon: Percent, label: "Exclusive codes" },
	{ icon: Sparkles, label: "New arrivals first" },
];

function anotherDialogIsOpen() {
	return Boolean(
		document.querySelector('[role="dialog"][data-state="open"]'),
	);
}

/**
 * Shows once per page load, 1 minute in, never on top of the IG notice.
 * Closing it keeps it away until the page is refreshed or the visitor comes
 * back to the landing page. Nothing is stored except "subscribed", which hides
 * it for good.
 */
const NewsletterModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [dismissed, setDismissed] = useState(false);
	const mountedAt = useRef(0);
	// Set on close: the next showing counts its 1 minute from the return visit.
	const restartTimer = useRef(false);
	// When the IG notice was dealt with on this page load (0 = not yet).
	const [igDoneAt, setIgDoneAt] = useState(0);
	const pathname = usePathname();

	const hidden = HIDDEN_ON.some((path) => pathname?.startsWith(path));

	// The IG notice goes first, but only if it is due before our 1 minute is
	// up. Otherwise (already followed, or it showed recently and is still on
	// its 5-minute break) it counts as done and we keep our own schedule.
	useEffect(() => {
		mountedAt.current = Date.now();
		if (getIgNoticeDueAt() > mountedAt.current + SHOW_AFTER) {
			setIgDoneAt(mountedAt.current - AFTER_IG_NOTICE);
		}
		const onDone = () => setIgDoneAt(Date.now());
		window.addEventListener(IG_NOTICE_DONE_EVENT, onDone);
		return () => window.removeEventListener(IG_NOTICE_DONE_EVENT, onDone);
	}, []);

	// Coming back to the landing page counts as a fresh visit.
	const [lastPathname, setLastPathname] = useState(pathname);
	if (pathname !== lastPathname) {
		setLastPathname(pathname);
		if (pathname === "/") setDismissed(false);
	}

	useEffect(() => {
		if (
			isOpen ||
			dismissed ||
			hidden ||
			!igDoneAt ||
			isNewsletterSubscribed()
		)
			return;

		if (restartTimer.current) {
			restartTimer.current = false;
			mountedAt.current = Date.now();
		}

		let timer: ReturnType<typeof setTimeout>;

		const tryOpen = () => {
			if (isNewsletterSubscribed()) return;
			// Never stack on top of the IG notice or any other dialog.
			if (anotherDialogIsOpen()) {
				timer = setTimeout(tryOpen, BUSY_RETRY);
				return;
			}
			setIsOpen(true);
		};

		const showAt = Math.max(
			mountedAt.current + SHOW_AFTER,
			igDoneAt + AFTER_IG_NOTICE,
		);
		const wait = showAt - Date.now();
		timer = setTimeout(tryOpen, Math.max(0, wait));

		return () => clearTimeout(timer);
	}, [isOpen, dismissed, hidden, igDoneAt]);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			setDismissed(true);
			restartTimer.current = true;
		}
		setIsOpen(open);
	};

	return (
		<Dialog open={isOpen && !hidden} onOpenChange={handleOpenChange}>
			<DialogContent
				className="no-scrollbar w-[95%] sm:max-w-105 max-h-[90vh] overflow-y-auto rounded-3xl border-none p-0 gap-0"
				showCloseButton={false}
			>
				<div className="relative overflow-hidden bg-sartorial-green px-6 pt-6 pb-5 text-white">
					{/* Soft decorative rings */}
					<span className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full border border-white/10" />
					<span className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full border border-white/10" />
					<span className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-white/5" />

					<DialogClose className="absolute z-10 cursor-pointer right-3 top-3 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 focus:outline-none">
						<XCircle className="h-6 w-6 text-white" />
						<span className="sr-only">Close</span>
					</DialogClose>

					<DialogHeader className="relative items-center gap-2 text-center">
						<Image
							src={NewFooterBrandLogo}
							width={197}
							height={50}
							alt="Sartorial"
							className="h-auto w-28"
						/>
						<p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/70">
							The Sartorial List
						</p>
						<DialogTitle className="text-center text-xl sm:text-2xl font-semibold text-white">
							Be the first to know
						</DialogTitle>
						<DialogDescription className="text-center text-sm leading-relaxed text-white/80">
							Early access, promos, sales and discount codes, straight to your
							inbox and WhatsApp.
						</DialogDescription>
					</DialogHeader>

					<ul className="relative mt-4 flex flex-wrap justify-center gap-2">
						{PERKS.map(({ icon: Icon, label }) => (
							<li
								key={label}
								className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white"
							>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</li>
						))}
					</ul>
				</div>

				<div className="px-6 pt-4 pb-5">
					<NewsletterForm
						source="popup"
						variant="popup"
						onSubscribed={() => setIsOpen(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default NewsletterModal;
