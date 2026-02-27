import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const PrivacyPolicy = () => {
	return (
		<div className="min-h-screen w-full bg-gray-50 flex flex-col">
			<Header />
			<main className="flex-1 w-full mt-10 md:mt-20 py-10 px-5 md:px-20">
				<div className=" bg-[#8EC09E45] text-sartorial-green p-6 md:p-8 rounded-sm leading-7">
					<h1 className="text-2xl md:text-3xl font-bold text-center tracking-wide">
						Privacy Policy
					</h1>

					<div className="flex justify-center mt-4 mb-10">
						<div className="text-sm md:text-base">
							Last updated (27/02/26)
						</div>
					</div>

					<p className="mb-8">
						Welcome to Sartorial.ng (“we,” “our,” “us”). Your
						privacy is important to us. This Privacy Policy explains
						how we collect, use, disclose, and protect your
						information when you visit or make a purchase from
						www.sartorial.ng.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						1. INFORMATION WE COLLECT
					</h2>

					<p className="mb-4">
						We may collect the following information when you use
						our website:
					</p>

					<ul className="list-disc pl-6 space-y-2 mb-6">
						<li>
							<span className="font-medium">
								Personal Information:
							</span>{" "}
							Name, email address, phone number, delivery address
						</li>
						<li>
							<span className="font-medium">
								Order Information:
							</span>{" "}
							Products purchased, transaction details
						</li>
						<li>
							<span className="font-medium">
								Payment Information:
							</span>{" "}
							Payments are processed securely via Paystack. We do
							not store your full card details.
						</li>
						<li>
							<span className="font-medium">Technical Data:</span>{" "}
							IP address, device type, browser type, pages
							visited, cookies
						</li>
					</ul>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						2. HOW WE USE YOUR INFORMATION
					</h2>

					<p className="mb-4">We use your information to:</p>

					<ul className="list-disc pl-6 space-y-2 mb-6">
						<li>Process and deliver your orders</li>
						<li>
							Communicate with you about your orders and inquiries
						</li>
						<li>Provide customer support</li>
						<li>
							Send updates and marketing (you can opt out anytime)
						</li>
						<li>Improve our website, products, and services</li>
						<li>Prevent fraud and ensure platform security</li>
						<li>
							Comply with legal and regulatory obligations in
							Nigeria
						</li>
					</ul>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						3. SHARING YOUR INFORMATION
					</h2>

					<p className="mb-4">
						We may share your information with trusted third parties
						only when necessary, including:
					</p>

					<ul className="list-disc pl-6 space-y-2 mb-6">
						<li>Payment processors (Paystack)</li>
						<li>Delivery and logistics partners</li>
						<li>Website hosting and analytics providers</li>
					</ul>

					<p className="mb-6">
						We do not sell your personal information to third
						parties.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						4. COOKIES
					</h2>

					<p className="mb-6">
						We use cookies and similar technologies to improve your
						browsing experience and understand how visitors use our
						site. You can disable cookies in your browser settings,
						but some features of the site may not function properly.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						5. DATA SECURITY
					</h2>

					<p className="mb-6">
						We take reasonable administrative and technical measures
						to protect your personal information. While we strive to
						use commercially acceptable means to protect your data,
						no online system is completely secure.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						6. YOUR RIGHTS
					</h2>

					<p className="mb-4">You have the right to:</p>

					<ul className="list-disc pl-6 space-y-2 mb-6">
						<li>
							Request access to the personal data we hold about
							you
						</li>
						<li>Request correction of inaccurate information</li>
						<li>
							Request deletion of your personal data (where
							legally permitted)
						</li>
						<li>Opt out of marketing communications at any time</li>
					</ul>

					<p className="mb-6">
						To make any request, please contact us at{" "}
						<a
							href="mailto:info@sartorial.ng"
							className="underline font-medium text-blue-500"
						>
							info@sartorial.ng
						</a>
					</p>

					{/* 7 */}
					<h2 className="font-semibold text-lg mt-10 mb-4">
						7. THIRD PARTY LINKS
					</h2>

					<p className="mb-6">
						Our website may contain links to third-party websites.
						We are not responsible for the privacy practices or
						content of those sites.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						8. CHANGES TO THIS PRIVACY POLICY
					</h2>

					<p className="mb-6">
						We may update this Privacy Policy occasionally. Any
						changes will be posted on this page with a revised “Last
						updated” date.
					</p>

					<h2 className="font-semibold text-lg mt-10 mb-4">
						9. CONTACT US
					</h2>

					<p className="mb-4">
						If you have any questions about this Privacy Policy,
						please contact us:
					</p>

					<div className="space-y-1">
						<p>Email: info@sartorial.ng</p>
						<p>Website: www.sartorial.ng</p>
						<p>Country: Nigeria</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
};

export default PrivacyPolicy;
