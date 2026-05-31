"use client";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { SalesTC } from "@/assets";
import { Dispatch, SetStateAction } from "react";

type SalesTCModalProps = {
	isSalesModalOpen: boolean;
	setIsSalesModalOpen: Dispatch<SetStateAction<boolean>>;
};

const SalesTCModal = ({
	isSalesModalOpen,
	setIsSalesModalOpen,
}: SalesTCModalProps) => {
	return (
		<Dialog open={isSalesModalOpen} onOpenChange={setIsSalesModalOpen}>
			<DialogContent
				className="w-[80%] md:max-w-90 max-h-[85vh] p-0 border-none overflow-hidden bg-transparent shadow-none"
				showCloseButton={false}
			>
				<DialogClose className="absolute cursor-pointer right-5 md:right-8 top-4 z-50 rounded-full opacity-80 transition-opacity hover:opacity-100 focus:outline-none">
					<X className="h-5 w-5 text-white drop-shadow-lg" />
					<span className="sr-only">Close</span>
				</DialogClose>

				<Image
					src={SalesTC}
					alt="sales"
					className="w-full h-full max-h-[85vh] object-cover rounded-2xl"
					priority
				/>
			</DialogContent>
		</Dialog>
	);
};

export default SalesTCModal;
