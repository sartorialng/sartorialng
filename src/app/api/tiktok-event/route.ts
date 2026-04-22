import { NextRequest, NextResponse } from "next/server";

const PIXEL_ID = "D7BNJBRC77UEG1PVDHOG";
const ACCESS_TOKEN = "b5cd025bd7e70cde6806cf1770935a446670994e";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const { event_name, email, phone, url, value, currency, order_id, contents } = body;

	const payload = {
		pixel_code: PIXEL_ID,
		event_source: "web",
		// test_event_code: "TEST123",
		events: [
			{
				event: event_name,
				event_id: crypto.randomUUID(),
				timestamp: Math.floor(Date.now() / 1000),

				context: {
					page: { url: url || "" },
					user: {
						email: email ? await hashValue(email) : undefined,
						phone_number: phone
							? await hashValue(phone)
							: undefined,
					},
					ip: req.headers.get("x-forwarded-for") || "",
					user_agent: req.headers.get("user-agent") || "",
				},

				properties: {
					value: value || 0,
					currency: currency || "NGN",
					content_type: "product",
					order_id: order_id || undefined,
					...(contents && { contents }),
				},
			},
		],
	};

	const response = await fetch(
		"https://business-api.tiktok.com/open_api/v1.3/event/track/",
		{
			method: "POST",
			headers: {
				"Access-Token": ACCESS_TOKEN,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		},
	);

	const data = await response.json();
	return NextResponse.json(data);
}

async function hashValue(value: string): Promise<string> {
	const encoded = new TextEncoder().encode(value.trim().toLowerCase());
	const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
