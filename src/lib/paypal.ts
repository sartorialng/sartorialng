const base = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

export async function generateAccessToken() {
	try {
		const clientId = process.env.PAYPAL_CLIENT_ID;
		const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			throw new Error(
				"PayPal credentials are missing. Please check your environment variables.",
			);
		}

		const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
			"base64",
		);

		const response = await fetch(`${base}/v1/oauth2/token`, {
			method: "POST",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: "grant_type=client_credentials",
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(
				`Failed to generate PayPal access token: ${response.status} - ${error}`,
			);
		}

		const data = await response.json();
		return data.access_token;
	} catch (error) {
		console.error("Error generating PayPal access token:", error);
		throw error;
	}
}

export async function createOrder(amount: number) {
	try {
		const accessToken = await generateAccessToken();

		// Validate amount
		if (!amount || amount <= 0) {
			throw new Error("Invalid amount");
		}

		const response = await fetch(`${base}/v2/checkout/orders`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				intent: "CAPTURE",
				purchase_units: [
					{
						amount: {
							currency_code: "USD",
							value: amount.toFixed(2),
						},
					},
				],
			}),
		});

		console.log(response);

		if (!response.ok) {
			const error = await response.text();
			console.error("PayPal createOrder error:", error);
			throw new Error(
				`Failed to create PayPal order: ${response.status} - ${error}`,
			);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error creating PayPal order:", error);
		throw error;
	}
}

export async function captureOrder(orderID: string) {
	try {
		const accessToken = await generateAccessToken();

		if (!orderID) {
			throw new Error("Order ID is required");
		}

		const response = await fetch(
			`${base}/v2/checkout/orders/${orderID}/capture`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const error = await response.text();
			console.error("PayPal captureOrder error:", error);
			throw new Error(
				`Failed to capture PayPal order: ${response.status} - ${error}`,
			);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error capturing PayPal order:", error);
		throw error;
	}
}
