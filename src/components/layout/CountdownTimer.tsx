import { useEffect, useState } from "react";

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
	<div className="flex flex-col items-center px-1 md:px-4">
		<span className="text-xs md:text-base font-bold text-sartorial-green leading-none">
			{value.toString().padStart(2, "0")}
		</span>
		<span className="text-[8px] md:text-xs font-medium text-sartorial-green mt-2 tracking-widest uppercase">
			{label}
		</span>
	</div>
);

const CountdownTimer = () => {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		const targetDate = new Date("2026-03-30T00:00:00").getTime();

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const difference = targetDate - now;

			if (difference <= 0) {
				clearInterval(timer);
				return;
			}

			setTimeLeft({
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
				minutes: Math.floor((difference / 1000 / 60) % 60),
				seconds: Math.floor((difference / 1000) % 60),
			});
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	return (
		<div className="top-26 right-2 md:right-3 absolute w-auto mx-auto py-1 px-1 md:py-4 opacity-80 md:opacity-90 bg-white rounded-sm md:rounded-lg shadow-sm border border-gray-50 z-30">
			<h3 className="text-center text-xs md:text-base text-sartorial-green font-medium mb-2 md:mb-4 text-wrap">
				Sartorial Easter Event Starts in
			</h3>
			<div className="flex justify-center items-center divide-x divide-gray-100 mb-1">
				<TimeUnit value={timeLeft.days} label="Days" />
				<TimeUnit value={timeLeft.hours} label="Hours" />
				<TimeUnit value={timeLeft.minutes} label="Minutes" />
				<TimeUnit value={timeLeft.seconds} label="Seconds" />
			</div>
		</div>
	);
};

export default CountdownTimer;
