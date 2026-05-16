"use client";
import dynamic from "next/dynamic";

const CheckoutPage = dynamic(() => import("./CheckoutClient"), { ssr: false });

export default CheckoutPage;
