import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
	"/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
	matcher: [
		"/account(.*)",
		"/checkout(.*)",
		"/order-pending(.*)",
		"/success(.*)",
		"/(api|trpc)(.*)",
	],
};
