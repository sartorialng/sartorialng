// import { ReactNode } from "react";

// type FAQProps = {
// 	id: number;
// 	question: string;
// 	answer: ReactNode;
// 	active?: number | undefined;
// };

// const faqList: FAQProps[] = [
// 	{
// 		id: 1,
// 		question: "Do Sartorial offer nationwide delivery?",
// 		answer: (
// 			<>
// 				Yes, we offer nationwide delivery across Nigeria. Orders are
// 				delivered to all major cities and towns through our trusted
// 				logistics partners.
// 			</>
// 		),
// 	},
// 	{
// 		id: 2,
// 		question: "How long does delivery take?",
// 		answer: (
// 			<>
// 				Delivery typically takes between 2–5 business days, depending on
// 				your location. Orders within major cities may arrive sooner,
// 				while remote areas may take slightly longer.
// 			</>
// 		),
// 	},
// 	{
// 		id: 3,
// 		question: "Can I pay on delivery?",
// 		answer: <> No we do not offer payment on delivery</>,
// 	},
// 	{
// 		id: 4,
// 		question: "Can I return or exchange a bag?",
// 		answer: (
// 			<>
// 				We offer only exchange within 24hrs in Lagos and 48hrs
// 				interstate. Product must be in good condition as received.
// 			</>
// 		),
// 	},
// 	{
// 		id: 5,
// 		question: "What materials are Sartorial bags made from?",
// 		answer: (
// 			<>
// 				Sartorial bags are made from premium leather and high-quality
// 				hardware, carefully selected to ensure durability, structure,
// 				and timeless style. Each bag is designed to be both functional
// 				and elegant for everyday use.
// 			</>
// 		),
// 	},
// 	{
// 		id: 6,
// 		question: "Are sartorial bags original?",
// 		answer: (
// 			<>
// 				Yes. All Sartorial bags are original designs created by our
// 				brand. Each piece is carefully developed to reflect our
// 				commitment to quality, functionality, and timeless style.
// 			</>
// 		),
// 	},
// 	{
// 		id: 7,
// 		question: "Do Sartorial offer wholesale or bulk purchases?",
// 		answer: (
// 			<>
// 				Yes we do. Contact our support centre for more information
// 				+2349169871900
// 			</>
// 		),
// 	},
// 	{
// 		id: 8,
// 		question: "Do you offer refunds?",
// 		answer: (
// 			<>
// 				We do not offer refunds at the moment. However, exchanges may be
// 				considered for items returned in their original condition within
// 				a specified timeframe. Please see purchase terms and conditions
// 				for more information.
// 			</>
// 		),
// 	},
// 	{
// 		id: 9,
// 		question: "How can I contact customer support?",
// 		answer: <>+2349169871900 info@sartorial.ng</>,
// 	},
// 	{
// 		id: 10,
// 		question: "Are the products photo accurate?",
// 		answer: (
// 			<>
// 				Yes. They are accurate and specifically measured by our factory
// 				experts
// 			</>
// 		),
// 	},
// 	{
// 		id: 11,
// 		question: "Do you offer custom or personalized bags?",
// 		answer: (
// 			<>
// 				Currently, Sartorial bags are available only in our existing
// 				designs and collections. Custom or personalised orders are
// 				available on request for bulk purchases for special occasions
// 			</>
// 		),
// 	},
// ];

// export default faqList;

import Link from "next/link";
import { ReactNode } from "react";

type FAQProps = {
	id: number;
	question: string;
	answer: ReactNode;
	active?: number | undefined;
};

const faqList: FAQProps[] = [
	{
		id: 1,
		question: "Do Sartorial offer nationwide delivery?",
		answer: (
			<>
				Yes, we offer nationwide delivery across Nigeria. Orders are
				delivered to all major cities and towns through our trusted
				logistics partners.
			</>
		),
	},
	{
		id: 12,
		question: "Do you ship internationally?",
		answer: (
			<>
				Yes. Sartorial ships worldwide. We deliver across Africa and
				internationally via <strong>DHL</strong>, with shipping costs
				calculated at checkout based on your destination.
			</>
		),
	},
	{
		id: 2,
		question: "How long does delivery take?",
		answer: (
			<>
				Delivery typically takes between{" "}
				<strong>2 - 5 business days</strong>, depending on your
				location. Orders within major cities may arrive sooner, while
				remote areas may take slightly longer.
			</>
		),
	},
	{
		id: 3,
		question: "Can I pay on delivery?",
		answer: <>No, we currently do not offer payment on delivery.</>,
	},
	{
		id: 4,
		question: "Can I return or exchange a bag?",
		answer: (
			<>
				We offer <strong>exchanges only</strong>. Requests must be made
				within <strong>24 hours for Lagos orders</strong> and{" "}
				<strong>48 hours for interstate orders</strong>. The product
				must be returned in the same condition it was received.
			</>
		),
	},
	{
		id: 5,
		question: "What materials are Sartorial bags made from?",
		answer: (
			<>
				Sartorial bags are made from <strong>premium leather</strong>{" "}
				and high-quality hardware, carefully selected to ensure
				durability, structure, and timeless style. Each bag is designed
				to be both functional and elegant for everyday use.
			</>
		),
	},
	{
		id: 6,
		question: "Are Sartorial bags original?",
		answer: (
			<>
				Yes. All Sartorial bags are <strong>original designs</strong>{" "}
				created by our brand. Each piece is carefully developed to
				reflect our commitment to quality, functionality, and timeless
				style.
			</>
		),
	},
	{
		id: 7,
		question: "Do Sartorial offer wholesale or bulk purchases?",
		answer: (
			<>
				Yes, we do. Please contact our support team for more information
				or inquiries: <a href="tel:+2349169871900">+234 916 987 1900</a>
				.
			</>
		),
	},
	{
		id: 8,
		question: "Do you offer refunds?",
		answer: (
			<>
				We currently do not offer refunds. However, exchanges may be
				considered for items returned in their original condition within
				the specified timeframe.
				<br />
				Please review our{" "}
				<Link
					href="/terms-and-condition"
					className="text-blue-500 hover:underline"
				>
					terms & conditions
				</Link>{" "}
				and{" "}
				<Link
					href="/refund-and-returns"
					className="text-blue-500 hover:underline"
				>
					refund & return policy
				</Link>{" "}
				for more details.
			</>
		),
	},
	{
		id: 9,
		question: "How can I contact customer support?",
		answer: (
			<>
				You can reach our customer support team via phone or email:
				<br />
				<a href="tel:+2349169871900">+234 916 987 1900</a>
				<br />
				<Link href="mailto:info@sartorial.ng">info@sartorial.ng</Link>
			</>
		),
	},
	{
		id: 10,
		question: "Are the products photo accurate?",
		answer: (
			<>
				Yes. Our product photos are carefully captured and the
				dimensions are verified by our factory experts to ensure they
				accurately represent the final product.
			</>
		),
	},
	{
		id: 11,
		question: "Do you offer custom or personalized bags?",
		answer: (
			<>
				Currently, Sartorial bags are available only in our existing
				designs and collections. However, Custom or personalised orders
				are available on request for bulk purchases for special
				occasions.
			</>
		),
	},
];

export default faqList;
