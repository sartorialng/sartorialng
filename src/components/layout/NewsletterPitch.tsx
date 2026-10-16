"use client";
import { useNewsletterPitch } from "@/lib/sale";

/** The footer mailing-list headline, which turns into the sale teaser before a sale. */
const NewsletterPitch = () => {
	const { title, description } = useNewsletterPitch();

	return (
		<>
			<p className="mt-2 text-2xl font-semibold md:text-3xl">{title}</p>
			<p className="mt-2 text-sm text-white/75 md:text-base">{description}</p>
		</>
	);
};

export default NewsletterPitch;
