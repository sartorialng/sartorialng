"use client";

import {
	AboutUsSartorialIcon2,
	CEO,
	CustomerCentric,
	Elegance,
	Excellence,
	Innovation,
	Luxury,
	Sustainability,
	Trust,
	Authenticity,
	CEO3,
} from "@/assets";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 40 },
	show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeLeft: Variants = {
	hidden: { opacity: 0, x: -40 },
	show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeRight: Variants = {
	hidden: { opacity: 0, x: 40 },
	show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const stagger: Variants = {
	show: {
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const AboutUs = () => {
	return (
		<div className="h-auto w-full bg-gray-50">
			<Header />

			{/* HERO */}
			<motion.div
				variants={stagger}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				className="w-full flex flex-col md:flex-row items-center pt-25 pb-10 px-6 md:px-20 md:pt-30 bg-[radial-gradient(circle_at_center,#8EC09E_0%,#2C5B42_70%)]"
			>
				<motion.div
					variants={fadeLeft}
					className="w-full md:w-[60%] text-white space-y-6"
				>
					<h2 className="text-2xl md:text-3xl font-semibold tracking-wide">
						ABOUT SARTORIAL
					</h2>

					<p className="text-base md:text-lg leading-relaxed text-white/90">
						Founded in 2023, Sartorial designs refined bags, shoes,
						and accessories for modern women. With a focus on
						craftsmanship, functionality, and quiet luxury, the
						brand has served over 10,000 women across five
						continents.
					</p>

					<p className="text-base md:text-lg leading-relaxed text-white/90">
						Each design reflects a belief in quiet luxury where
						confidence is expressed through quality, not excess.
						This is not fashion made for the moment. It is design
						made to endure.
					</p>

					<p className="text-base md:text-lg leading-relaxed text-white/90">
						We believe what you carry should reflect who you are
						intentional, confident, and considered.
					</p>
				</motion.div>

				<motion.div
					variants={fadeRight}
					className="w-full md:w-[40%] flex justify-around items-center"
				>
					<Image
						src={AboutUsSartorialIcon2}
						alt="About Sartorial"
						className="w-full h-80 object-contain"
					/>
				</motion.div>
			</motion.div>

			{/* OUR STORY */}
			<motion.div
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				className="bg-sartorial-offWhite w-full flex flex-col md:flex-row items-center py-10 px-6 md:px-20 gap-10"
			>
				<motion.div variants={fadeLeft} className="w-full md:w-[50%]">
					<Image
						src={CEO}
						alt="CEO"
						className="w-full h-100 object-contain"
					/>
				</motion.div>

				<motion.div
					variants={fadeRight}
					className="w-full md:w-[50%] text-sartorial-green space-y-6"
				>
					<h2 className="text-2xl md:text-4xl font-bold tracking-wide">
						Our Story
					</h2>

					<p className="text-base md:text-lg leading-relaxed font-medium">
						Sartorial was created with intention to design pieces
						that are refined, functional, and enduring.
					</p>

					<p className="text-base md:text-lg leading-relaxed font-medium">
						Born in response to an industry driven by fast trends
						and excess, Sartorial takes a more considered approach.
						The brand was founded on the belief that style should
						last, both in form and in relevance.
					</p>

					<p className="text-base md:text-lg leading-relaxed font-medium">
						Rooted in contemporary culture and shaped by a global
						perspective, Sartorial represents a new standard of
						quiet luxury. One that values intention over excess and
						longevity over trends.
					</p>

					<p className="text-base md:text-lg leading-relaxed font-medium">
						Sartorial is not about owning more.
						<br />
						It is about owning better.
					</p>
				</motion.div>
			</motion.div>

			{/* CORE VALUES */}
			<div className="w-full py-20 px-6 md:px-20 bg-[linear-gradient(90deg,#2C5B42_0%,#162E21_50%,#2C5B42_100%)]">
				<motion.h2
					variants={fadeUp}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					className="text-white text-2xl md:text-4xl font-bold tracking-wide text-center"
				>
					Our Core Values
				</motion.h2>

				<div className="mt-10 md:mt-20 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-20 w-full">
					{[
						{ icon: Luxury, label: "Luxury" },
						{ icon: Elegance, label: "Elegance" },
						{ icon: Excellence, label: "Excellence" },
						{ icon: Authenticity, label: "Authenticity" },
						{ icon: Innovation, label: "Innovation" },
						{ icon: CustomerCentric, label: "Customer Centricity" },
						{ icon: Sustainability, label: "Sustainability" },
						{ icon: Trust, label: "Trust" },
					].map((item) => (
						<motion.div
							key={item.label}
							variants={fadeUp}
							initial="hidden"
							whileInView="show"
							viewport={{ once: true }}
							whileHover={{ scale: 1.05 }}
						>
							<div className="flex flex-col items-center gap-5">
								<div className="h-20 w-20 md:h-40 md:w-40 border rounded-full border-sartorial-lightGreen">
									<Image
										src={item.icon}
										alt={item.label}
										className="w-full object-contain"
									/>
								</div>
								<p className="text-center text-lg md:text-2xl text-white">
									{item.label}
								</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* MISSION & VISION */}
			<div className="bg-sartorial-offWhite w-full flex flex-col md:flex-row items-center py-10 px-6 md:px-20 gap-10">
				<motion.div
					variants={fadeUp}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					whileHover={{ y: -6 }}
					className="w-full md:w-1/2 bg-sartorial-lightGreen text-sartorial-green p-6 md:p-8 space-y-4 rounded-sm"
				>
					<h3 className="text-xl md:text-2xl font-semibold">
						Mission
					</h3>
					<p className="text-base md:text-lg leading-relaxed">
						To redefine everyday fashion by providing high-quality,
						stylish, and functional bags that seamlessly blend
						sophistication with practicality, helping individuals
						carry their world with confidence.
					</p>
				</motion.div>

				<motion.div
					variants={fadeUp}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true }}
					whileHover={{ y: -6 }}
					className="w-full md:w-1/2 bg-sartorial-lightGreen text-sartorial-green p-6 md:p-8 space-y-4 rounded-sm"
				>
					<h3 className="text-xl md:text-2xl font-semibold">
						Vision
					</h3>
					<p className="text-base md:text-lg leading-relaxed">
						To become a globally recognized brand that sets the
						standard for elegance, quality, and innovation in the
						bag and fashion industry, while inspiring people to
						express their individuality through style.
					</p>
				</motion.div>
			</div>

			{/* FOUNDER */}
			<motion.div
				initial="hidden"
				whileInView="show"
				viewport={{ once: true }}
				className="bg-sartorial-offWhite w-full flex flex-col md:flex-row items-center py-10 px-6 md:px-20 gap-10"
			>
				<motion.div
					variants={fadeLeft}
					className="w-full md:w-1/2 text-sartorial-green space-y-4"
				>
					<h3 className="text-xl md:text-2xl font-semibold">
						Meet the Founder
					</h3>
					<p className="text-base text-black md:text-lg leading-relaxed">
						Founded by Ms Chinagorom Evelyn Ukachukwu, Sartorial is
						guided by a vision of modern elegance grounded in
						craftsmanship and purpose.
					</p>
				</motion.div>

				<motion.div variants={fadeRight} className="w-full md:w-1/2">
					<Image
						src={CEO3}
						alt="CEO"
						className="w-full h-100 object-contain"
					/>
				</motion.div>
			</motion.div>

			<Footer />
		</div>
	);
};

export default AboutUs;
