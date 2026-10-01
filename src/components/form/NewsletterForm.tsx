"use client";
import { useFormik } from "formik";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import CustomInput from "@/components/form/CustomInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newsletterSchema } from "@/lib/validation-schemas";
import { subscribeToNewsletter, type NewsletterSource } from "@/lib/newsletter";

type Field = "fullName" | "email" | "phone";

const FIELDS: {
	name: Field;
	label: string;
	type: string;
	placeholder: string;
	autoComplete: string;
}[] = [
	{
		name: "fullName",
		label: "Full Name",
		type: "text",
		placeholder: "Full name",
		autoComplete: "name",
	},
	{
		name: "email",
		label: "Email Address",
		type: "email",
		placeholder: "Email address",
		autoComplete: "email",
	},
	{
		name: "phone",
		label: "WhatsApp Number",
		type: "tel",
		placeholder: "WhatsApp number",
		autoComplete: "tel",
	},
];

interface NewsletterFormProps {
	source: Exclude<NewsletterSource, "checkout">;
	/**
	 * "popup": stacked fields with labels, on white.
	 * "footer": one row of pill inputs on the green footer.
	 */
	variant?: "popup" | "footer";
	onSubscribed?: () => void;
}

const NewsletterForm = ({
	source,
	variant = "popup",
	onSubscribed,
}: NewsletterFormProps) => {
	const footer = variant === "footer";

	const formik = useFormik({
		initialValues: { fullName: "", email: "", phone: "", company: "" },
		validationSchema: newsletterSchema,
		onSubmit: async (values) => {
			try {
				const result = await subscribeToNewsletter({ ...values, source });
				toast.success(
					result.status === "already_subscribed"
						? "You're already on our list. Thanks for being with us!"
						: "You're subscribed! Check your inbox for a welcome email.",
				);
				formik.resetForm();
				onSubscribed?.();
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not subscribe. Please try again.",
				);
			}
		},
	});

	// Ids must stay unique: the popup and footer can be on the page together.
	const id = (field: string) => `${source}-newsletter-${field}`;
	// Only show a field's error once the visitor has been through it, not the
	// moment they start typing in the first box.
	const errorFor = (field: Field) =>
		formik.touched[field] ? formik.errors[field] : undefined;

	const honeypot = (
		<input
			type="text"
			tabIndex={-1}
			autoComplete="off"
			aria-hidden="true"
			className="hidden"
			{...formik.getFieldProps("company")}
		/>
	);

	const submitLabel = formik.isSubmitting ? (
		<span className="flex items-center gap-2">
			<Loader2 className="h-4 w-4 animate-spin" />
			Subscribing...
		</span>
	) : (
		"Subscribe"
	);

	const consent = (
		<p
			className={`text-xs leading-relaxed ${
				footer ? "text-white/60" : "text-gray-500"
			}`}
		>
			By subscribing, you agree to receive promos by email and WhatsApp.
			Unsubscribe anytime. See our{" "}
			<Link href="/privacy-policy" className="underline">
				Privacy Policy
			</Link>
			.
		</p>
	);

	if (footer) {
		return (
			<form onSubmit={formik.handleSubmit} className="space-y-3" noValidate>
				<div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] xl:grid-cols-2">
					{FIELDS.map((field) => {
						const error = errorFor(field.name);
						return (
							<div key={field.name}>
								<label htmlFor={id(field.name)} className="sr-only">
									{field.label}
								</label>
								<Input
									id={id(field.name)}
									type={field.type}
									placeholder={field.placeholder}
									autoComplete={field.autoComplete}
									aria-invalid={Boolean(error)}
									className="h-11 rounded-full border-white/25 bg-white/10 px-5 text-white placeholder:text-white/60 focus-visible:border-white focus-visible:ring-white/30 aria-invalid:border-amber-300"
									{...formik.getFieldProps(field.name)}
								/>
								{error && (
									<p className="mt-1.5 pl-5 text-xs text-amber-200">
										{error}
									</p>
								)}
							</div>
						);
					})}
					<Button
						type="submit"
						disabled={formik.isSubmitting}
						className="h-11 rounded-full bg-white px-8 text-sm font-semibold text-sartorial-green hover:bg-white/90 cursor-pointer sm:col-span-2 lg:col-span-1"
					>
						{submitLabel}
					</Button>
				</div>
				{honeypot}
				{consent}
			</form>
		);
	}

	const labelStyle = "text-gray-500 font-normal text-sm";
	const inputStyle = "w-full bg-gray-100 border-none h-9 text-sm text-black";

	return (
		<form onSubmit={formik.handleSubmit} className="space-y-3" noValidate>
			{FIELDS.map((field) => (
				<CustomInput
					key={field.name}
					id={id(field.name)}
					label={`${field.label}*`}
					type={field.type}
					placeholder={field.name === "phone" ? "08012345678" : undefined}
					labelStyle={labelStyle}
					inputStyle={inputStyle}
					{...formik.getFieldProps(field.name)}
					error={errorFor(field.name)}
					touched={formik.touched[field.name]}
				/>
			))}
			{honeypot}
			<Button
				type="submit"
				disabled={formik.isSubmitting}
				className="h-10 w-full rounded-3xl bg-sartorial-green text-base font-medium text-white hover:bg-sartorial-green/90 cursor-pointer"
			>
				{submitLabel}
			</Button>
			{consent}
		</form>
	);
};

export default NewsletterForm;
