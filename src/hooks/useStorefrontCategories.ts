"use client";

import { useEffect, useState } from "react";
import {
	getStorefrontCategories,
	type StoreCategory,
} from "@/sanity/lib/product/getCategories";

let categoriesPromise: Promise<StoreCategory[]> | null = null;

export const useStorefrontCategories = () => {
	const [categories, setCategories] = useState<StoreCategory[]>([]);

	useEffect(() => {
		if (!categoriesPromise) {
			categoriesPromise = getStorefrontCategories();
		}

		let active = true;
		categoriesPromise.then((result) => {
			if (active) setCategories(result);
		});

		return () => {
			active = false;
		};
	}, []);

	return categories;
};

export const menuLabelFor = (category: StoreCategory) =>
	category.menuLabel?.trim() || category.title;

export const isAllProducts = (title: string) =>
	title.trim().toLowerCase() === "all products";

export const hasAllProductsCategory = (categories: StoreCategory[]) =>
	categories.some((category) => isAllProducts(category.title));

export const categoryHref = (category: StoreCategory) =>
	isAllProducts(category.title)
		? "/all-products"
		: `/category?value=${encodeURIComponent(category.title)}`;
