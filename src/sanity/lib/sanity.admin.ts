import { createClient } from "next-sanity";

export const adminClient = createClient({
	projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
	dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	apiVersion: "2026-02-05",
	useCdn: false,
	token: process.env.SANITY_API_WRITE_TOKEN,
});
