import { client } from "@/sanity/lib/client";

const BASE_URL = "https://www.sartorial.ng";

const STATIC_PAGES = [
	{ url: "/", priority: 1.0, changeFrequency: "daily" },
	{ url: "/all-products", priority: 0.9, changeFrequency: "daily" },
	{ url: "/about-us", priority: 0.7, changeFrequency: "monthly" },
	{ url: "/contact-us", priority: 0.6, changeFrequency: "monthly" },
	{ url: "/faqs", priority: 0.5, changeFrequency: "monthly" },
	{ url: "/shipping-details", priority: 0.4, changeFrequency: "monthly" },
	{ url: "/refund-and-returns", priority: 0.4, changeFrequency: "monthly" },
	{ url: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
	{ url: "/terms-and-condition", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap() {
	const products = await client.fetch(
		`*[_type == "product"] { "slug": slug.current, _updatedAt }`,
		{},
		{ next: { revalidate: 3600 } },
	);

	const productUrls = products.map((product) => ({
		url: `${BASE_URL}/product/${product.slug}`,
		lastModified: new Date(product._updatedAt),
		changeFrequency: "weekly",
		priority: 0.9,
	}));

	const staticUrls = STATIC_PAGES.map((page) => ({
		url: `${BASE_URL}${page.url}`,
		lastModified: new Date(),
		changeFrequency: page.changeFrequency,
		priority: page.priority,
	}));

	return [...staticUrls, ...productUrls];
}
