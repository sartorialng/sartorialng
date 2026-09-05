import { useState, type ComponentType } from "react";
import { CheckmarkIcon, CloseIcon, EnvelopeIcon } from "@sanity/icons";
import {
	useClient,
	type DocumentActionComponent,
	type DocumentActionProps,
} from "sanity";
import { apiVersion } from "../env";

type CreatorStatus = "approved" | "rejected";

type CreatorDocument = {
	status?: string;
	approvalEmailSentAt?: string;
} | null;

/**
 * Asks the server to send the welcome email. The endpoint only accepts
 * applications that are already `approved` in the dataset, and it answers as
 * soon as it has claimed the send rather than waiting on Resend.
 */
async function requestApprovalEmail(applicationId: string) {
	const response = await fetch("/api/creators/notify-approval", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ applicationId }),
	});

	if (!response.ok) {
		const data = await response.json().catch(() => ({}));
		throw new Error(data.error || "Failed to send approval email");
	}
}

const publishedIdOf = (props: DocumentActionProps) =>
	(props.published?._id ?? props.id).replace(/^drafts\./, "");

function useCreatorStatusAction(
	props: DocumentActionProps,
	status: CreatorStatus,
	label: string,
	icon: ComponentType,
) {
	// Must stay above the early return so hook order is stable across renders.
	const client = useClient({ apiVersion });
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const current = (props.published ?? props.draft) as CreatorDocument;

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
				const documentId = publishedIdOf(props);

				// Writing from the Studio uses the editor's own credentials, so
				// Sanity enforces who may approve — and the change lands in the
				// Studio's realtime store immediately instead of after a
				// server round trip.
				const transaction = client.transaction();
				const patch = { status, reviewedAt: new Date().toISOString() };

				transaction.patch(documentId, (p) => p.set(patch));
				if (props.draft) {
					// Otherwise the editor keeps seeing "pending" from the draft.
					transaction.patch(`drafts.${documentId}`, (p) => p.set(patch));
				}

				await transaction.commit();

				if (status === "approved") {
					await requestApprovalEmail(documentId);
				}

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

/**
 * Recovery path for an approval whose email failed to send: the server clears
 * its claim on failure, so this action reappears until one actually goes out.
 */
export const ResendApprovalEmailAction: DocumentActionComponent = (props) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const current = (props.published ?? props.draft) as CreatorDocument;

	if (
		!current ||
		current.status !== "approved" ||
		current.approvalEmailSentAt
	) {
		return null;
	}

	return {
		label: isLoading ? "Sending..." : "Resend approval email",
		icon: EnvelopeIcon,
		disabled: isLoading,
		dialog: error
			? ({
					type: "dialog" as const,
					onClose: () => setError(null),
					header: "Failed to send approval email",
					content: error,
				} as const)
			: undefined,
		onHandle: async () => {
			setIsLoading(true);
			try {
				await requestApprovalEmail(publishedIdOf(props));
				setIsLoading(false);
				props.onComplete();
			} catch (err) {
				setIsLoading(false);
				setError(err instanceof Error ? err.message : "Unknown error");
			}
		},
	};
};
