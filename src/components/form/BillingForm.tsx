"use client";
import { FormikProps } from "formik";
import { Checkbox } from "@/components/ui/checkbox";
import CustomInput from "@/components/form/CustomInput";
import CustomSelect from "@/components/form/CustomSelect";
import { AREAS, COUNTRIES, NIGERIA_STATES } from "@/data/shipping";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BillingFormValues } from "@/lib/types/types";
import { useState } from "react";
import PaymentMethodModal from "@/app/(store)/checkout/PaymentMethodModal";

interface BillingFormProps {
	formik: FormikProps<BillingFormValues>;
	onPaystack: () => void;
	onPayPal: (details: any) => void;
	totalAmount: number;
}

const labelStyle = "text-gray-400 font-normal text-sm";
const inputStyle = "w-full bg-gray-100 border-none h-10 text-black";
const textAreaStyle = "w-full bg-gray-100 border-none text-black";

const BillingForm = ({
	formik,
	onPaystack,
	onPayPal,
	totalAmount,
}: BillingFormProps) => {
	const [showPaymentModal, setShowPaymentModal] = useState(false);

	const handleCheckoutClick = async (e: React.FormEvent) => {
		e.preventDefault();

		const errors = await formik.validateForm();

		if (Object.keys(errors).length === 0) {
			setShowPaymentModal(true);
		} else {
			formik.handleSubmit();
		}
	};

	const handlePaymentConfirm = (paymentMethod: string) => {
		if (paymentMethod === "paystack") {
			setShowPaymentModal(false);
			onPaystack();
		}
	};

	const handlePayPalSuccess = (details: any) => {
		setShowPaymentModal(false);
		onPayPal(details);
	};

	const handlePayPalError = (error: any) => {
		console.error("PayPal Error:", error);
	};

	return (
		<>
			<form onSubmit={handleCheckoutClick} className="space-y-6">
				<h2 className="text-xl text-white font-medium mb-6">
					Billing Details
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<CustomInput
						id="firstName"
						label="First Name*"
						type="text"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("firstName")}
						error={formik.errors.firstName}
						touched={formik.touched.firstName}
					/>
					<CustomInput
						id="lastName"
						label="Last Name*"
						type="text"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("lastName")}
						error={formik.errors.lastName}
						touched={formik.touched.lastName}
					/>
				</div>

				<CustomInput
					id="address"
					label="Address* (e.g. 16 Samuel Street, Ogudu, Lagos)"
					type="text"
					labelStyle={labelStyle}
					inputStyle={inputStyle}
					{...formik.getFieldProps("address")}
					error={formik.errors.address}
					touched={formik.touched.address}
				/>

				<CustomInput
					id="apartment"
					label="Apartment, floor, etc. (optional)"
					type="text"
					labelStyle={labelStyle}
					inputStyle={inputStyle}
					{...formik.getFieldProps("apartment")}
				/>

				<CustomSelect
					name="country"
					label="Country"
					placeholder="Select your country"
					items={COUNTRIES}
					value={formik.values.country}
					touched={formik.touched.country}
					error={formik.errors.country}
					onChange={(e) => {
						formik.handleChange(e);
						formik.setFieldValue("state", "");
						formik.setFieldValue("area", "");
					}}
					labelStyle={labelStyle}
					inputStyle={`w-full bg-gray-100 border-none py-3 text-black`}
				/>

				{formik.values.country === "Nigeria" && (
					<CustomSelect
						name="state"
						label="State/City"
						placeholder="Select your state"
						items={NIGERIA_STATES}
						value={formik.values.state}
						touched={formik.touched.state}
						error={formik.errors.state}
						onChange={(e) => {
							formik.handleChange(e);
							formik.setFieldValue("area", "");
						}}
						labelStyle={labelStyle}
						inputStyle={inputStyle}
					/>
				)}

				{formik.values.state === "Lagos" && (
					<CustomSelect
						name="area"
						label="Area"
						placeholder="Select your area"
						items={AREAS}
						value={formik.values.area}
						touched={formik.touched.area}
						error={formik.errors.area}
						onChange={formik.handleChange}
						labelStyle={labelStyle}
						inputStyle={inputStyle}
					/>
				)}

				{formik.values.state === "Lagos" && (
					<CustomInput
						id="postalCode"
						label="Postal Code (Optional)"
						type="text"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("postalCode")}
					/>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<CustomInput
						id="phoneNo"
						label="Phone No.*"
						type="tel"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("phoneNo")}
						error={formik.errors.phoneNo}
						touched={formik.touched.phoneNo}
					/>

					<CustomInput
						id="secondaryPhoneNo"
						label="Alternate Phone No.*"
						type="tel"
						labelStyle={labelStyle}
						inputStyle={inputStyle}
						{...formik.getFieldProps("secondaryPhoneNo")}
						error={formik.errors.secondaryPhoneNo}
						touched={formik.touched.secondaryPhoneNo}
					/>
				</div>

				<CustomInput
					id="emailAddress"
					label="Email Address*"
					type="email"
					labelStyle={labelStyle}
					inputStyle={inputStyle}
					{...formik.getFieldProps("emailAddress")}
					error={formik.errors.emailAddress}
					touched={formik.touched.emailAddress}
				/>

				<CustomInput
					id="orderNote"
					label="Leave a note (E.g I want to...)"
					multiline
					labelStyle={labelStyle}
					inputStyle={textAreaStyle}
					{...formik.getFieldProps("orderNote")}
				/>

				{/* Save Info & Ship to Different Address checkboxes */}
				<div className="flex items-center space-x-2 pt-2">
					<Checkbox
						id="saveInfo"
						className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2D5A43]"
						checked={formik.values.saveInfo}
						onCheckedChange={(checked) =>
							formik.setFieldValue("saveInfo", checked)
						}
					/>
					<label
						htmlFor="saveInfo"
						className="text-sm font-medium leading-none text-gray-200 cursor-pointer"
					>
						Save this information for faster check-out next time
					</label>
				</div>

				<div className="flex items-center space-x-2 pt-2 pb-2">
					<Checkbox
						id="shipToDifferentAddress"
						className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2D5A43]"
						checked={formik.values.shipToDifferentAddress}
						onCheckedChange={(checked) =>
							formik.setFieldValue(
								"shipToDifferentAddress",
								checked,
							)
						}
					/>
					<label
						htmlFor="shipToDifferentAddress"
						className="text-lg font-medium leading-none text-white cursor-pointer"
					>
						Ship to a different address
					</label>
				</div>

				{/* Shipping Address Section */}
				{formik.values.shipToDifferentAddress && (
					<div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<CustomInput
								id="receiverFirstName"
								label="Receiver's First Name*"
								type="text"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("receiverFirstName")}
								error={formik.errors.receiverFirstName}
								touched={formik.touched.receiverFirstName}
							/>
							<CustomInput
								id="receiverLastName"
								label="Receiver's Last Name*"
								type="text"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("receiverLastName")}
								error={formik.errors.receiverLastName}
								touched={formik.touched.receiverLastName}
							/>
						</div>

						<CustomInput
							id="shippingAddress"
							label="Address*"
							type="text"
							labelStyle={labelStyle}
							inputStyle={inputStyle}
							{...formik.getFieldProps("shippingAddress")}
							error={formik.errors.shippingAddress}
							touched={formik.touched.shippingAddress}
						/>

						<CustomInput
							id="shippingApartment"
							label="Apartment, floor, etc. (optional)"
							type="text"
							labelStyle={labelStyle}
							inputStyle={inputStyle}
							{...formik.getFieldProps("shippingApartment")}
						/>

						<CustomSelect
							name="shippingCountry"
							label="Country"
							placeholder="Select your country"
							items={COUNTRIES}
							value={formik.values.shippingCountry}
							touched={formik.touched.shippingCountry}
							error={formik.errors.shippingCountry}
							onChange={(e) => {
								formik.handleChange(e);
								formik.setFieldValue("state", "");
								formik.setFieldValue("area", "");
							}}
							labelStyle={labelStyle}
							inputStyle={`w-full bg-gray-100 border-none py-3 text-black`}
						/>

						{formik.values.shippingCountry === "Nigeria" && (
							<CustomSelect
								name="shippingState"
								label="State/City"
								placeholder="Select your state"
								items={NIGERIA_STATES}
								value={formik.values.shippingState}
								touched={formik.touched.shippingState}
								error={formik.errors.shippingState}
								onChange={(e) => {
									formik.handleChange(e);
									formik.setFieldValue("area", "");
								}}
								labelStyle={labelStyle}
								inputStyle={inputStyle}
							/>
						)}

						{formik.values.shippingState === "Lagos" && (
							<CustomSelect
								name="shippingArea"
								label="Area"
								placeholder="Select your area"
								items={AREAS}
								value={formik.values.shippingArea}
								touched={formik.touched.shippingArea}
								error={formik.errors.shippingArea}
								onChange={formik.handleChange}
								labelStyle={labelStyle}
								inputStyle={inputStyle}
							/>
						)}

						{formik.values.shippingState === "Lagos" && (
							<CustomInput
								id="shippingPostalCode"
								label="Postal Code (Optional)"
								type="text"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("shippingPostalCode")}
							/>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<CustomInput
								id="shippingPhoneNo"
								label="Phone No.*"
								type="tel"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps("shippingPhoneNo")}
								error={formik.errors.shippingPhoneNo}
								touched={formik.touched.shippingPhoneNo}
							/>

							<CustomInput
								id="shippingSecondaryPhoneNo"
								label="Alternate Phone No.*"
								type="tel"
								labelStyle={labelStyle}
								inputStyle={inputStyle}
								{...formik.getFieldProps(
									"shippingSecondaryPhoneNo",
								)}
								error={formik.errors.shippingSecondaryPhoneNo}
								touched={
									formik.touched.shippingSecondaryPhoneNo
								}
							/>
						</div>
					</div>
				)}

				<div className="bg-white rounded-lg p-5 md:p-6 shadow-sm border border-gray-100">
					<h3 className="text-red-600 font-bold text-lg mb-2">
						Important Notice!
					</h3>
					<p className="text-[#404040] text-sm md:text-base leading-relaxed font-medium">
						Please note that delivery within Lagos takes 24-48hrs
						(Business Days). Inter-state takes 2-5 business days,
						deliveries within Africa take 5-8 business days, and
						international deliveries take 14 business days excluding
						public holidays.
					</p>
				</div>

				<div className="flex items-center space-x-2">
					<Checkbox
						id="hasRegistered"
						checked={formik.values.hasRegistered}
						onCheckedChange={(checked) => {
							formik.setFieldValue(
								"hasRegistered",
								checked === true,
							);
						}}
						className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2D5A43]"
					/>
					<label
						htmlFor="hasRegistered"
						className="text-base font-medium leading-none text-white cursor-pointer"
					>
						Join Sartorial Babes and get 20% off your next purchase!
					</label>
				</div>

				<div className="mt-5 text-white space-y-2">
					<Button
						className="mt-2 h-12 w-full rounded-full bg-white text-green-900 hover:bg-white/90 cursor-pointer"
						type="submit"
					>
						Checkout
					</Button>

					<div className="mt-5 md:mt-3 text-white flex justify-center items-center gap-4 underline text-[10px] md:text-xs">
						<Link href="/terms-and-condition">
							Terms & Condition
						</Link>
						<Link href="/privacy-policy">Privacy Policy</Link>
						<Link href="/refund-and-returns">Refund Policy</Link>
						<Link href="/shipping-details">Shipping Details</Link>
					</div>
				</div>
			</form>
			<PaymentMethodModal
				isOpen={showPaymentModal}
				onClose={() => setShowPaymentModal(false)}
				onConfirm={handlePaymentConfirm}
				onPayPalSuccess={handlePayPalSuccess}
				onPayPalError={handlePayPalError}
				totalAmount={totalAmount}
			/>
		</>
	);
};

export default BillingForm;
