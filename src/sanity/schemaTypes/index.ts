import { type SchemaTypeDefinition } from "sanity";
import productType from "./product";
import categoryType from "./category";
import colorType from "./color";
import { blockContentType } from "./blockContent";
import orderType from "./order";
import reviewType from "./review";
import sartorialBabesType from "./sartorial-babes";
import customerType from "./customer";

export const schema: { types: SchemaTypeDefinition[] } = {
	types: [
		productType,
		categoryType,
		colorType,
		blockContentType,
		orderType,
		reviewType,
		sartorialBabesType,
		customerType,
	],
};
