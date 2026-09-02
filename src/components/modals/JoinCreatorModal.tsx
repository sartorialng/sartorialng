"use client";
import { useState } from "react";
import { useFormik } from "formik";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/form/CustomInput";
import { joinCreatorSchema } from "@/lib/validation-schemas";
import { toast } from "sonner";
import { XCircle, Sparkle } from "lucide-react";
import Image from "next/image";
import { PartyPopper } from "@/assets";

const JoinCreatorModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const formik = useFormik({
		initialValues: {
			emailAddress: "",
			instagramHandle: "",
			tiktokHandle: "",
		},
		validationSchema: joinCreatorSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			try {
				const response = await fetch("/api/creators/apply", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(values),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Failed to submit");
				}

				setIsSuccess(true);
				resetForm();
			} catch (error) {
				console.error("Error:", error);
				toast.error("Something went wrong. Please try again.");
			} finally {
				setSubmitting(false);
			}
		},
	});

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setIsSuccess(false);
			formik.resetForm();
		}
	};

	const labelStyle = "text-sm font-semibold text-sartorial-green";
	const inputStyle =
		"h-10 border-sartorial-green focus:ring-0 focus:border-sartorial-green rounded-2xl";

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button className="h-12 md:h-15 px-6 w-full sm:w-auto sm:min-w-50.5 bg-white text-sartorial-green hover:bg-white/90 text-base md:text-lg rounded-[14px] font-bold cursor-pointer">
					Join PR List
					<Sparkle className="ml-1 size-5 fill-sartorial-green text-sartorial-green" />
				</Button>
			</DialogTrigger>
			<DialogContent
				className="no-scrollbar w-[95%] sm:max-w-112.5 max-h-[90vh] rounded-3xl p-6 md:p-10 overflow-y-auto"
				showCloseButton={false}
			>
				<DialogClose className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
					<XCircle className="h-8 w-8 text-sartorial-green" />
					<span className="sr-only">Close</span>
				</DialogClose>

				{isSuccess ? (
					<div className="flex flex-col items-center text-center py-8">
						<Image
							src={PartyPopper}
							alt=""
							className="h-14 w-14 mb-4"
						/>
						<DialogTitle className="text-xl md:text-2xl font-bold text-sartorial-green">
							You&apos;re on the list!
						</DialogTitle>
						<DialogDescription className="mt-2 text-sm md:text-base">
							Welcome to the Sartorial PR family. We&apos;ll be in touch soon.
						</DialogDescription>
					</div>
				) : (
					<>
						<DialogHeader className="pt-8 md:pt-2">
							<DialogTitle className="text-xl md:text-2xl font-bold text-sartorial-green text-center">
								Join the PR List
							</DialogTitle>
							<DialogDescription className="text-center text-sm md:text-base">
								Get early access, exclusive drops, and PR packages from
								Sartorial.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={formik.handleSubmit} className="md:mt-2 space-y-2">
							<CustomInput
								id="emailAddress"
								type="email"
								placeholder="you@example.com"
								label="Email Address"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("emailAddress")}
								error={formik.errors.emailAddress}
								touched={formik.touched.emailAddress}
							/>

							<CustomInput
								id="instagramHandle"
								type="text"
								placeholder="@yourusername"
								label="Instagram Handle"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("instagramHandle")}
								error={formik.errors.instagramHandle}
								touched={formik.touched.instagramHandle}
							/>

							<CustomInput
								id="tiktokHandle"
								type="text"
								placeholder="@yourusername"
								label="TikTok Handle"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("tiktokHandle")}
								error={formik.errors.tiktokHandle}
								touched={formik.touched.tiktokHandle}
							/>

							<Button
								type="submit"
								className="w-full h-11 bg-sartorial-green hover:bg-sartorial-green/90 mt-2 rounded-3xl cursor-pointer"
								disabled={formik.isSubmitting}
							>
								{formik.isSubmitting ? "Joining..." : "Join PR List"}
							</Button>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default JoinCreatorModal;
