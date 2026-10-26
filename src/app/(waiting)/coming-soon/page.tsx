import WaitingRoom from "@/components/sections/WaitingRoom";

// Rendered per request so it goes out as no-store: a cached copy would keep
// Cloudflare showing the countdown on "/" after the store opens.
export const dynamic = "force-dynamic";

/**
 * Shown in place of every store page while the store is locked before a sale.
 * Visitors never see this URL: the proxy rewrites to it (src/lib/store-lock.ts).
 */
export default function ComingSoonPage() {
	return <WaitingRoom />;
}
