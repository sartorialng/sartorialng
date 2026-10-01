"use client";
import { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { NewFooterBrandLogo } from "@/assets";
import CustomerTerms from "@/components/sections/CustomerTerms";

type TermsModalProps = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	/** Ticks the checkout terms checkbox. */
	onAccept: () => void;
};

/** The customer Terms & Conditions, shown from the checkout checkbox. */
const TermsModal = ({ open, setOpen, onAccept }: TermsModalProps) => {
	const accept = () => {
		onAccept();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent
				className="flex w-[95%] sm:max-w-xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border-none p-0 gap-0"
				showCloseButton={false}
			>
				<div className="relative shrink-0 bg-sartorial-green px-6 pt-6 pb-5 text-white">
					<DialogClose className="absolute z-10 cursor-pointer right-3 top-3 rounded-full p-1 opacity-80 transition-opacity hover:opacity-100 focus:outline-none">
						<XCircle className="h-6 w-6 text-white" />
						<span className="sr-only">Close</span>
					</DialogClose>

					<DialogHeader className="items-center gap-2 text-center">
						<Image
							src={NewFooterBrandLogo}
							width={197}
							height={50}
							alt="Sartorial"
							className="h-auto w-24"
						/>
						<DialogTitle className="text-center text-xl font-semibold text-white">
							Terms &amp; Conditions
						</DialogTitle>
						<DialogDescription className="text-center text-sm text-white/80">
							Please read before you place your order.
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-sartorial-green">
					<CustomerTerms includePaymentTerms={false} />
				</div>

				<div className="flex shrink-0 flex-col-reverse items-center gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-between">
					<Link
						href="/terms-and-condition"
						target="_blank"
						className="text-xs text-sartorial-green underline"
					>
						Open full Terms &amp; Conditions page
					</Link>
					<Button
						type="button"
						onClick={accept}
						className="h-10 w-full rounded-3xl bg-sartorial-green px-8 text-sm font-medium text-white hover:bg-sartorial-green/90 cursor-pointer sm:w-auto"
					>
						I accept
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default TermsModal;
