import WaitingRoom from "@/components/sections/WaitingRoom";

/**
 * Shown in place of every store page while the store is locked before a sale.
 * Visitors never see this URL: the proxy rewrites to it (src/lib/store-lock.ts).
 */
export default function ComingSoonPage() {
	return <WaitingRoom />;
}
