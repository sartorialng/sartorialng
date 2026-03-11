"use client";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function formatDate(dateString: string): string {
	const date = new Date(dateString);

	const day = date.getDate();
	const suffix =
		day % 10 === 1 && day !== 11
			? "st"
			: day % 10 === 2 && day !== 12
				? "nd"
				: day % 10 === 3 && day !== 13
					? "rd"
					: "th";

	const month = date.toLocaleDateString("en-GB", { month: "long" });
	const year = date.getFullYear();

	return `${day}${suffix} of ${month}, ${year}`;
}

interface PreSaleNoticeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onContinue?: () => void;
	date: string;
}

const PreSaleNoticeModal = ({
	isOpen,
	onClose,
	onContinue,
	date,
}: PreSaleNoticeModalProps) => {
	const isValidDate = date && !isNaN(new Date(date).getTime());

	let validFrom = "TBD";
	let validTill = "TBD";

	if (isValidDate) {
		validFrom = formatDate(date);

		const endDate = new Date(date);
		endDate.setDate(endDate.getDate() + 7);
		validTill = formatDate(endDate.toISOString());
	}

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="w-[95%] sm:max-w-md max-h-[90vh] rounded-3xl p-6 md:p-10 overflow-y-auto"
				showCloseButton={false}
			>
				<DialogClose className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
					<X className="h-6 w-6 text-gray-500" />
					<span className="sr-only">Close</span>
				</DialogClose>

				<DialogHeader className="pt-4 md:pt-2 space-y-4">
					<DialogTitle className="text-xl md:text-2xl font-bold text-red-500 text-center">
						Pre-Sale Notice
					</DialogTitle>
					<DialogDescription className="text-center text-sm md:text-base text-sartorial-green leading-relaxed">
						This bag will be available between{" "}
						<span className="font-semibold">{validFrom}</span> and{" "}
						<span className="font-semibold">{validTill}</span>.
						Orders will be processed and shipped within this
						timeframe.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-6">
					<Button
						onClick={() => {
							onContinue?.();
							onClose?.();
						}}
						className="w-full h-12 bg-sartorial-green hover:bg-sartorial-green/90 rounded-3xl cursor-pointer text-white text-base font-medium"
					>
						Continue
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default PreSaleNoticeModal;
