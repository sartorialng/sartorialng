import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms & Conditions | Sartorial",
	description:
		"Read Sartorial's terms and conditions governing the use of our website and services.",
	alternates: { canonical: "/terms-and-condition" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
