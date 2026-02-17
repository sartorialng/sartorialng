export async function getUSDExchangeRate(): Promise<number> {
	const API_KEY = "543f7290cc4bc619e6bd19a1";
	const URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`;

	try {
		const response = await fetch(URL, {
			next: {
				revalidate: 86400,
				tags: ["exchange-rate"],
			},
		});

		if (!response.ok) throw new Error("Failed to fetch exchange rate");

		const data = await response.json();

		// 1 USD = X NGN
		const rate = data.conversion_rates.NGN;
		return rate || 1500;
	} catch (error) {
		console.error("Exchange Rate Fetch Error:", error);
		return 1500;
	}
}
