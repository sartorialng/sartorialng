import { defineType, defineField } from "sanity";

const couponType = defineType({
	name: "coupon",
	title: "Coupon",
	type: "document",
	fields: [
		defineField({
			name: "code",
			title: "Code",
			type: "string",
			validation: (Rule) => Rule.required().uppercase(),
		}),
		defineField({
			name: "discountType",
			title: "Discount Type",
			type: "string",
			options: {
				list: [
					{ title: "Percentage", value: "percentage" },
					{ title: "Fixed Amount", value: "fixed" },
				],
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "discountValue",
			title: "Discount Value",
			type: "number",
			validation: (Rule) => Rule.required().positive(),
		}),
		defineField({
			name: "isActive",
			title: "Active",
			type: "boolean",
			initialValue: true,
		}),
		defineField({
			name: "expiresAt",
			title: "Expires At",
			type: "datetime",
		}),
		defineField({
			name: "usageLimit",
			title: "Usage Limit",
			type: "number",
			description: "Leave empty for unlimited usage",
			validation: (Rule) => Rule.min(1),
		}),
		defineField({
			name: "usedCount",
			title: "Used Count",
			type: "number",
			initialValue: 0,
			validation: (Rule) => Rule.min(0),
		}),
		defineField({
			name: "assignedTo",
			title: "Assigned To (Email)",
			type: "string",
			validation: (Rule) => Rule.email(),
		}),
		{
			name: "redeemedBy",
			title: "Redeemed By (Emails)",
			type: "array",
			of: [{ type: "string" }],
		},
	],
	preview: {
		select: {
			code: "code",
			type: "discountType",
			value: "discountValue",
			active: "isActive",
		},
		prepare(selection) {
			const { code, type, value, active } = selection;

			const discountLabel =
				type === "percentage" ? `${value}% off` : `₦${value} off`;

			return {
				title: code || "Untitled Coupon",
				subtitle: `${discountLabel} • ${
					active ? "Active" : "Inactive"
				}`,
			};
		},
	},
});

export default couponType;
