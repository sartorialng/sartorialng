import { Tag } from "lucide-react";
import { defineField, defineType } from "sanity";

const categoryType = defineType({
	name: "category",
	title: "Category",
	type: "document",
	icon: Tag,
	fields: [
		defineField({
			name: "title",
			title: "Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: {
				source: "title",
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "menuLabel",
			title: "Menu Label",
			type: "string",
			description:
				"Optional shorter name for the navbar dropdown. Falls back to the Title if left empty (e.g. Title \"Hand Bags\" with Menu Label \"Bags\").",
		}),
		defineField({
			name: "description",
			title: "Description",
			type: "text",
		}),
		defineField({
			name: "image",
			title: "Image",
			type: "image",
			description:
				"Shown in the 'Shop by Category' section on the homepage. Cropped to a circle, so set the hotspot on the part that must stay visible.",
			options: {
				hotspot: true,
			},
			fields: [
				defineField({
					name: "alt",
					title: "Alt Text",
					type: "string",
				}),
			],
		}),
		defineField({
			name: "showOnHomepage",
			title: "Show on Homepage",
			type: "boolean",
			description:
				"Show this category in the 'Shop by Category' section and the navbar dropdown. Turning this off hides it from the storefront but keeps it available as a product filter.",
			initialValue: false,
		}),
		defineField({
			name: "comingSoon",
			title: "Coming Soon",
			type: "boolean",
			description:
				"Shows a 'Coming Soon' badge and makes the category non-clickable, for categories with no products yet.",
			initialValue: false,
		}),
		defineField({
			name: "displayOrder",
			title: "Display Order",
			type: "number",
			description:
				"Controls the order categories appear in. Lower numbers come first. Categories without a number are sorted alphabetically at the end.",
		}),
	],
	orderings: [
		{
			title: "Display Order",
			name: "displayOrderAsc",
			by: [
				{ field: "displayOrder", direction: "asc" },
				{ field: "title", direction: "asc" },
			],
		},
	],
	preview: {
		select: {
			title: "title",
			subtitle: "description",
			media: "image",
			showOnHomepage: "showOnHomepage",
			comingSoon: "comingSoon",
		},
		prepare({ title, subtitle, media, showOnHomepage, comingSoon }) {
			const badges = [
				showOnHomepage ? "Homepage" : null,
				comingSoon ? "Coming Soon" : null,
			].filter(Boolean);

			return {
				title,
				subtitle: badges.length
					? `${badges.join(" · ")}${subtitle ? ` — ${subtitle}` : ""}`
					: subtitle,
				media,
			};
		},
	},
});

export default categoryType;
