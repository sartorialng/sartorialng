type TikTokContent = {
	content_id: string;
	content_type: "product" | "product_group";
	content_name?: string;
	quantity?: number;
	price?: number;
};

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
	content_id?: string;
	content_name?: string;
	quantity?: number;
	contents?: TikTokContent[];
}) {
	const contents: TikTokContent[] | undefined =
		params.contents ??
		(params.content_id
			? [
					{
						content_id: params.content_id,
						content_type: "product",
						content_name: params.content_name,
						quantity: params.quantity ?? 1,
						price: params.value,
					},
				]
			: undefined);

	const event_id = crypto.randomUUID();

	if (typeof window !== "undefined" && window.ttq) {
		window.ttq.track(
			params.event_name,
			{
				value: params.value,
				currency: params.currency,
				content_type: "product",
				...(contents && { contents }),
			},
			{ event_id },
		);
	}

	await fetch("/api/tiktok-event", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ...params, contents, event_id }),
	});
}
