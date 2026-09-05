import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/sanity/lib/product/getProductBySlug";
import { getBestSellers } from "@/sanity/lib/product/getBestSellers";
import { isProductSoldOut } from "@/lib/stock";
// import { getAllProductSlugs } from "@/sanity/lib/product/getAllProductSlugs";
import ProductDetailsClient from "../ProductDetailsClient";

const BASE_URL = "https://www.sartorial.ng";

const SHIPPING_COUNTRY_CODES = {
	domestic: ["NG"],
	africa: ["GH", "KE", "ZA", "UG", "TZ", "RW", "SN", "CI", "CM", "EG", "MA", "TN", "DZ"],
	international: [
		"US", "CA", "GB", "IE", "FR", "DE", "NL", "BE", "IT", "ES", "PT", "SE",
		"NO", "CH", "AT", "DK", "FI", "AE", "SA", "QA", "KW", "IN", "PK", "BD",
		"LK", "CN", "JP", "KR", "AU", "NZ", "BR", "AR", "MX", "CO", "IL", "TR",
	],
};

const ALL_SHIPPING_COUNTRY_CODES = [
	...SHIPPING_COUNTRY_CODES.domestic,
	...SHIPPING_COUNTRY_CODES.africa,
	...SHIPPING_COUNTRY_CODES.international,
];

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
		title: `${product.name} | Buy Online – Sartorial`,
		description: `Shop the ${product.name} at Sartorial. Premium ${category.toLowerCase()} for women, with worldwide shipping.`,
		keywords: [
			product.name,
			category,
			"buy bags online",
			"premium women's bags",
			"worldwide shipping",
			"Sartorial",
		],
		alternates: {
			canonical: `/product/${slug}`,
		},
		openGraph: {
			title: `${product.name} – Sartorial`,
			description: `Shop the ${product.name}. Premium ${category.toLowerCase()} for women, shipped worldwide.`,
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
			description: `Shop the ${product.name} at Sartorial, with worldwide shipping.`,
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

	const offerPrice = product.onSale ? product.salePrice : product.price;
	const category = product.categories?.[0]?.name ?? "Bags";
	const productImages = (product.images ?? [])
		.map((image: { asset?: { url?: string } }) => image?.asset?.url)
		.filter(Boolean);

	const productDescription =
		product.detailedDescription?.trim() ||
		`Shop the ${product.name} at Sartorial. Premium ${category.toLowerCase()} for women, with worldwide shipping.`;

	const shippingDetails = [
		{
			"@type": "OfferShippingDetails",
			shippingRate: {
				"@type": "MonetaryAmount",
				currency: "NGN",
				minValue: 4500,
				maxValue: 9250,
			},
			shippingDestination: {
				"@type": "DefinedRegion",
				addressCountry: SHIPPING_COUNTRY_CODES.domestic,
			},
		},
		{
			"@type": "OfferShippingDetails",
			shippingRate: {
				"@type": "MonetaryAmount",
				currency: "NGN",
				value: 125000,
			},
			shippingDestination: {
				"@type": "DefinedRegion",
				addressCountry: SHIPPING_COUNTRY_CODES.africa,
			},
		},
		{
			"@type": "OfferShippingDetails",
			shippingRate: {
				"@type": "MonetaryAmount",
				currency: "NGN",
				value: 115000,
			},
			shippingDestination: {
				"@type": "DefinedRegion",
				addressCountry: SHIPPING_COUNTRY_CODES.international,
			},
		},
	];

	const returnPolicy = {
		"@type": "MerchantReturnPolicy",
		applicableCountry: ALL_SHIPPING_COUNTRY_CODES,
		returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
		merchantReturnDays: 2,
		returnMethod: "https://schema.org/ReturnByMail",
		returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
	};

	const productSchema = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: product.name,
		description: productDescription,
		image: productImages,
		sku: product._id,
		brand: {
			"@type": "Brand",
			name: "Sartorial",
		},
		offers: {
			"@type": "Offer",
			url: `${BASE_URL}/product/${slug}`,
			priceCurrency: "NGN",
			price: offerPrice,
			availability: !isProductSoldOut(product)
				? "https://schema.org/InStock"
				: "https://schema.org/OutOfStock",
			seller: {
				"@type": "Organization",
				name: "Sartorial",
			},
			shippingDetails,
			hasMerchantReturnPolicy: returnPolicy,
		},
	};

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
					__html: JSON.stringify(productSchema),
				}}
			/>
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
