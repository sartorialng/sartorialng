import { ShoppingCart } from "lucide-react";
import { defineField, defineType } from "sanity";

/**
 * A combo's own colours and stock are legacy: it is sold as its component
 * products, each picked in its own colour, and stock comes off those. The
 * fields stay on the type so existing documents keep their data (colour
 * filtering on listing pages still reads it), but they are hidden on combos so
 * nobody maintains a number that no longer decides anything.
 */
const isComboDoc = (document: unknown) =>
	Array.isArray((document as { comboItems?: unknown[] } | null)?.comboItems) &&
	((document as { comboItems: unknown[] }).comboItems?.length ?? 0) >= 2;

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
			name: "freeShipping",
			title: "Free Shipping",
			type: "boolean",
			initialValue: false,
			description:
				"Toggle on to ship the whole order free whenever this product is in the basket.",
		}),
		defineField({
			name: "comboItems",
			title: "Combo Items",
			type: "array",
			description:
				"The products this combo is made of. Two or more makes it a combo: the customer picks a colour for each, and stock comes off each product's own count. Leave empty for a normal product.",
			of: [
				{
					type: "object",
					name: "comboItem",
					title: "Combo Item",
					fields: [
						defineField({
							name: "product",
							title: "Product",
							type: "reference",
							to: [{ type: "product" }],
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "quantity",
							title: "Units per combo",
							type: "number",
							initialValue: 1,
							description:
								"Leave at 1 unless one combo contains more than one of this product. This is not a stock count — stock always comes off the product’s own colour count.",
							validation: (Rule) => Rule.min(1).integer(),
						}),
						defineField({
							name: "colorOptions",
							title: "Limit colours (optional)",
							type: "array",
							of: [
								{
									type: "reference",
									to: [{ type: "color" }],
								},
							],
							description:
								"Leave empty to offer every colour this product has. Add colours here to offer only those in this combo.",
						}),
					],
					preview: {
						select: {
							name: "product.name",
							quantity: "quantity",
							limited: "colorOptions",
						},
						prepare({ name, quantity, limited }) {
							const count = Array.isArray(limited)
								? limited.length
								: 0;
							return {
								title: name
									? `${name}${quantity > 1 ? ` x ${quantity}` : ""}`
									: "Product not set",
								subtitle: count
									? `${count} colour${count === 1 ? "" : "s"} offered`
									: "All colours offered",
							};
						},
					},
				},
			],
			validation: (Rule) =>
				Rule.custom((items) => {
					const rows = (items as unknown[]) ?? [];
					if (rows.length === 1) {
						return "A combo needs at least two products. Remove this row, or add another.";
					}
					const refs = rows
						.map(
							(row) =>
								(row as { product?: { _ref?: string } })?.product
									?._ref,
						)
						.filter(Boolean);
					return new Set(refs).size === refs.length
						? true
						: "The same product is listed twice.";
				}),
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
			hidden: ({ document }) => isComboDoc(document),
			validation: (Rule) =>
				Rule.custom((items, context) => {
					const rows = (items as unknown[]) ?? [];

					// A combo is sold as its component products, so it needs no
					// colours of its own. Everything else still does.
					if (!isComboDoc(context.document) && rows.length < 1) {
						return "Add at least one colour.";
					}

					const refs = rows
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
			hidden: ({ document }) => isComboDoc(document),
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
