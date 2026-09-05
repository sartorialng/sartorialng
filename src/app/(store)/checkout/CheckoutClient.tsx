"use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { calculateShipping } from "@/lib/helper";
import { useFormik } from "formik";
import { useBasketStore } from "@/store/store";
import OrderSummary from "@/components/layout/OrderSummary";
import BillingForm from "@/components/form/BillingForm";
import { billingSchema } from "@/lib/validation-schemas";
import {
	generatePaystackReference,
	usePaystackCheckout,
	type PaystackOrderMetadata,
} from "@/lib/paystack";
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
import { fetchFreshProducts } from "@/lib/refreshProducts";
// import SalesTCModal from "@/components/modals/SalesTCModal";

const CheckoutClient = () => {
	const isCreatingOrder = useRef(false);
	const router = useRouter();
	const { user } = useUser();
	const subtotal = useBasketStore((s) => s.getTotalPrice());
	const [isProcessing, setIsProcessing] = useState(false);
	// One reference per payment attempt. Regenerated when a customer closes the
	// popup and retries, since Paystack rejects a reference it has already seen.
	const [paystackReference, setPaystackReference] = useState(
		generatePaystackReference,
	);
	// const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

	// Basket lines carry a copy of the product taken when it was added, so the
	// order summary would otherwise show whatever the price was that day. Read
	// them back on arrival; the Checkout button refreshes again before paying.
	useEffect(() => {
		const items = useBasketStore.getState().items;
		if (items.length === 0) return;

		let cancelled = false;
		fetchFreshProducts(items.map((item) => item.product._id))
			.then((fresh) => {
				if (!cancelled) {
					useBasketStore.getState().refreshProducts(fresh);
				}
			})
			.catch(() => {
				// Non-fatal: the pre-payment check reads Sanity directly.
			});

		return () => {
			cancelled = true;
		};
	}, []);

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

	const imageAssetRef = (image: unknown) =>
		(image as { asset?: { _ref?: string } } | undefined)?.asset?._ref ?? null;

	/** Single source of truth for the line items, shared by the order payload
	 * and the Paystack metadata so both paths describe the same cart. */
	const buildOrderLines = () => {
		const basketItems = useBasketStore.getState().items;

		return [
			...basketItems.map((item) => {
				const image =
					(item.selectedColor &&
						item.product.images?.find(
							(img: any) =>
								img.color?._ref === item.selectedColor?._id,
						)) ||
					item.product.images?.[0];

				return {
					_id: item.product._id,
					name: item.product.name ?? "",
					price: item.product.onSale
						? (item.product.salePrice ?? 0)
						: (item.product.price ?? 0),
					quantity: item.quantity,
					isFreeGift: false,
					imageRef: imageAssetRef(image),
					selectedColor: item.selectedColor
						? {
								colorId: item.selectedColor._id,
								colorTitle: item.selectedColor.title ?? "",
							}
						: null,
				};
			}),
			...getFreeGiftLines(basketItems).map((line) => ({
				_id: line.product._id,
				name: line.product.name ?? "",
				price: 0,
				quantity: line.quantity,
				isFreeGift: true,
				imageRef: imageAssetRef(line.product.images?.[0]),
				selectedColor: null,
			})),
		];
	};

	const resolvedShippingAddress = () => {
		const alt = formik.values.shipToDifferentAddress;
		return {
			address: alt
				? formik.values.shippingAddress
				: formik.values.address,
			city: alt ? formik.values.shippingArea : formik.values.area,
			state: alt ? formik.values.shippingState : formik.values.state,
			country: alt
				? formik.values.shippingCountry
				: formik.values.country,
			postalCode: alt
				? formik.values.shippingPostalCode
				: formik.values.postalCode,
			phone: alt ? formik.values.shippingPhoneNo : formik.values.phoneNo,
			secondaryPhone: alt
				? formik.values.shippingSecondaryPhoneNo
				: formik.values.secondaryPhoneNo,
		};
	};

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
					items: buildOrderLines(),
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
			isCreatingOrder.current = false;
		}
	};

	/**
	 * The customer's money is already gone by the time this runs, so it gets
	 * three chances: the rich payload from this form, then a server-side
	 * re-verify that rebuilds the order from Paystack's own copy of the
	 * metadata, then polling in case the webhook got there first. All three are
	 * idempotent server-side, so overlapping attempts can't double-charge or
	 * double-email.
	 */
	const confirmOrder = async (reference: string, paymentMethod: string) => {
		try {
			const data = await createOrderInDatabase(reference, paymentMethod);
			if (data?.order?.orderNumber) return data;
		} catch (error) {
			console.error("Primary order creation failed:", error);
		}

		try {
			const res = await fetch("/api/paystack/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reference }),
			});
			const data = await res.json();
			if (data.status === "success") return data;
		} catch (error) {
			console.error("Server-side verification failed:", error);
		}

		for (let attempt = 0; attempt < 5; attempt++) {
			await new Promise((resolve) => setTimeout(resolve, 3000));
			try {
				const res = await fetch(
					`/api/orders/check-order?reference=${encodeURIComponent(reference)}`,
				);
				const data = await res.json();
				if (data.status === "success") return data;
			} catch {
				// Keep polling — the webhook may still be in flight.
			}
		}

		return null;
	};

	const paystackMetadata: PaystackOrderMetadata = {
		email: formik.values.emailAddress,
		customerName:
			user?.fullName ||
			`${formik.values.firstName} ${formik.values.lastName}`,
		firstName: formik.values.firstName,
		clerkUserId: user?.id || null,
		subtotal,
		shipping,
		vat,
		total,
		amountDiscount: discount,
		couponCode: couponStatus === "success" ? couponCode : null,
		orderNote: formik.values.orderNote || null,
		shippingAddress: resolvedShippingAddress(),
		interstateDeliveryType: formik.values.interstateDeliveryType || null,
		gigPark: formik.values.shipToDifferentAddress
			? formik.values.shippingGigPark
			: formik.values.gigPark,
		// Carried to the server so the Snap Conversions API purchase can still be
		// matched to this shopper — the webhook cannot read their cookies.
		snapScid:
			typeof document !== "undefined"
				? (() => {
						const m = document.cookie.match(/_scid=([^;]+)/);
						return m ? decodeURIComponent(m[1]) : null;
					})()
				: null,
		snapUserAgent:
			typeof navigator !== "undefined" ? navigator.userAgent : null,
		items: buildOrderLines(),
	};

	const handlePaystackPayment = usePaystackCheckout({
		email: formik.values.emailAddress,
		amount: total,
		reference: paystackReference,
		order: paystackMetadata,
		onSuccess: async (ref) => {
			setIsProcessing(true);
			const reference = ref?.reference || paystackReference;

			if (formik.values.hasRegistered) {
				await createAccount();
			}

			const basketItems = useBasketStore.getState().items;
			const result = await confirmOrder(reference, "paystack");
			const orderNumber = result?.order?.orderNumber;

			trackTikTokEvent({
				event_name: "Purchase",
				value: total,
				currency: "NGN",
				url: window.location.href,
				order_id: orderNumber,
				email: formik.values.emailAddress,
				contents: basketItems.map((item) => ({
					content_id: item.product._id ?? "",
					content_type: "product" as const,
					content_name: item.product.name ?? undefined,
					quantity: item.quantity,
					price: item.product.price ?? 0,
				})),
			});
			snapPurchase({
				transaction_id: orderNumber ?? reference,
				// The server sends this same reference as its Snap event_id.
				dedup_id: reference,
				item_ids: basketItems.map((item) => item.product._id ?? ""),
				price: total,
				currency: "NGN",
				number_items: basketItems.reduce(
					(sum, item) => sum + item.quantity,
					0,
				),
			});

			useBasketStore.getState().clearBasket();

			// Payment succeeded either way — never send the customer away with
			// an error. The success page keeps trying if we have no number yet.
			router.push(
				`/success?${new URLSearchParams({
					...(orderNumber ? { orderNumber } : {}),
					reference,
				}).toString()}`,
			);
		},
		onClose: () => {
			setPaystackReference(generatePaystackReference());
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
				// PayPal's order id is the paymentReference the server fulfils under,
				// so it is what the server sends as its Snap event_id.
				dedup_id: details.id,
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
