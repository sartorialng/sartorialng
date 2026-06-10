export type Product = {
	_id: string;
	name: string;
	price: number;
	currency: string;
	originalPrice: number;
	image: string;
};

export interface BillingFormValues {
	firstName: string;
	lastName: string;
	address: string;
	country: string;
	state: string;
	apartment: string;
	area: string;
	postalCode: string;
	phoneNo: string;
	secondaryPhoneNo: string;
	emailAddress: string;
	saveInfo: boolean;
	shipToDifferentAddress: boolean;
	hasRegistered: boolean;
	interstateDeliveryType: "pickup" | "doorstep";
	// hasReadTC: boolean;
	receiverFirstName: string;
	receiverLastName: string;
	shippingAddress: string;
	shippingApartment: string;
	shippingCountry: string;
	shippingState: string;
	shippingArea: string;
	shippingPostalCode: string;
	shippingPhoneNo: string;
	shippingSecondaryPhoneNo: string;
	orderNote: string;
}

export type SanityImageAsset = {
	url: string;
};

export type ProductImage = {
	alt?: string;
	asset?: SanityImageAsset;
};

export type BestSellerProduct = {
	_id: string;
	name?: string;
	slug?: string;
	price?: number;
	stock?: number;
	isBestSeller?: boolean;
	isNewArrival?: boolean;
	images?: ProductImage[];
};

export interface SartorialBabe {
	_id: string;
	name: string | null;
	image: {
		_type: "image";
		asset: {
			_ref: string;
			_type: "reference";
		};
		hotspot?: {
			x: number;
			y: number;
			height: number;
			width: number;
		};
		crop?: {
			top: number;
			bottom: number;
			left: number;
			right: number;
		};
	};
}
