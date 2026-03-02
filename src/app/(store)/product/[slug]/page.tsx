import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/sanity/lib/product/getProductBySlug";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
import ProductDetailsClient from "../ProductDetailsClient";

interface PageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const product = await getProductBySlug(slug);

	if (!product) return { title: "Product Not Found" };

	return {
		title: `${product.name} - Buy Online | Sartorial`,
		description: `Shop the ${product.name} at Sartorial. Premium bags and accessories in Nigeria.`,
		openGraph: {
			images: [product.images?.[0]?.asset?.url || ""],
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

	return (
		<ProductDetailsClient
			initialProduct={product}
			initialRelated={relatedProducts}
		/>
	);
}
