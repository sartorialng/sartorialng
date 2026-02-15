import { defineType, defineField } from "sanity";

const reviewType = defineType({
	name: "review",
	title: "Review",
	type: "document",
	fields: [
		defineField({
			name: "customerName",
			title: "Customer Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "rating",
			title: "Rating",
			type: "number",
			validation: (Rule) =>
				Rule.required()
					.min(1)
					.max(5)
					.integer()
					.error("Rating must be between 1 and 5"),
		}),
		defineField({
			name: "comment",
			title: "Comment",
			type: "text",
		}),
		defineField({
			name: "date",
			title: "Review Date",
			type: "datetime",
			initialValue: () => new Date().toISOString(),
		}),
		defineField({
			name: "isApproved",
			title: "Approved",
			type: "boolean",
			description: "Toggle to show/hide review on website",
			initialValue: false,
		}),
	],
	preview: {
		select: {
			title: "customerName",
			subtitle: "comment",
			rating: "rating",
		},
		prepare(selection) {
			const { title, subtitle, rating } = selection;
			const stars = "⭐".repeat(rating || 0);
			return {
				title: `${title} ${stars}`,
				subtitle: subtitle,
			};
		},
	},
});

export default reviewType;
