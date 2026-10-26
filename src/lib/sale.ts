"use client";
import { useEffect, useState } from "react";

/**
 * The current sale campaign. Dates come from env so the next sale is an env
 * change, not a code change. Both must be full ISO timestamps with an offset,
 * e.g. 2026-10-29T00:00:00+01:00 (midnight in Lagos).
 *
 * SALE_END_DATE (server-only, used for welcome coupons) should match
 * NEXT_PUBLIC_SALE_END_DATE.
 */
export const SALE_NAME = "Black Friday";

const parse = (value: string | undefined) => {
	const time = value ? new Date(value).getTime() : NaN;
	return isNaN(time) ? null : time;
};

export const SALE_STARTS_AT = parse(process.env.NEXT_PUBLIC_SALE_START_DATE);
export const SALE_ENDS_AT = parse(process.env.NEXT_PUBLIC_SALE_END_DATE);

/** "upcoming" before the start, "live" during, "off" otherwise or unconfigured. */
export type SalePhase = "upcoming" | "live" | "off";

export function getSalePhase(now = Date.now()): SalePhase {
	if (!SALE_ENDS_AT || now >= SALE_ENDS_AT) return "off";
	if (SALE_STARTS_AT && now < SALE_STARTS_AT) return "upcoming";
	return "live";
}

export type TimeLeft = {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
};

const ZERO: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function timeLeftUntil(target: number, now: number): TimeLeft {
	const difference = Math.max(0, target - now);
	return {
		days: Math.floor(difference / (1000 * 60 * 60 * 24)),
		hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
		minutes: Math.floor((difference / 1000 / 60) % 60),
		seconds: Math.floor((difference / 1000) % 60),
	};
}

/**
 * Ticks every second. Counts down to the start while upcoming, then to the
 * end while live, and flips phase on its own when either moment passes.
 * Starts as "off" so server and first client render match; the real phase
 * lands after mount, when `ready` turns true.
 */
export function useSaleCountdown() {
	const [state, setState] = useState<{
		phase: SalePhase;
		timeLeft: TimeLeft;
		ready: boolean;
	}>({ phase: "off", timeLeft: ZERO, ready: false });

	useEffect(() => {
		const tick = () => {
			const now = Date.now();
			const phase = getSalePhase(now);
			const target = phase === "upcoming" ? SALE_STARTS_AT : SALE_ENDS_AT;
			setState({
				ready: true,
				phase,
				timeLeft:
					phase === "off" || !target ? ZERO : timeLeftUntil(target, now),
			});
			return phase;
		};

		// "off" only ever means ended or unconfigured, so there is nothing to wait for.
		if (tick() === "off") return;
		const timer = setInterval(() => {
			if (tick() === "off") clearInterval(timer);
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	return state;
}

/** "29 Oct – 1 Nov", in Lagos time. */
export function formatSaleRange() {
	if (!SALE_STARTS_AT || !SALE_ENDS_AT) return "";
	const fmt = (time: number) =>
		new Date(time).toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			timeZone: "Africa/Lagos",
		});
	// The end is the midnight the sale closes at, so the last day is the one before.
	return `${fmt(SALE_STARTS_AT)} – ${fmt(SALE_ENDS_AT - 1)}`;
}

/** Downloads a calendar invite for the sale opening, so shoppers remind themselves. */
export function downloadSaleReminder() {
	if (!SALE_STARTS_AT || !SALE_ENDS_AT) return;
	const stamp = (time: number) =>
		new Date(time).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
	const ics = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Sartorial//Sale Reminder//EN",
		"BEGIN:VEVENT",
		`UID:sale-${SALE_STARTS_AT}@sartorial.ng`,
		`DTSTAMP:${stamp(Date.now())}`,
		`DTSTART:${stamp(SALE_STARTS_AT)}`,
		`DTEND:${stamp(SALE_ENDS_AT)}`,
		`SUMMARY:Sartorial ${SALE_NAME} Sale`,
		"DESCRIPTION:The Sartorial sale is live. Shop at https://www.sartorial.ng",
		"URL:https://www.sartorial.ng",
		"BEGIN:VALARM",
		"TRIGGER:-PT1H",
		"ACTION:DISPLAY",
		`DESCRIPTION:Sartorial ${SALE_NAME} starts in 1 hour`,
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR",
	].join("\r\n");

	const url = URL.createObjectURL(
		new Blob([ics], { type: "text/calendar;charset=utf-8" }),
	);
	const link = document.createElement("a");
	link.href = url;
	link.download = `sartorial-${SALE_NAME.toLowerCase().replace(/\s+/g, "-")}.ics`;
	link.click();
	URL.revokeObjectURL(url);
}

const DEFAULT_PITCH = {
	title: "Be the first to know",
	description:
		"Early access, promos, sales and discount codes, straight to your inbox and WhatsApp.",
};

/**
 * Headline for the mailing-list popup and footer. While a sale is upcoming
 * the existing popup becomes the sale teaser, instead of adding another one.
 */
export function useNewsletterPitch() {
	const { phase } = useSaleCountdown();
	if (phase !== "upcoming") return DEFAULT_PITCH;
	return {
		title: `${SALE_NAME} is coming`,
		description: `Our biggest sale runs ${formatSaleRange()}. Join the list for early access and first pick before it sells out.`,
	};
}
