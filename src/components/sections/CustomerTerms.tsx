/**
 * The "General Customer" terms, shared by the Terms & Conditions page and the
 * checkout terms popup so the two can never say different things. Edit the
 * wording here.
 */
type CustomerTermsProps = {
	/** The bank-transfer payment terms. The checkout popup leaves them out,
	 * because customers there pay by card through Paystack or PayPal. */
	includePaymentTerms?: boolean;
};

const CustomerTerms = ({ includePaymentTerms = true }: CustomerTermsProps) => {
	let number = 0;
	const next = () => ++number;

	return (
		<div className="space-y-6">
			<section>
				<h2 className="text-xl font-bold mb-2">General Customer</h2>
				<p className="mb-4">
					We appreciate your interest in Sartorial bags. Please take a
					moment to review the following important information
					regarding our policies. Our commitment to customer
					satisfaction is paramount, and we take pride in the quality
					of our products.
				</p>
				<p className="font-bold">Please note that ALL SALES ARE FINAL!</p>
				<p className="mt-4">
					Please familiarize yourself with these terms and conditions
					of trade, as they are essential to your understanding of
					what Sartorial represents and how we strive to keep our
					brand quality protected.
				</p>
			</section>

			<section>
				<h3 className="font-bold uppercase mb-2">
					{next()}. Quality Assurance
				</h3>
				<p>
					Each bag we offer is one-of-a-kind, and slight variations
					may occur. When we describe a bag with a specific color,
					size, or material, a slight variation in appearance will not
					be considered a defect, especially for products with such
					unique characteristics. We encourage you to understand your
					selection thoroughly before placing an order.
				</p>
			</section>

			{includePaymentTerms && (
				<section>
					<h3 className="font-bold uppercase mb-2">
						{next()}. Payment Terms
					</h3>
					<p className="mb-4">
						All payments are required to be made in full into the
						following account:
					</p>
					<ul className="list-none space-y-1 ml-2">
						<li>
							<strong>Account Number:</strong> 0871252257
						</li>
						<li>
							<strong>Account Name:</strong> Sartorial
						</li>
						<li>
							<strong>Bank:</strong> Guaranty Trust Bank
						</li>
					</ul>
					<p className="mt-4">
						For proof of payment, please use this WhatsApp number:{" "}
						<strong>+2349169871900</strong>. We accept payments in
						Naira, Dollars, Pounds, and Euros through our secure
						payment channels. Once payment is received and
						confirmed, you will be prompted to provide accurate
						delivery information for your orders.
					</p>
				</section>
			)}

			<section>
				<h3 className="font-bold uppercase mb-2">
					{next()}. Refund and Exchange Policy
				</h3>

				<div className="mb-4">
					<p>
						<strong>Exchanges:</strong> We are happy to offer
						exchanges for all orders within 24 hours for customers
						in Lagos. For customers in other states and countries,
						we can only offer exchange requests if we are contacted
						within 48 hours of receiving the product. The product
						must be in good condition as received. To initiate an
						exchange, please contact our customer service team with
						your order details.
					</p>
				</div>

				<div className="mb-6">
					<p>
						<strong>Returns:</strong> We do not accept returns
						unless the product delivered to you is incorrect,
						damaged, or significantly different from your order. If
						you experience any issues with your order, please reach
						out to us within the specified time frames for
						exchange/return for prompt resolution.
					</p>
				</div>

				<p className="italic">
					Thank you for choosing Sartorial. We look forward to
					providing you with exceptional bags, fashion items, and
					great customer service as always.
				</p>
			</section>
		</div>
	);
};

export default CustomerTerms;
