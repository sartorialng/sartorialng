import { UsersIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";

const creatorApplicationType = defineType({
	name: "creatorApplication",
	title: "Creator Application",
	type: "document",
	icon: UsersIcon,
	fields: [
		defineField({
			name: "emailAddress",
			title: "Email Address",
			type: "string",
			validation: (Rule) => Rule.required().email(),
		}),
		defineField({
			name: "instagramHandle",
			title: "Instagram Handle",
			type: "string",
		}),
		defineField({
			name: "tiktokHandle",
			title: "TikTok Handle",
			type: "string",
		}),
		defineField({
			name: "status",
			title: "Status",
			type: "string",
			options: {
				list: [
					{ title: "Pending", value: "pending" },
					{ title: "Approved", value: "approved" },
					{ title: "Rejected", value: "rejected" },
				],
			},
			initialValue: "pending",
		}),
		defineField({
			name: "appliedAt",
			title: "Applied At",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "reviewedAt",
			title: "Reviewed At",
			type: "datetime",
			readOnly: true,
			description:
				"Set automatically when the application is approved or rejected.",
		}),
		defineField({
			name: "approvalEmailSentAt",
			title: "Approval Email Sent At",
			type: "datetime",
			readOnly: true,
			description:
				"Set when the welcome email is claimed, and cleared again if the send fails so it can be retried.",
		}),
	],
	preview: {
		select: {
			email: "emailAddress",
			status: "status",
			instagram: "instagramHandle",
			tiktok: "tiktokHandle",
		},
		prepare(select) {
			const handles = [select.instagram, select.tiktok]
				.filter(Boolean)
				.join(" · ");
			return {
				title: select.email,
				subtitle: `${select.status}${handles ? ` — ${handles}` : ""}`,
				media: UsersIcon,
			};
		},
	},
});

export default creatorApplicationType;
