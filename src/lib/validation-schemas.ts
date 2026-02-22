import * as yup from "yup";

export const billingSchema = yup.object().shape({
	firstName: yup.string().trim().required("First name is required"),
	lastName: yup.string().trim().required("Last name is required"),
	address: yup.string().trim().required("Street address is required"),
	country: yup.string().trim().required("Country is required"),
	state: yup.string().trim(),
	apartment: yup.string().trim(),
	area: yup.string().trim(),
	postalCode: yup.string().trim(),
	phoneNo: yup.string().trim().required("Phone number is required"),
	secondaryPhoneNo: yup
		.string()
		.trim()
		.required("Secondary phone number is required"),
	emailAddress: yup
		.string()
		.email("Invalid email")
		.required("Email is required"),
	saveInfo: yup.boolean(),
	shipToDifferentAddress: yup.boolean(),
	receiverFirstName: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) => schema.required("Receiver's first name is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
	receiverLastName: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) => schema.required("Receiver's last name is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
	shippingAddress: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) => schema.required("Receiver's address is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
	shippingCountry: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) => schema.required("Country is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
	shippingState: yup.string().trim(),
	shippingArea: yup.string().trim(),
	shippingPhoneNo: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) =>
			schema.required("Receiver's phone number is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
	shippingSecondaryPhoneNo: yup.string().when("shipToDifferentAddress", {
		is: true,
		then: (schema) =>
			schema.required("Receiver's secondary phone number is required"),
		otherwise: (schema) => schema.notRequired(),
	}),
});

export const joinSartorialSchema = yup.object().shape({
	fullName: yup.string().required("Full name is required"),
	emailAddress: yup
		.string()
		.email("Invalid email address")
		.required("Email is required"),
	phoneNo: yup.string().required("Phone number is required"),
});

export const contactUsSchema = yup.object().shape({
	fullName: yup.string().required("Full name is required"),
	emailAddress: yup
		.string()
		.email("Invalid email address")
		.required("Email is required"),
	phoneNo: yup.string().required("Phone number is required"),
	message: yup.string().required("Message is required"),
});
