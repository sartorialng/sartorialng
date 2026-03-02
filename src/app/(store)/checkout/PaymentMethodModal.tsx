"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { MasterCard, PayPal, Verve, Visa } from "@/assets";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { convertNGNtoUSD } from "@/lib/currency";

interface PaymentMethodModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (method: string) => void;
	onPayPalSuccess: (details: any) => void;
	onPayPalError?: (error: any) => void;
	totalAmount: number;
}

const PaymentMethodModal = ({
	isOpen,
	onClose,
	onConfirm,
	onPayPalSuccess,
	onPayPalError,
	totalAmount,
}: PaymentMethodModalProps) => {
	const [selectedMethod, setSelectedMethod] = useState("paystack");
	const [isProcessing, setIsProcessing] = useState(false);

	const totalInUSD = convertNGNtoUSD(totalAmount);

	const handleProceed = () => {
		onConfirm(selectedMethod);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="w-[95vw] max-w-lg p-4 sm:p-8 bg-white max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold text-center text-gray-900">
						Choose Payment Method
					</DialogTitle>
				</DialogHeader>

				<div className="mt-6 space-y-4">
					<RadioGroup
						value={selectedMethod}
						onValueChange={setSelectedMethod}
						className="space-y-4"
					>
						{/* Paystack Option */}
						<div
							className={`relative flex items-start sm:items-center gap-2 md:gap-1 sm:space-x-4 rounded-lg border-2 p-4 sm:p-6 cursor-pointer transition-all ${
								selectedMethod === "paystack"
									? "border-sartorial-green bg-green-50"
									: "border-gray-200 hover:border-gray-300"
							}`}
							onClick={() => setSelectedMethod("paystack")}
						>
							<RadioGroupItem
								value="paystack"
								id="paystack"
								className="h-5 w-5 mt-1 sm:mt-0"
							/>
							<Label
								htmlFor="paystack"
								className="flex-1 cursor-pointer"
							>
								<div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<p className="text-base font-semibold text-gray-900">
											Pay with Paystack
										</p>
										<p className="text-sm text-gray-600 mt-1">
											Cards, Bank Transfers, USSD...
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Image
											src={Visa}
											alt="Visa"
											width={40}
											height={24}
											className="h-6 w-10 object-contain"
										/>
										<Image
											src={MasterCard}
											alt="Mastercard"
											width={40}
											height={24}
											className="h-6 w-auto object-contain"
										/>
										<Image
											src={Verve}
											alt="Verve"
											width={40}
											height={24}
											className="h-6 w-auto object-contain"
										/>
									</div>
								</div>
							</Label>
						</div>

						{/* PayPal Option */}
						<div
							className={`relative flex items-start sm:items-center gap-3 sm:space-x-4 rounded-lg border-2 p-4 sm:p-6 cursor-pointer transition-all ${
								selectedMethod === "paypal"
									? "border-sartorial-green bg-green-50"
									: "border-gray-200 hover:border-gray-300"
							}`}
							onClick={() => setSelectedMethod("paypal")}
						>
							<RadioGroupItem
								value="paypal"
								id="paypal"
								className="h-5 w-5 mt-1 sm:mt-0"
							/>
							<Label
								htmlFor="paypal"
								className="flex-1 cursor-pointer"
							>
								<div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<p className="text-base font-semibold text-gray-900">
											Pay with PayPal
										</p>
										<p className="text-sm text-gray-600 mt-1">
											Pay via PayPal or Credit/Debit Card
										</p>
									</div>
									<Image
										src={PayPal}
										alt="PayPal"
										width={100}
										height={30}
										className="h-6 w-auto object-contain"
										unoptimized
									/>
								</div>
							</Label>
						</div>
					</RadioGroup>
				</div>

				{selectedMethod === "paypal" ? (
					<div className="mt-6 w-full overflow-hidden">
						<PayPalButtons
							style={{
								layout: "horizontal",
								height: 45,
								label: "pay",
							}}
							disabled={isProcessing}
							createOrder={async () => {
								setIsProcessing(true);
								try {
									const res = await fetch(
										"/api/paypal/create-order",
										{
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
											},
											body: JSON.stringify({
												amount: totalInUSD,
											}),
										},
									);
									const data = await res.json();
									if (!res.ok)
										throw new Error(
											data.error ||
												"Failed to create order",
										);
									return data.id;
								} catch (error: any) {
									setIsProcessing(false);
									toast.error(
										error.message ||
											"Failed to create PayPal order. Please try again.",
									);
									if (onPayPalError) onPayPalError(error);
									throw error;
								}
							}}
							onApprove={async (data) => {
								try {
									const res = await fetch(
										"/api/paypal/capture-order",
										{
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
											},
											body: JSON.stringify({
												orderID: data.orderID,
											}),
										},
									);
									const details = await res.json();
									if (!res.ok)
										throw new Error(
											details.error ||
												"Failed to capture order",
										);
									setIsProcessing(false);
									onPayPalSuccess(details);
								} catch (error: any) {
									setIsProcessing(false);
									toast.error(
										error.message ||
											"Failed to process payment. Please contact support.",
									);
									if (onPayPalError) onPayPalError(error);
								}
							}}
							onCancel={() => {
								setIsProcessing(false);
								toast.info("Payment cancelled");
							}}
							onError={(err: any) => {
								setIsProcessing(false);
								let errorMessage =
									"Payment failed. Please try again.";
								if (
									err.message?.includes("INSTRUMENT_DECLINED")
								) {
									errorMessage =
										"Your payment method was declined. Please try another card.";
								} else if (
									err.message?.includes("INSUFFICIENT_FUNDS")
								) {
									errorMessage =
										"Insufficient funds. Please use a different payment method.";
								}
								toast.error(errorMessage);
								if (onPayPalError) onPayPalError(err);
							}}
						/>
					</div>
				) : (
					<Button
						onClick={handleProceed}
						className="mt-6 h-12 w-full rounded-lg bg-sartorial-green text-white text-base font-semibold hover:bg-sartorial-green/90 cursor-pointer"
					>
						Proceed to Payment
					</Button>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default PaymentMethodModal;
