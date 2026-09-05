import { GiftHeroVisual } from "@/assets";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const perks = ["Free ribboning", "Handwritten card", "Nationwide delivery"];

const GiftHero = () => {
	return (
		<section className="relative w-full overflow-hidden bg-[linear-gradient(135deg,#2F6146_0%,#24503A_100%)]">
			{/* Soft 520px blooms that sit behind the content, as in the design */}
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -top-60 -right-30 h-[520px] w-[520px] rounded-full bg-[#BFD8B8]/10"
			/>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-60 -left-40 h-[520px] w-[520px] rounded-full bg-[#BFD8B8]/10"
			/>

			<div className="relative mx-auto flex w-full max-w-300 flex-col items-center gap-12 px-6 py-14 md:px-10 md:py-20 lg:min-h-[590px] lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:px-12 xl:px-0">
				{/* Hero text */}
				<div className="w-full max-w-168.5">
					<p className="text-xs font-medium uppercase tracking-[0.25em] text-[#BFD8B8]/80">
						Sartorial Gift Boxes
					</p>

					<h1 className="mt-5 text-4xl font-extrabold leading-[1.06] text-white md:text-5xl lg:text-[56px]">
						Create a Gift Box{" "}
						<span className="block text-[#BFD8B8]">for someone you love.</span>
					</h1>

					<p className="mt-6 max-w-135 text-sm leading-[1.9] text-white/75 md:text-base">
						Whether it&apos;s for a friend, your girlfriend, your wife, your
						sister, your mum, or someone you simply want to celebrate choose
						from our collection and we&apos;ll fill a box with carefully
						selected pieces, beautifully packaged and ready to delight.
					</p>

					<Link
						href="#build-your-box"
						className="group mt-9 inline-flex items-center gap-2 rounded-lg bg-[#F4EFE3] py-4 pr-[18px] pl-[30px] text-sm font-bold text-sartorial-green transition-colors duration-300 hover:bg-white"
					>
						Create a Gift Box
						<ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
					</Link>

					<ul className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-white/70 md:text-sm">
						{perks.map((perk) => (
							<li
								key={perk}
								className="flex items-center gap-2 before:h-1 before:w-1 before:rounded-full before:bg-[#BFD8B8] before:content-['']"
							>
								{perk}
							</li>
						))}
					</ul>
				</div>

				{/* Hero visual */}
				<div className="w-full max-w-[420px] lg:max-w-[470px]">
					<Image
						src={GiftHeroVisual}
						alt="A red gift box wrapped with ribbon, from N45,000, rated 4.9, wrapped and ready with a handwritten card included"
						priority
						sizes="(min-width: 1024px) 470px, (min-width: 768px) 420px, 100vw"
						className="h-auto w-full"
					/>
				</div>
			</div>
		</section>
	);
};

export default GiftHero;
