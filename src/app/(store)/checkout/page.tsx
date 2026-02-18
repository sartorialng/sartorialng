"use client";
import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { calculateShipping } from "@/lib/helper";
import { useFormik } from "formik";
import { useBasketStore } from "@/store/store";
import OrderSummary from "@/components/layout/OrderSummary";
import BillingForm from "@/components/form/BillingForm";
import { billingSchema } from "@/lib/validation-schemas";
import { usePaystackCheckout } from "@/lib/paystack";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useRef, useState } from "react";
import ProcessingOverlay from "@/components/layout/ProcessingOverlay";

const CheckoutPage = () => {
	const isCreatingOrder = useRef(false);
	const router = useRouter();
	const { user } = useUser();
	const subtotal = useBasketStore((s) => s.getTotalPrice());
	const [isProcessing, setIsProcessing] = useState(false);

	const formik = useFormik({
		initialValues: {
			firstName: "",
			lastName: "",
			address: "",
			country: "",
			state: "",
			apartment: "",
			area: "",
			postalCode: "",
			phoneNo: "",
			emailAddress: "",
			saveInfo: false,
			shipToDifferentAddress: false,
			receiverFirstName: "",
			receiverLastName: "",
			shippingAddress: "",
			shippingCountry: "",
			shippingState: "",
			shippingArea: "",
			shippingApartment: "",
			shippingPostalCode: "",
			shippingPhoneNo: "",
			orderNote: "",
		},
		validationSchema: billingSchema,
		onSubmit: (values) => console.log("Form Data", values),
	});

	const getShippingAddress = () => ({
		country: formik.values.shipToDifferentAddress
			? formik.values.shippingCountry
			: formik.values.country,
		state: formik.values.shipToDifferentAddress
			? formik.values.shippingState
			: formik.values.state,
		area: formik.values.shipToDifferentAddress
			? formik.values.shippingArea
			: formik.values.area,
	});

	const shipping = calculateShipping(getShippingAddress());
	const total = subtotal + shipping;

	const createOrderInDatabase = async (
		paymentReference: string,
		paymentMethod: string,
	) => {
		if (isCreatingOrder.current) {
			console.warn(
				"Order creation already in progress, skipping duplicate call",
			);
			return { isDuplicate: true };
		}
		isCreatingOrder.current = true;

		try {
			const response = await fetch("/api/orders/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formik.values,
					clerkUserId: user?.id || null,
					clerkUserName:
						user?.fullName ||
						`${formik.values.firstName} ${formik.values.lastName}`,
					items: useBasketStore.getState().items.map((item) => ({
						_id: item.product._id,
						quantity: item.quantity,
						name: item.product.name,
						price: item.product.price,
						selectedColor: item.selectedColor
							? {
									colorId: item.selectedColor._id,
									colorTitle: item.selectedColor.title,
								}
							: undefined,
					})),
					paymentReference,
					paymentMethod,
					total,
					shipping,
					subtotal,
				}),
			});

			const data = await response.json();

			if (data.isDuplicate) return data;
			if (data.insufficientStock) throw new Error(data.error);
			if (!response.ok)
				throw new Error(data.error || "Failed to create order");

			return data;
		} catch (error) {
			console.error("Error creating order:", error);
			throw error;
		} finally {
			setTimeout(() => {
				isCreatingOrder.current = false;
			}, 5000);
		}
	};

	const handlePaystackPayment = usePaystackCheckout({
		email: formik.values.emailAddress,
		amount: total,
		formData: {
			...formik.values,
			clerkUserId: user?.id || null,
			clerkUserName:
				user?.fullName ||
				`${formik.values.firstName} ${formik.values.lastName}`,
			shippingCost: shipping,
			subtotal,
			shippingAddress: getShippingAddress(),
			total,
			paymentMethod: "paystack",
		},
		items: useBasketStore.getState().items.map((item) => ({
			_id: item.product._id,
			quantity: item.quantity,
			name: item.product.name,
			price: item.product.price,
			selectedColor: item.selectedColor
				? {
						colorId: item.selectedColor._id,
						colorTitle: item.selectedColor.title,
					}
				: undefined,
		})),
		onSuccess: async (ref) => {
			setIsProcessing(true);
			try {
				const result = await createOrderInDatabase(
					ref.reference,
					"paystack",
				);
				useBasketStore.getState().clearBasket();
				router.push(
					`/success?orderNumber=${result.order?.orderNumber}&reference=${ref.reference}`,
				);
			} catch (error: any) {
				setIsProcessing(false);
				if (error.message?.includes("Insufficient stock")) {
					toast.error(error.message, {
						duration: 6000,
						description: "Please update your cart and try again.",
					});
					router.push("/basket");
				} else if (error.message?.includes("not found")) {
					toast.error(
						"Some items in your cart are no longer available",
						{ duration: 5000 },
					);
					router.push("/basket");
				} else {
					toast.error(
						"Payment received but order creation failed. Contact support with reference: " +
							ref.reference,
						{ duration: 8000 },
					);
				}
			}
		},
		// onSuccess: async (ref) => {
		// 	const toastId = toast.loading("Processing your order...");

		// 	try {
		// 		const result = await createOrderInDatabase(
		// 			ref.reference,
		// 			"paystack",
		// 		);
		// 		toast.dismiss(toastId);
		// 		toast.success("Payment successful! Order created.");
		// 		useBasketStore.getState().clearBasket();
		// 		router.push(
		// 			`/success?orderNumber=${result.order?.orderNumber}&reference=${ref.reference}`,
		// 		);
		// 	} catch (error: any) {
		// 		toast.dismiss(toastId);
		// 		console.error("Error creating order:", error);

		// 		if (error.message?.includes("Insufficient stock")) {
		// 			toast.error(error.message, {
		// 				duration: 6000,
		// 				description: "Please update your cart and try again.",
		// 			});
		// 			router.push("/basket");
		// 		} else if (error.message?.includes("not found")) {
		// 			toast.error(
		// 				"Some items in your cart are no longer available",
		// 				{ duration: 5000 },
		// 			);
		// 			router.push("/basket");
		// 		} else {
		// 			toast.error(
		// 				"Payment received but order creation failed. Contact support with reference: " +
		// 					ref.reference,
		// 				{ duration: 8000 },
		// 			);
		// 		}
		// 	}
		// },
		onClose: () => {
			toast.info("Payment cancelled");
		},
	});

	const handlePayPalSuccess = async (details: any) => {
		const toastId = toast.loading("Processing your order...");

		try {
			const result = await createOrderInDatabase(details.id, "paypal");

			toast.dismiss(toastId);

			// Handle duplicate order
			if (result.isDuplicate) {
				toast.info("Order already processed. Redirecting...");
			} else {
				toast.success("PayPal payment successful! Order created.");
			}

			// Clear basket and redirect
			useBasketStore.getState().clearBasket();
			// router.push(`/order-pending?reference=${details.id}`);
			router.push(
				`/success?orderNumber=${result.order?.orderNumber}&reference=${ref.reference}`,
			);
		} catch (error: any) {
			toast.dismiss(toastId);
			console.error("Error processing PayPal order:", error);

			// Handle specific error types
			if (error.message?.includes("Insufficient stock")) {
				toast.error(error.message, {
					duration: 6000,
					description: "Please update your cart and try again.",
				});
				router.push("/basket");
			} else if (error.message?.includes("not found")) {
				toast.error("Some items in your cart are no longer available", {
					duration: 5000,
				});
				router.push("/basket");
			} else {
				toast.error(
					"Payment received but order creation failed. Please contact support with reference: " +
						details.id,
					{ duration: 8000 },
				);
			}
		}
	};

	return (
		<div className="h-auto w-full bg-gray-50">
			<Header />
			<div className="flex flex-col md:flex-row w-full px-6 md:px-20 py-25 md:py-40 gap-8">
				<div className="w-full md:w-[60%] bg-[#2D5A43] rounded-sm p-5 md:p-12">
					<h1 className="text-3xl text-white font-semibold text-center tracking-wide mb-5 md:mb-10">
						Checkout
					</h1>
					<BillingForm
						formik={formik}
						onPaystack={handlePaystackPayment}
						onPayPal={handlePayPalSuccess}
						totalAmount={total}
					/>
				</div>

				<OrderSummary shipping={shipping} total={total} />
			</div>
			<Footer />
			<ProcessingOverlay isVisible={isProcessing} />
		</div>
	);
};

// export default CheckoutPage;
export default dynamic(() => Promise.resolve(CheckoutPage), { ssr: false });
