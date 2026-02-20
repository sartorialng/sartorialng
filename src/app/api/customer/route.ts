// import { adminClient } from "@/sanity/lib/sanity.admin";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
// 	try {
// 		const body = await request.json();
// 		const { firstName, lastName, emailAddress, phoneNo, address } = body;

// 		if (!emailAddress) {
// 			return NextResponse.json(
// 				{ error: "Customer email are required" },
// 				{ status: 400 },
// 			);
// 		}

// 		const customer = await adminClient.create({
// 			_type: "customer",
// 			firstName: firstName || "",
// 			lastName: lastName || "",
// 			email: emailAddress,
// 			phone: phoneNo || "",
// 			address: address || "",
// 			createdAt: new Date().toISOString(),
// 		});

// 		return NextResponse.json(
// 			{
// 				success: true,
// 				message: "Customer created successfully",
// 				customerId: customer._id,
// 			},
// 			{ status: 201 },
// 		);
// 	} catch (error) {
// 		return NextResponse.json(
// 			{
// 				error: "Failed to create customer",
// 				details:
// 					error instanceof Error ? error.message : "Unknown error",
// 			},
// 			{ status: 500 },
// 		);
// 	}
// }

import { adminClient } from "@/sanity/lib/sanity.admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { firstName, lastName, emailAddress, phoneNo, address } = body;

		if (!emailAddress) {
			return NextResponse.json(
				{ error: "Customer email is required" },
				{ status: 400 },
			);
		}

		// 1. Check if a customer with this email already exists
		const existingCustomer = await adminClient.fetch(
			`*[_type == "customer" && email == $email][0]`,
			{ email: emailAddress },
		);

		if (existingCustomer) {
			return NextResponse.json(
				{
					success: true,
					message: "Customer already exists",
					customerId: existingCustomer._id,
				},
				{ status: 200 }, // Or 409 if you want to treat it as an error
			);
		}

		// 2. If no duplicate, create the new customer
		const customer = await adminClient.create({
			_type: "customer",
			firstName: firstName || "",
			lastName: lastName || "",
			email: emailAddress,
			phone: phoneNo || "",
			address: address || "",
			createdAt: new Date().toISOString(),
		});

		return NextResponse.json(
			{
				success: true,
				message: "Customer created successfully",
				customerId: customer._id,
			},
			{ status: 201 },
		);
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to process customer",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
