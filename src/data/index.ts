export type HeaderLink =
	| { kind: "link"; href: string; label: string }
	| { kind: "categoryDropdown"; label: string };

// "All Products" now lives inside the Category dropdown rather than as its
// own top-level link.
export const headerLinks: HeaderLink[] = [
	{ kind: "link", href: "/", label: "Home" },
	{ kind: "link", href: "/#new-arrivals", label: "New Arrivals" },
	{ kind: "link", href: "/#best-sellers", label: "Best Sellers" },
	{ kind: "link", href: "/about-us", label: "About Us" },
	{ kind: "categoryDropdown", label: "Category" },
	{ kind: "link", href: "/#pre-sale", label: "Pre-Sale" },
	{ kind: "link", href: "/gift-concierge", label: "Gift Concierge" },
];

export const sortOptions = [
	"Alphabetically, A to Z",
	"Alphabetically, Z to A",
	"Price, Low to High",
	"Price, High to Low",
];

export const categories = [
	"Mini Bags",
	"Small Bags",
	"Medium Bags",
	"Large Bags",
];

export const priceRanges = [
	"Under $25",
	"$25 - $50",
	"$50 - $100",
	"Over $100",
];

export const colors = [
	{ name: "Black", hex: "#000000" },
	{ name: "White", hex: "#FFFFFF" },
	{ name: "Blue", hex: "#3B82F6" },
	{ name: "Red", hex: "#EF4444" },
	{ name: "Green", hex: "#10B981" },
];
