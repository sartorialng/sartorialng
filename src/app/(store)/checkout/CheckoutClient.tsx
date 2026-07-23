"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { calculateShipping } from "@/lib/helper";
import { useFormik } from "formik";
import { useBasketStore } from "@/store/store";
import OrderSummary from "@/components/layout/OrderSummary";
import BillingForm from "@/components/form/BillingForm";
import { billingSchema } from "@/lib/validation-schemas";
import { usePaystackCheckout } from "@/lib/paystack";
import type { BillingFormValues } from "@/lib/types/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import ProcessingOverlay from "@/components/layout/ProcessingOverlay";
import { trackTikTokEvent } from "@/lib/tiktok-events";
import { snapInitiateCheckout, snapPurchase } from "@/lib/snap-events";
import { setSnapUser } from "@/lib/snap-user";
import { getFreeGiftLines } from "@/lib/freeGift";
// import SalesTCModal from "@/components/modals/SalesTCModal";

const CheckoutClient = () => {
	const isCreatingOrder = useRef(false);
	const router = useRouter();
	const { user } = useUser();
	const subtotal = useBasketStore((s) => s.getTotalPrice());
	const [isProcessing, setIsProcessing] = useState(false);
	// const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

	const formik = useFormik<BillingFormValues>({
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
			secondaryPhoneNo: "",
			emailAddress: "",
			saveInfo: false,
			shipToDifferentAddress: false,
			hasRegistered: false,
			interstateDeliveryType: "pickup" as "pickup" | "doorstep",
			gigPark: "",
			shippingGigPark: "",
			// hasReadTC: false,
			receiverFirstName: "",
			receiverLastName: "",
			shippingAddress: "",
			shippingCountry: "",
			shippingState: "",
			shippingArea: "",
			shippingApartment: "",
			shippingPostalCode: "",
			shippingPhoneNo: "",
			shippingSecondaryPhoneNo: "",
			orderNote: "",
		},
		validationSchema: billingSchema,
		onSubmit: () => console.log("Form Data Submitted"),
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
		deliveryType: formik.values.interstateDeliveryType,
	});

	const { country } = getShippingAddress();

	const [couponCode, setCouponCode] = useState("");
	const [discountPercentage, setDiscountPercentage] = useState(0);
	const [couponStatus, setCouponStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [couponMessage, setCouponMessage] = useState("");

	const userEmail =
		formik.values.emailAddress ||
		user?.emailAddresses?.[0]?.emailAddress ||
		"";

	// Feed the billing details into Snap's advanced matching as they are typed, so
	// START_CHECKOUT (and any later add-to-cart on this browser) carries identity —
	// not just the PURCHASE at the end.
	useEffect(() => {
		setSnapUser({
			email: userEmail,
			phone: formik.values.phoneNo,
			firstName: formik.values.firstName,
			lastName: formik.values.lastName,
			city: formik.values.area,
			state: formik.values.state,
			postalCode: formik.values.postalCode,
			country: formik.values.country,
		});
	}, [
		userEmail,
		formik.values.phoneNo,
		formik.values.firstName,
		formik.values.lastName,
		formik.values.area,
		formik.values.state,
		formik.values.postalCode,
		formik.values.country,
	]);

	const handleApplyCoupon = async () => {
		setCouponStatus("loading");
		setCouponMessage("");

		try {
			const res = await fetch("/api/coupon/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: couponCode, email: userEmail }),
			});

			const data = await res.json();

			if (!res.ok || !data.valid) {
				setCouponStatus("error");
				setCouponMessage(data.message || "Invalid coupon code.");
				setDiscountPercentage(0);
				return;
			}

			const percentage = Number(data.discountValue) || 0;

			setDiscountPercentage(percentage);
			setCouponStatus("success");
			setCouponMessage(data.message || "Coupon applied successfully!");
		} catch {
			setCouponStatus("error");
			setCouponMessage("Something went wrong. Please try again.");
			setDiscountPercentage(0);
		}
	};

	const hasComboItem = useBasketStore((s) => s.hasComboItem());

	const isEligibleForFreeShipping =
		hasComboItem || (country === "Nigeria" && subtotal >= 200000);

	const shipping = isEligibleForFreeShipping
		? 0
		: calculateShipping(getShippingAddress());

	const baseAmount = (subtotal || 0) + (shipping || 0);

	const discount = Math.round((discountPercentage / 100) * baseAmount);

	const discountedSubtotal =
		(subtotal || 0) -
		Math.round((discountPercentage / 100) * (subtotal || 0));
	const vatBase = discountedSubtotal;
	const vat = Math.round(0.075 * vatBase);

	const total = baseAmount - discount + vat;

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
					items: [
						...useBasketStore.getState().items.map((item) => ({
							_id: item.product._id,
							quantity: item.quantity,
							name: item.product.name,
							price: item.product.onSale
								? (item.product.salePrice ?? 0)
								: (item.product.price ?? 0),
							image:
								(item.selectedColor &&
									item.product.images?.find(
										(img: any) =>
											img.color?._ref ===
											item.selectedColor?._id,
									)) ||
								item.product.images?.[0],
							selectedColor: item.selectedColor
								? {
										colorId: item.selectedColor._id,
										colorTitle: item.selectedColor.title,
									}
								: undefined,
							isFreeGift: false,
						})),
						...getFreeGiftLines(
							useBasketStore.getState().items,
						).map((line) => ({
							_id: line.product._id,
							quantity: line.quantity,
							name: line.product.name,
							price: 0,
							image: line.product.images?.[0],
							selectedColor: undefined,
							isFreeGift: true,
						})),
					],
					paymentReference,
					paymentMethod,
					total,
					shipping,
					subtotal,
					amountDiscount: discount,
					couponCode: couponStatus === "success" ? couponCode : null,
					vat,
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
		items: [
			...useBasketStore.getState().items.map((item) => ({
				_id: item.product._id,
				quantity: item.quantity,
				name: item.product.name,
				price: item.product.onSale
					? (item.product.salePrice ?? 0)
					: (item.product.price ?? 0),
				selectedColor: item.selectedColor
					? {
							colorId: item.selectedColor._id,
							colorTitle: item.selectedColor.title,
						}
					: undefined,
				isFreeGift: false,
			})),
			...getFreeGiftLines(useBasketStore.getState().items).map((line) => ({
				_id: line.product._id,
				quantity: line.quantity,
				name: line.product.name,
				price: 0,
				selectedColor: undefined,
				isFreeGift: true,
			})),
		],
		onSuccess: async (ref) => {
			setIsProcessing(true);
			try {
				if (formik.values.hasRegistered) {
					await createAccount();
				}

				const result = await createOrderInDatabase(
					ref.reference,
					"paystack",
				);
				trackTikTokEvent({
					event_name: "Purchase",
					value: total,
					currency: "NGN",
					url: window.location.href,
					order_id: result.order?.orderNumber,
					email: formik.values.emailAddress,
					contents: useBasketStore.getState().items.map((item) => ({
						content_id: item.product._id ?? "",
						content_type: "product" as const,
						content_name: item.product.name ?? undefined,
						quantity: item.quantity,
						price: item.product.price ?? 0,
					})),
				});
				snapPurchase({
					transaction_id: result.order?.orderNumber ?? ref.reference,
					item_ids: useBasketStore
						.getState()
						.items.map((item) => item.product._id ?? ""),
					price: total,
					currency: "NGN",
					number_items: useBasketStore
						.getState()
						.items.reduce((sum, item) => sum + item.quantity, 0),
				});
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
				} else if (error.message?.includes("not found")) {
					toast.error(
						"Some items in your cart are no longer available",
						{ duration: 5000 },
					);
				} else {
					toast.error(
						"Payment received but order creation failed. Contact support with reference: " +
							ref.reference,
						{ duration: 8000 },
					);
				}
			}
		},
		onClose: () => {
			toast.info("Payment cancelled");
		},
	});

	const handlePayPalSuccess = async (details: any) => {
		setIsProcessing(true);
		if (formik.values.hasRegistered) {
			createAccount();
		}

		try {
			const result = await createOrderInDatabase(details.id, "paypal");

			if (result.isDuplicate) {
				toast.info("Order already processed. Redirecting...");
			} else {
				toast.success("PayPal payment successful! Order created.");
			}

			trackTikTokEvent({
				event_name: "Purchase",
				value: total,
				currency: "USD",
				url: window.location.href,
				order_id: result.order?.orderNumber,
				email: formik.values.emailAddress,
				contents: useBasketStore.getState().items.map((item) => ({
					content_id: item.product._id ?? "",
					content_type: "product" as const,
					content_name: item.product.name ?? undefined,
					quantity: item.quantity,
					price: item.product.price ?? 0,
				})),
			});
			snapPurchase({
				transaction_id: result.order?.orderNumber ?? details.id,
				item_ids: useBasketStore
					.getState()
					.items.map((item) => item.product._id ?? ""),
				price: total,
				currency: "USD",
				number_items: useBasketStore
					.getState()
					.items.reduce((sum, item) => sum + item.quantity, 0),
			});
			useBasketStore.getState().clearBasket();
			router.push(
				`/success?orderNumber=${result.order?.orderNumber}&reference=${details.id}`,
			);
		} catch (error: any) {
			setIsProcessing(false);

			console.error(
				"Error processing PayPal order:",
				JSON.stringify(error),
			);

			if (error.message?.includes("Insufficient stock")) {
				toast.error(error.message, {
					duration: 6000,
					description: "Please update your cart and try again.",
				});
			} else if (error.message?.includes("not found")) {
				toast.error("Some items in your cart are no longer available", {
					duration: 5000,
				});
			} else {
				toast.error(
					"Payment received but order creation failed. Please contact support with reference: " +
						details.id,
					{ duration: 8000 },
				);
			}
		}
	};

	const createAccount = async () => {
		try {
			const res = await fetch("/api/customer", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...formik.values }),
			});

			if (!res.ok) {
				const data = await res.json();
				console.error("Account creation failed:", data);
			}
		} catch (error) {
			console.error("Background account creation failed:", error);
		}
	};

	useEffect(() => {
		const fireEvent = () => {
			trackTikTokEvent({
				event_name: "InitiateCheckout",
				value: subtotal,
				currency: "NGN",
				url: window.location.href,
			});
			snapInitiateCheckout({
				price: subtotal,
				currency: "NGN",
				number_items: useBasketStore
					.getState()
					.items.reduce((sum, item) => sum + item.quantity, 0),
			});
		};

		if (window.ttq) {
			fireEvent();
		} else {
			const interval = setInterval(() => {
				if (window.ttq) {
					fireEvent();
					clearInterval(interval);
				}
			}, 500);
			return () => clearInterval(interval);
		}
	}, []);

	return (
		<div className="flex flex-col bg-gray-50 w-full min-h-screen">
			<Header />
			<main className="flex-1">
				<div className="flex flex-col md:flex-row w-full px-6 md:px-20 py-25 md:py-30 gap-8">
					<div className="w-full md:w-[60%] bg-[#2D5A43] rounded-sm p-5 md:p-12 max-h-[80vh] overflow-y-auto custom-scrollbar">
						<h1 className="text-2xl md:text-3xl text-white font-semibold text-center tracking-wide mb-5 md:mb-10">
							Checkout
						</h1>
						<BillingForm
							formik={formik}
							onPaystack={handlePaystackPayment}
							onPayPal={handlePayPalSuccess}
							totalAmount={total}
							// setIsSalesModalOpen={setIsSalesModalOpen}
						/>
					</div>

					<OrderSummary
						shipping={shipping}
						total={total}
						couponCode={couponCode}
						setCouponCode={setCouponCode}
						discount={discount}
						couponStatus={couponStatus}
						couponMessage={couponMessage}
						onApplyCoupon={handleApplyCoupon}
						vat={vat}
					/>
				</div>
			</main>
			<Footer />
			<ProcessingOverlay isVisible={isProcessing} />
			{/* <SalesTCModal
				isSalesModalOpen={isSalesModalOpen}
				setIsSalesModalOpen={setIsSalesModalOpen}
			/> */}
		</div>
	);
};

export default CheckoutClient;
