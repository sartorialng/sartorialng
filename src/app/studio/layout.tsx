import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Buy Premium Bags Online in Nigeria | Sartorial",
	description:
		"Sartorial is an online fashion store in Nigeria offering premium bags and accessories for women. Shop stylish handbags and more today.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
