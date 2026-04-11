export async function trackTikTokEvent(params: {
	event_name:
		| "Purchase"
		| "ViewContent"
		| "AddToCart"
		| "InitiateCheckout"
		| "CompletePayment";
	email?: string;
	phone?: string;
	url?: string;
	value?: number;
	currency?: string;
	order_id?: string;
}) {
	await fetch("/api/tiktok-event", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
}
