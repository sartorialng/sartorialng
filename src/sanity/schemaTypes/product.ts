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
			name: "onCombo",
			title: "On Combo",
			type: "boolean",
			initialValue: false,
			description: "Toggle this to activate the combo",
		}),
		defineField({
			name: "freeGift",
			title: "Free Gift",
			type: "reference",
			to: [{ type: "product" }],
			description:
				"Optional. Pick a product to give away free with every unit of this item. It is added to the cart at ₦0 and cannot be removed on its own.",
		}),
		defineField({
			name: "discountValue",
			title: "Discount Value",
			type: "number",
			validation: (Rule) => Rule.positive(),
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
			description:
				"One row per colour. Give each colour its own stock count so it can sell out on its own.",
			type: "array",
			of: [
				{
					type: "object",
					name: "colorVariant",
					title: "Colour",
					fields: [
						defineField({
							name: "color",
							title: "Colour",
							type: "reference",
							to: [{ type: "color" }],
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "stock",
							title: "Stock for this colour",
							type: "number",
							description:
								"Leave blank to fall back to the product-level stock below.",
							validation: (Rule) => [
								Rule.min(0).integer(),
								Rule.custom((value) =>
									value === undefined || value === null
										? "Set a count so this colour can sell out on its own. Blank means it shares the product-level stock."
										: true,
								).warning(),
							],
						}),
					],
					preview: {
						select: { title: "color.title", stock: "stock" },
						prepare({ title, stock }) {
							const subtitle =
								typeof stock !== "number"
									? "Uses product-level stock"
									: stock <= 0
										? "Sold out"
										: `${stock} in stock`;
							return { title: title || "Colour not set", subtitle };
						},
					},
				},
			],
			validation: (Rule) =>
				Rule.required()
					.min(1)
					.custom((items) => {
						const refs = ((items as unknown[]) ?? [])
							.map((item) => {
								const entry = item as {
									color?: { _ref?: string };
									_ref?: string;
								};
								return entry?.color?._ref ?? entry?._ref;
							})
							.filter(Boolean);
						return new Set(refs).size === refs.length
							? true
							: "The same colour is listed more than once.";
					}),
		}),
		defineField({
			name: "categories",
			title: "Categories",
			type: "array",
			of: [{ type: "reference", to: [{ type: "category" }] }],
		}),
		defineField({
			name: "stock",
			title: "Stock (fallback)",
			type: "number",
			description:
				"Only used for colours above that have no stock of their own. Once every colour has a number, this can stay blank.",
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
			name: "isGift",
			title: "Gift Box",
			type: "boolean",
			initialValue: false,
			description:
				"Show in the Gift Concierge section. Gift boxes are hidden from the main shop listings.",
		}),
		defineField({
			name: "isRecommendedGift",
			title: "Recommended Gift",
			type: "boolean",
			initialValue: false,
			description:
				"Shows a 'Recommended' badge on this gift box. Only applies when Gift Box is on.",
		}),
		defineField({
			name: "onPreSale",
			title: "Pre-Sale",
			type: "boolean",
			initialValue: false,
			description: "Show in Pre-Sale section",
		}),
		defineField({
			name: "preSaleAvailability",
			title: "Pre Sale Available from",
			type: "datetime",
		}),
		defineField({
			name: "onPreOrder",
			title: "Pre-Order",
			type: "boolean",
			initialValue: false,
			description: "Show in Pre-Order section",
		}),
		defineField({
			name: "preOrderAvailability",
			title: "Pre Order Available from",
			type: "datetime",
		}),
		defineField({
			name: "isComingSoon",
			title: "Coming Soon",
			type: "boolean",
			initialValue: false,
			description:
				"Product is visible in all sections but cannot be purchased. A 'Coming Soon' overlay will appear on the image.",
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
