import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/request-ip";

export const dynamic = "force-dynamic";

/**
 * Tells the browser its own public IP. The checkout tucks it into the Paystack
 * metadata so the webhook — whose request comes from Paystack, not the
 * shopper — can still put the shopper's address on the Snap Conversions API
 * purchase. Snap grades Purchase events on IP coverage, and without this the
 * webhook path (which usually wins the fulfilment race) sends none.
 */
export async function GET(req: Request) {
	return NextResponse.json(
		{ ip: clientIpFromRequest(req) },
		{ headers: { "Cache-Control": "no-store" } },
	);
}
