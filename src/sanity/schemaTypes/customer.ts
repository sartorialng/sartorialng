import { defineType, defineField } from "sanity";

const customerType = defineType({
	name: "customer",
	title: "Customer",
	type: "document",
	fields: [
		defineField({
			name: "firstName",
			title: "First Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "lastName",
			title: "Last Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "email",
			title: "Email",
			type: "string",
			validation: (Rule) => Rule.required().email(),
		}),
		defineField({
			name: "phone",
			title: "Phone Number",
			type: "string",
		}),
		defineField({
			name: "secondaryPhone",
			title: "Secondary Phone Number",
			type: "string",
		}),
		defineField({
			name: "address",
			title: "Address",
			type: "text",
			rows: 3,
		}),
		defineField({
			name: "createdAt",
			title: "Created At",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: {
			fname: "firstName",
			lname: "lastName",
			date: "createdAt",
		},
		prepare(selection) {
			const { fname, lname, date } = selection;
			const formattedDate = date
				? new Date(date).toLocaleDateString()
				: "No date";

			return {
				title: `${fname} ${lname}`,
				subtitle: `Joined: ${formattedDate}`,
			};
		},
	},
});

export default customerType;
