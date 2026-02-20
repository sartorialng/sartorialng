"use client";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/form/CustomInput";
import { joinSartorialSchema } from "@/lib/validation-schemas";
import { toast } from "sonner";

const JoinSartorialBabesModal = () => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const hasJoined = localStorage.getItem("customer");

		if (hasJoined) {
			const timer = setTimeout(() => {
				setIsOpen(true);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, []);

	const formik = useFormik({
		initialValues: {
			fullName: "",
			emailAddress: "",
			phoneNo: "",
		},
		validationSchema: joinSartorialSchema,
		onSubmit: async (values, { setSubmitting }) => {
			try {
				const response = await fetch("/api/join-sartorial", {
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

				localStorage.setItem("hasJoinedSartorial", "true");

				toast.success("Welcome to Sartorial Babes! 🎉");

				formik.resetForm();
				setIsOpen(false);
			} catch (error) {
				console.error("Error:", error);
				toast.error("Something went wrong. Please try again.");
			} finally {
				setSubmitting(false);
			}
		},
	});

	const labelStyle = "text-sm font-semibold text-sartorial-green";
	const inputStyle =
		"h-10 border-sartorial-green focus:ring-0 focus:border-sartorial-green rounded-2xl";

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-130 max-h-[90vh] rounded-3xl p-5 md:p-10">
				<DialogHeader>
					<DialogTitle className="text-xl md:text-2xl font-bold text-sartorial-green text-center">
						JOIN THE SARTORIAL BABES&apos;S BENEFITS #SBB
					</DialogTitle>
					<DialogDescription className="text-center text-sm md:text-base">
						Want 50% off coupon? Join our exclusive community.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={formik.handleSubmit}
					className="md:mt-2 space-y-2"
				>
					<CustomInput
						id="fullName"
						type="text"
						placeholder="Enter your full name"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("fullName")}
						error={formik.errors.fullName}
						touched={formik.touched.fullName}
					/>

					<CustomInput
						id="emailAddress"
						placeholder="Enter your email"
						type="email"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("emailAddress")}
						error={formik.errors.emailAddress}
						touched={formik.touched.emailAddress}
					/>

					<CustomInput
						id="phoneNo"
						placeholder="Enter your phone number"
						type="text"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("phoneNo")}
						error={formik.errors.phoneNo}
						touched={formik.touched.phoneNo}
					/>

					<Button
						type="submit"
						className="w-full h-11 bg-sartorial-green hover:bg-sartorial-green/90 mt-2 rounded-3xl cursor-pointer"
						disabled={formik.isSubmitting}
					>
						{formik.isSubmitting ? "Joining..." : "Join Now"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default JoinSartorialBabesModal;
