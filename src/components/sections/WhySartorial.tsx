"use client";
import { BusIcon, CustomerServiceIcon, StarCircleIcon } from "@/assets";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const cardVariants: Variants = {
	hidden: { opacity: 0, y: 30 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: "easeOut" },
	},
};

const WhySartorial = () => {
	const { ref, inView } = useInView({
		threshold: 0.3,
		triggerOnce: true,
	});

	const [hasCounted, setHasCounted] = useState(false);

	useEffect(() => {
		const countedBefore = sessionStorage.getItem("counterPlayed");

		if (countedBefore) {
			setHasCounted(true);
		}
	}, []);

	return (
		<div className="w-full md:mt-10 px-8 md:px-20 py-10">
			{/* Title */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.6 }}
				className="flex justify-center"
			>
				<p className="text-2xl font-semibold text-center md:text-4xl md:font-bold text-sartorial-green">
					Why Shop With Sartorial?
				</p>
			</motion.div>

			{/* Cards */}
			<motion.div
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5"
			>
				{[
					{
						icon: <StarCircleIcon />,
						title: "TRUSTED BY CUSTOMERS",
						desc: "Built on reliability and confidence from our customers.",
					},
					{
						icon: <CustomerServiceIcon />,
						title: "24/7 CUSTOMER SERVICE",
						desc: "Friendly 24/7 customer support",
					},
					{
						icon: <BusIcon />,
						title: "WARRANTY AND FAST DELIVERY",
						desc: "Free delivery for all orders over N200,000",
					},
				].map((item, i) => (
					<motion.div
						key={i}
						variants={cardVariants}
						whileHover={{ scale: 1.05, y: -5 }}
						className="border shadow-lg border-sartorial-green rounded-sm flex justify-around items-center p-4 md:p-5 cursor-pointer"
					>
						<div className="flex flex-col gap-2 items-center text-black">
							{item.icon}
							<p className="font-semibold text-lg text-center">
								{item.title}
							</p>
							<p className="text-sm text-center">{item.desc}</p>
						</div>
					</motion.div>
				))}
			</motion.div>

			{/* Stats Counter */}
			<motion.div
				ref={ref}
				initial={{ opacity: 0, y: 40, scale: 0.95 }}
				whileInView={{ opacity: 1, y: 0, scale: 1 }}
				viewport={{ once: true }}
				transition={{ duration: 0.7, ease: "easeOut" }}
				className="mt-10 flex justify-around items-center"
			>
				<div className="w-full md:w-1/2 border shadow-lg border-sartorial-green rounded-sm flex justify-around items-center p-5">
					<div className="flex flex-col gap-1 items-center text-black">
						{/* <p className="font-bold text-[50px] md:text-[64px] text-sartorial-green">
							{inView ? (
								<CountUp
									start={9500}
									end={10500}
									duration={2.5}
									separator=","
									suffix="+"
								/>
							) : (
								"9,500+"
							)}
						</p> */}
						<p className="font-bold text-[50px] md:text-[64px] text-sartorial-green">
							{inView && !hasCounted ? (
								<CountUp
									start={9500}
									end={10500}
									duration={2.5}
									separator=","
									suffix="+"
									onEnd={() => {
										sessionStorage.setItem(
											"counterPlayed",
											"true",
										);
										setHasCounted(true);
									}}
								/>
							) : (
								"10,500+"
							)}
						</p>
						<p className="text-base text-center">
							Bags Delivered Successfully
						</p>
						<span className="h-2 w-25 bg-sartorial-green rounded-2xl mt-2"></span>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default WhySartorial;
