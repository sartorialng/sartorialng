import { NextRequest, NextResponse } from "next/server";
import { normalisePhone, type NewsletterPayload } from "@/lib/newsletter";
import { sendNewsletterWelcomeEmail } from "@/lib/newsletterEmail";

const BREVO_API = "https://api.brevo.com/v3";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type BrevoContact = {
	email?: string;
	emailBlacklisted?: boolean;
	listIds?: number[];
};

function brevo(path: string, init?: RequestInit) {
	return fetch(`${BREVO_API}${path}`, {
		...init,
		headers: {
			"api-key": process.env.BREVO_API_KEY!,
			"Content-Type": "application/json",
			accept: "application/json",
			...init?.headers,
		},
		cache: "no-store",
	});
}

function splitName(body: NewsletterPayload) {
	if (body.firstName || body.lastName) {
		return {
			firstName: body.firstName?.trim() ?? "",
			lastName: body.lastName?.trim() ?? "",
		};
	}
	const [firstName = "", ...rest] = (body.fullName ?? "")
		.trim()
		.split(/\s+/);
	return { firstName, lastName: rest.join(" ") };
}

export async function POST(request: NextRequest) {
	const apiKey = process.env.BREVO_API_KEY;
	const listId = Number(process.env.BREVO_LIST_ID);

	if (!apiKey || !Number.isInteger(listId) || listId <= 0) {
		console.error("Newsletter: BREVO_API_KEY or BREVO_LIST_ID is not set");
		return NextResponse.json(
			{ error: "Subscriptions are unavailable right now." },
			{ status: 503 },
		);
	}

	let body: NewsletterPayload;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	// Bots fill every field, including the hidden one. Pretend it worked.
	if (body.company) {
		return NextResponse.json({ status: "subscribed" });
	}

	const email = body.email?.trim().toLowerCase();
	if (!email || !EMAIL_PATTERN.test(email)) {
		return NextResponse.json(
			{ error: "Please enter a valid email address." },
			{ status: 400 },
		);
	}

	const { firstName, lastName } = splitName(body);
	if (body.source !== "checkout" && !firstName) {
		return NextResponse.json(
			{ error: "Please enter your name." },
			{ status: 400 },
		);
	}

	// The popup and footer ask for WhatsApp explicitly, so a bad number is an
	// error there. Checkout's phone field accepts anything, so an unusable
	// number is just left off rather than blocking the subscription.
	const phone = normalisePhone(body.phone);
	if (body.source !== "checkout" && !phone) {
		return NextResponse.json(
			{
				error: "Please enter a valid WhatsApp number, e.g. 08012345678 or +447700900123.",
			},
			{ status: 400 },
		);
	}

	try {
		// Duplicate check: look the email up before creating anything.
		const existing = await brevo(
			`/contacts/${encodeURIComponent(email)}?identifierType=email_id`,
		);

		if (existing.ok) {
			const contact = (await existing.json()) as BrevoContact;
			const onList = contact.listIds?.includes(listId);

			if (onList && !contact.emailBlacklisted) {
				return NextResponse.json({ status: "already_subscribed" });
			}

			// Known contact who is off the list or unsubscribed earlier. Filling
			// in this form is a fresh opt-in, so add them back.
			const update = await brevo(
				`/contacts/${encodeURIComponent(email)}?identifierType=email_id`,
				{
					method: "PUT",
					body: JSON.stringify({
						listIds: [listId],
						emailBlacklisted: false,
					}),
				},
			);
			if (!update.ok) {
				throw new Error(
					`Brevo update failed (${update.status}): ${await update.text()}`,
				);
			}
			await sendNewsletterWelcomeEmail(email, firstName);
			return NextResponse.json({ status: "subscribed" });
		}

		if (existing.status !== 404) {
			throw new Error(
				`Brevo lookup failed (${existing.status}): ${await existing.text()}`,
			);
		}

		const attributes: Record<string, string> = {};
		if (firstName) attributes.FIRSTNAME = firstName;
		if (lastName) attributes.LASTNAME = lastName;

		const create = (withPhone: boolean) =>
			brevo("/contacts", {
				method: "POST",
				body: JSON.stringify({
					email,
					attributes: withPhone
						? { ...attributes, SMS: phone, WHATSAPP: phone }
						: attributes,
					listIds: [listId],
					updateEnabled: false,
				}),
			});

		let created = await create(Boolean(phone));

		// Brevo allows each phone number on only one contact. If another
		// contact already has it, still subscribe this email, just without it.
		if (!created.ok && phone) {
			const error = await created.json().catch(() => ({}));
			if (error?.code === "duplicate_parameter") {
				created = await create(false);
			} else {
				throw new Error(
					`Brevo create failed (${created.status}): ${JSON.stringify(error)}`,
				);
			}
		}

		if (!created.ok) {
			const error = await created.json().catch(() => ({}));
			// Created by a parallel request between our lookup and now.
			if (error?.code === "duplicate_parameter") {
				return NextResponse.json({ status: "already_subscribed" });
			}
			throw new Error(
				`Brevo create failed (${created.status}): ${JSON.stringify(error)}`,
			);
		}

		// Only new subscribers get here; sendEmail never throws, so a failed
		// welcome email is logged without undoing the subscription.
		await sendNewsletterWelcomeEmail(email, firstName);

		return NextResponse.json({ status: "subscribed" }, { status: 201 });
	} catch (error) {
		console.error("Newsletter subscription failed:", error);
		return NextResponse.json(
			{ error: "Could not subscribe right now. Please try again." },
			{ status: 502 },
		);
	}
}
