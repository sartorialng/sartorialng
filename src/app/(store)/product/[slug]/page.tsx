import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/sanity/lib/product/getProductBySlug";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
// import { getAllProductSlugs } from "@/sanity/lib/product/getAllProductSlugs";
import ProductDetailsClient from "../ProductDetailsClient";

const BASE_URL = "https://www.sartorial.ng";

// export const revalidate = 3600;

// export async function generateStaticParams() {
// 	const slugs = await getAllProductSlugs();
// 	return slugs.map((s) => ({ slug: s.slug }));
// }

interface PageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const product = await getProductBySlug(slug);

	if (!product) return { title: "Product Not Found" };

	const imageUrl = product.images?.[0]?.asset?.url || "";
	const category = product.categories?.[0]?.name ?? "Bags";

	return {
		title: `${product.name} | Buy Online in Nigeria – Sartorial`,
		description: `Shop the ${product.name} at Sartorial. Premium ${category.toLowerCase()} for women in Nigeria. Fast delivery nationwide.`,
		keywords: [
			product.name,
			category,
			"buy bags online Nigeria",
			"women bags Nigeria",
			"Sartorial",
		],
		alternates: {
			canonical: `/product/${slug}`,
		},
		openGraph: {
			title: `${product.name} – Sartorial`,
			description: `Shop the ${product.name}. Premium ${category.toLowerCase()} for women in Nigeria.`,
			url: `${BASE_URL}/product/${slug}`,
			type: "website",
			images: imageUrl
				? [
						{
							url: imageUrl,
							width: 800,
							height: 800,
							alt: product.name,
						},
					]
				: [],
		},
		twitter: {
			card: "summary_large_image",
			title: `${product.name} – Sartorial`,
			description: `Shop the ${product.name} at Sartorial Nigeria.`,
			images: imageUrl ? [imageUrl] : [],
		},
	};
}

export default async function ProductPage({ params }: PageProps) {
	const { slug } = await params;

	const [product, relatedProducts] = await Promise.all([
		getProductBySlug(slug),
		getBestSellers(),
	]);

	if (!product) notFound();

	const breadcrumbSchema = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: BASE_URL,
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "All Products",
				item: `${BASE_URL}/all-products`,
			},
			{
				"@type": "ListItem",
				position: 3,
				name: product.name,
				item: `${BASE_URL}/product/${slug}`,
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbSchema),
				}}
			/>
			<ProductDetailsClient
				initialProduct={product}
				initialRelated={relatedProducts}
			/>
		</>
	);
}
