import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { handleStoreLock } from "@/lib/store-lock";

const isProtectedRoute = createRouteMatcher([
	"/account(.*)",
]);

/** The routes Clerk ran on before the store lock widened the matcher. */
const isClerkRoute = createRouteMatcher([
	"/account(.*)",
	"/checkout(.*)",
	"/order-pending(.*)",
	"/success(.*)",
	"/(api|trpc)(.*)",
]);

const clerk = clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
	const lock = handleStoreLock(req);
	if (lock) return lock;
	if (isClerkRoute(req)) return clerk(req, event);
}

export const config = {
	matcher: [
		// Every page (for the store lock), skipping Next internals and static files.
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml|map)).*)",
		"/(api|trpc)(.*)",
	],
};
