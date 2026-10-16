"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
	SALE_NAME,
	TimeLeft,
	formatSaleRange,
	useSaleCountdown,
} from "@/lib/sale";

/** How long each message stays up before the next one rolls in. */
const ROTATE_EVERY = 4000;

const pad = (value: number) => value.toString().padStart(2, "0");

/** Seconds only on wider screens, so the phone strip fits on one line. */
const formatTimeLeft = ({ days, hours, minutes, seconds }: TimeLeft) => (
	<>
		{days}d {pad(hours)}h {pad(minutes)}m
		<span className="hidden md:inline"> {pad(seconds)}s</span>
	</>
);

/**
 * Takes over the "Welcome to Sartorial!" line in the header strip while a sale
 * is upcoming or live, so the sale gets announced without another popup.
 * Rotates between the dates, a live countdown and a call to action.
 */
const SaleTicker = () => {
	const { phase, timeLeft } = useSaleCountdown();
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (phase === "off") return;
		const timer = setInterval(() => setIndex((i) => i + 1), ROTATE_EVERY);
		return () => clearInterval(timer);
	}, [phase]);

	if (phase === "off") {
		return <p className="text-sm font-medium">Welcome to Sartorial!</p>;
	}

	const messages =
		phase === "upcoming"
			? [
					{ text: `${SALE_NAME} · ${formatSaleRange()}`, href: "#newsletter" },
					{ text: <>Starts in {formatTimeLeft(timeLeft)}</>, href: "#newsletter" },
					{ text: "Early access: join the list →", href: "#newsletter" },
				]
			: [
					{ text: `${SALE_NAME} is live`, href: "/all-products" },
					{ text: <>Ends in {formatTimeLeft(timeLeft)}</>, href: "/all-products" },
					{ text: "Shop the sale →", href: "/all-products" },
				];
	const position = index % messages.length;
	const message = messages[position];

	return (
		<Link
			href={message.href}
			className="flex min-w-0 max-w-[calc(100%-8.5rem)] md:max-w-none items-center gap-2 text-xs md:text-sm font-medium hover:opacity-90"
			aria-live="off"
		>
			<span className="shrink-0 rounded-sm bg-black px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
				{phase === "upcoming" ? "Soon" : "Live"}
			</span>
			<span
				key={position}
				className="truncate tabular-nums motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500"
			>
				{message.text}
			</span>
		</Link>
	);
};

export default SaleTicker;
