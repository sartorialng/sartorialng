import { Users } from "lucide-react";
import { defineField, defineType } from "sanity";

const sartorialBabesType = defineType({
	name: "sartorialBabe",
	title: "Sartorial Babes",
	type: "document",
	icon: Users,
	initialValue: {
		name: "Sartorial Babe",
	},
	fields: [
		defineField({
			name: "name",
			title: "Babe Name / Description",
			type: "string",
			description: "Internal name for this entry (e.g. Summer Look 1)",
		}),
		defineField({
			name: "image",
			title: "Babe Photo",
			type: "image",
			options: {
				hotspot: true,
			},
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: {
			title: "name",
			media: "image",
		},
		prepare(selection) {
			const { title, media } = selection;
			return {
				title: title || "Sartorial Babe",
				media: media,
			};
		},
	},
});

export default sartorialBabesType;
