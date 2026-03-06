import { ShoppingCart } from "lucide-react";
import { defineField, defineType } from "sanity";

const productType = defineType({
	name: "product",
	title: "Products",
	type: "document",
	icon: ShoppingCart,
	fields: [
		defineField({
			name: "name",
			title: "Product Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: {
				source: "name",
				maxLength: 96,
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "images",
			title: "Product Images",
			type: "array",
			of: [
				{
					type: "image",
					options: { hotspot: true },
					fields: [
						defineField({
							name: "alt",
							title: "Alt Text",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "color",
							title: "Associated Color",
							type: "reference",
							to: [{ type: "color" }],
							description:
								"Select the color this image represents",
						}),
					],
				},
			],
			validation: (Rule) => Rule.required().min(1),
		}),
		defineField({
			name: "description",
			title: "Description",
			type: "blockContent",
		}),
		defineField({
			name: "detailedDescription",
			title: "Detailed Description",
			type: "text",
			rows: 10,
			description:
				"Paste the full product description here with all details and bullet points",
		}),
		defineField({
			name: "onSale",
			title: "On Sale",
			type: "boolean",
			initialValue: false,
			description:
				"Toggle this to activate the sale price. Make sure Sale Price is set.",
		}),
		defineField({
			name: "price",
			title: "Price",
			type: "number",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "salePrice",
			title: "Sale Price",
			type: "number",
			description:
				"If set, this will be used as the active price during a sale. Leave empty when not on sale.",
			validation: (Rule) => Rule.positive(),
		}),
		defineField({
			name: "colors",
			title: "Available Colors",
			type: "array",
			of: [{ type: "reference", to: [{ type: "color" }] }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "categories",
			title: "Categories",
			type: "array",
			of: [{ type: "reference", to: [{ type: "category" }] }],
		}),
		defineField({
			name: "stock",
			title: "Stock",
			type: "number",
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "isBestSeller",
			title: "Best Seller",
			type: "boolean",
			initialValue: false,
			description: "Show in Best Sellers section",
		}),
		defineField({
			name: "isNewArrival",
			title: "New Arrival",
			type: "boolean",
			initialValue: false,
			description: "Show in New Arrivals section",
		}),
		defineField({
			name: "onPreSale",
			title: "Pre-Sale",
			type: "boolean",
			initialValue: false,
			description: "Show in Pre-Sale section",
		}),
	],
	preview: {
		select: {
			title: "name",
			media: "images.0",
			subtitle: "price",
		},
		prepare({ title, subtitle, media }) {
			return {
				title,
				subtitle: subtitle ? `₦${subtitle}` : "No price",
				media,
			};
		},
	},
});

export default productType;
