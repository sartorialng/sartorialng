import { useState, type ComponentType } from "react";
import { CheckmarkIcon, CloseIcon } from "@sanity/icons";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";

type CreatorStatus = "approved" | "rejected";

async function updateCreatorStatus(applicationId: string, status: CreatorStatus) {
	const response = await fetch("/api/creators/update-status", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ applicationId, status }),
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.error || "Failed to update status");
	}
}

function useCreatorStatusAction(
	props: DocumentActionProps,
	status: CreatorStatus,
	label: string,
	icon: ComponentType,
) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const current = (props.published ?? props.draft) as
		| { status?: string }
		| null;

	if (!current || current.status !== "pending") return null;

	return {
		label: isLoading ? `${label}...` : label,
		icon,
		disabled: isLoading,
		tone: status === "approved" ? ("positive" as const) : ("critical" as const),
		dialog: error
			? ({
					type: "dialog" as const,
					onClose: () => setError(null),
					header: "Failed to update status",
					content: error,
				} as const)
			: undefined,
		onHandle: async () => {
			setIsLoading(true);
			try {
				const documentId = (props.published?._id ?? props.id).replace(
					/^drafts\./,
					"",
				);
				await updateCreatorStatus(documentId, status);
				setIsLoading(false);
				props.onComplete();
			} catch (err) {
				setIsLoading(false);
				setError(err instanceof Error ? err.message : "Unknown error");
			}
		},
	};
}

export const ApproveCreatorAction: DocumentActionComponent = (props) =>
	useCreatorStatusAction(props, "approved", "Approve", CheckmarkIcon);

export const RejectCreatorAction: DocumentActionComponent = (props) =>
	useCreatorStatusAction(props, "rejected", "Reject", CloseIcon);
