import { client } from "../client";
import { groq } from "next-sanity";

export const getSartorialBabes = async () => {
	const ALL_BABES_QUERY = groq`
    *[_type == "sartorialBabe"] | order(_createdAt desc) {
      _id,
      name,
      image
    }
  `;

	return client.fetch(
		ALL_BABES_QUERY,
		{},
		{
			next: {
				revalidate: 10,
			},
		},
	);
};
