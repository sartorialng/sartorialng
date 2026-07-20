"use client";
import { useCallback, useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Instagram, XCircle } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "sartorial_ig_notice_followed";
const LAST_SHOWN_KEY = "sartorial_ig_notice_last_shown";
const NEW_IG_HANDLE = "@sartorialhq";
const NEW_IG_URL = "https://www.instagram.com/sartorialhq";
const REOPEN_INTERVAL = 5 * 60 * 1000;

const InstagramNoticeModal = () => {
	const [isOpen, setIsOpen] = useState(false);

	const hasFollowed = useCallback(() => {
		if (typeof window === "undefined") return false;
		return window.localStorage.getItem(STORAGE_KEY) === "true";
	}, []);

	const getLastShown = useCallback(() => {
		if (typeof window === "undefined") return 0;
		const stored = Number(window.localStorage.getItem(LAST_SHOWN_KEY));
		return Number.isFinite(stored) ? stored : 0;
	}, []);

	const markShown = useCallback(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
	}, []);

	useEffect(() => {
		if (isOpen || hasFollowed()) return;

		const elapsed = Date.now() - getLastShown();
		const delay = Math.max(0, REOPEN_INTERVAL - elapsed);

		const timer = setTimeout(() => {
			if (hasFollowed()) return;
			markShown();
			setIsOpen(true);
		}, delay);

		return () => clearTimeout(timer);
	}, [isOpen, hasFollowed, getLastShown, markShown]);

	const handleOpenChange = (open: boolean) => {
		if (!open) markShown();
		setIsOpen(open);
	};

	const handleFollowClick = () => {
		if (typeof window !== "undefined") {
			window.localStorage.setItem(STORAGE_KEY, "true");
		}
		setIsOpen(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className="no-scrollbar w-[95%] sm:max-w-105 max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8"
				showCloseButton={false}
			>
				<DialogClose className="absolute cursor-pointer right-4 top-4 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
					<XCircle className="h-7 w-7 text-sartorial-green" />
					<span className="sr-only">Close</span>
				</DialogClose>

				<DialogHeader className="items-center space-y-3">
					<span className="flex h-14 w-14 items-center justify-center rounded-full bg-sartorial-green/10">
						<Instagram className="h-7 w-7 text-sartorial-green" />
					</span>
					<DialogTitle className="text-xl sm:text-2xl font-bold text-red-500 text-center">
						Important Notice
					</DialogTitle>
				</DialogHeader>

				<DialogDescription asChild>
					<div className="space-y-3 text-center text-sm text-sartorial-green/90 leading-relaxed">
						<p>
							Our official Instagram account was recently disabled
							after growing to over 9,000 followers. We are actively
							working with Instagram to restore the account as
							quickly as possible.
						</p>
						<p>
							In the meantime, we&apos;d love for you to stay
							connected with us on our new official Instagram page.
						</p>
						<p>
							Thank you for your patience, continued support, and
							for being part of the Sartorial community. We look
							forward to welcoming you back to our original account
							soon.
						</p>
					</div>
				</DialogDescription>

				<Button
					asChild
					className="mt-1 h-12 w-full rounded-3xl bg-sartorial-green text-base font-medium text-white hover:bg-sartorial-green/90"
				>
					<Link
						href={NEW_IG_URL}
						target="_blank"
						rel="noopener noreferrer"
						onClick={handleFollowClick}
					>
						<Instagram className="h-5 w-5" />
						Follow {NEW_IG_HANDLE}
					</Link>
				</Button>
			</DialogContent>
		</Dialog>
	);
};

export default InstagramNoticeModal;
