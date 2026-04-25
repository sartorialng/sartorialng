import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy | Sartorial",
	description:
		"Read Sartorial's privacy policy to understand how we collect, use, and protect your personal data.",
	alternates: { canonical: "/privacy-policy" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
