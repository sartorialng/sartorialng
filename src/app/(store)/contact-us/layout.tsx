import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Contact Us | Sartorial",
	description:
		"Get in touch with Sartorial. Contact us for questions about orders, products, or any other enquiries.",
	alternates: { canonical: "/contact-us" },
	openGraph: {
		title: "Contact Sartorial",
		description:
			"Reach out to the Sartorial team for support, enquiries, or feedback.",
		url: "https://www.sartorial.ng/contact-us",
	},
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
