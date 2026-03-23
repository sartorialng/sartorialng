"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { Sales } from "@/assets";

const SalesModal = () => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsOpen(true);
		}, 5000);

		return () => clearTimeout(timer);
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent
				className="w-[95%] sm:max-w-112.5 max-h-[85vh] p-0 border-none overflow-hidden bg-transparent shadow-none"
				showCloseButton={false}
			>
				<DialogClose className="absolute cursor-pointer right-4 md:right-14 top-4 z-50 rounded-full opacity-80 transition-opacity hover:opacity-100 focus:outline-none">
					<X className="h-5 w-5 text-white drop-shadow-lg" />
					<span className="sr-only">Close</span>
				</DialogClose>

				<Image
					src={Sales}
					alt="sales"
					className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
					priority
				/>
			</DialogContent>
		</Dialog>
	);
};

export default SalesModal;
