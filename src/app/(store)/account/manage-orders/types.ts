export type OrderProduct = {
	quantity: number;
	selectedColor?: { colorId: string; colorTitle: string };
	product: {
		name: string;
		price: number;
		images?: { asset: { url: string }; alt: string }[];
	};
};

export type ShippingAddress = {
	address?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	phone?: string;
	secondaryPhone?: string;
};

export type Order = {
	_id: string;
	orderNumber: string;
	paymentMethod?: string;
	paystackReference?: string;
	paypalOrderId?: string;
	orderDate: string;
	customerName: string;
	email: string;
	status: string;
	totalPrice: number;
	currency: string;
	amountDiscount?: number;
	clerkUserId?: string;
	products: OrderProduct[];
	shippingAddress?: ShippingAddress;
	shippingCost?: number;
	vat?: number;
	subtotal?: number;
	orderNote?: string;
};

export const STATUS_STYLES: Record<string, string> = {
	pending: "bg-amber-100 text-amber-800 border-amber-200",
	paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
	shipped: "bg-blue-100 text-blue-800 border-blue-200",
	delivered: "bg-purple-100 text-purple-800 border-purple-200",
	cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const formatDate = (dateStr: string) =>
	new Date(dateStr).toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

export const formatCurrency = (
	amount: number | undefined,
	currency: string,
) => {
	if (amount === undefined || amount === null) return "—";
	const symbol =
		currency?.toUpperCase() === "NGN"
			? "₦"
			: currency?.toUpperCase() === "USD"
				? "$"
				: (currency ?? "") + " ";
	return `${symbol}${amount.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};
