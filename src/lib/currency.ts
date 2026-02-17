/**
 * Convert Nigerian Naira to US Dollars
 * @param amountInNGN - Amount in Nigerian Naira
 * @returns Amount in US Dollars (rounded to 2 decimal places)
 */
export function convertNGNtoUSD(amountInNGN: number): number {
	// Update this rate regularly or use a live API
	const exchangeRate = 1500;

	const usdAmount = amountInNGN / exchangeRate;

	// Round to 2 decimal places for currency
	return Number(usdAmount.toFixed(2));
}

/**
 * Format currency for display
 */
export function formatCurrency(
	amount: number,
	currency: "NGN" | "USD",
): string {
	if (currency === "NGN") {
		return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	} else {
		return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
}

/**
 * Get current exchange rate (placeholder - integrate with live API later)
 */
export async function getExchangeRate(): Promise<number> {
	// TODO: Integrate with a live exchange rate API like:
	// - exchangerate-api.com
	// - currencyapi.com
	// - openexchangerates.org

	// For now, return static rate
	return 1650;
}
