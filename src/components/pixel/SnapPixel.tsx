"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Script from "next/script";
import { useUser } from "@clerk/nextjs";
import { getSnapUserParams, setSnapUser } from "@/lib/snap-user";
import { snapSignUp } from "@/lib/snap-events";

const SNAP_PIXEL_ID = "31bfe258-9f77-46a0-b0d0-c1a3f9fdd715";

declare global {
	interface Window {
		snaptr: (...args: unknown[]) => void;
	}
}

export default function SnapPixel() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user, isSignedIn } = useUser();
	const isMounted = useRef(false);
	const didInitWithIdentity = useRef(false);

	// Depend on primitives, not Clerk's user object: its reference is not
	// guaranteed stable across renders, and an unstable dep here would re-run
	// these effects (and re-init the pixel) on every render.
	const clerkUserId = user?.id;
	const clerkEmail = user?.primaryEmailAddress?.emailAddress;
	const clerkPhone = user?.primaryPhoneNumber?.phoneNumber;
	const clerkFirstName = user?.firstName;
	const clerkLastName = user?.lastName;
	const clerkCreatedAt = user?.createdAt
		? new Date(user.createdAt).getTime()
		: undefined;

	// A signed-in shopper is the strongest identity signal we get for free.
	useEffect(() => {
		if (!isSignedIn || !clerkUserId) return;
		setSnapUser({
			email: clerkEmail,
			phone: clerkPhone,
			firstName: clerkFirstName,
			lastName: clerkLastName,
		});

		// Clerk's modal gives no "just registered" callback, so treat a freshly
		// created account as a sign-up and guard against re-firing on later visits.
		if (!clerkCreatedAt) return;
		if (Date.now() - clerkCreatedAt > 5 * 60 * 1000) return;

		const firedKey = `snap_signup_fired_${clerkUserId}`;
		try {
			if (window.localStorage.getItem(firedKey)) return;
			window.localStorage.setItem(firedKey, "1");
		} catch {
			return;
		}
		snapSignUp({ sign_up_method: "clerk" });
	}, [
		isSignedIn,
		clerkUserId,
		clerkEmail,
		clerkPhone,
		clerkFirstName,
		clerkLastName,
		clerkCreatedAt,
	]);

	// The inline init below runs before Clerk hydrates and before localStorage is
	// read, so re-init once identity becomes known. Every track call also carries
	// the params directly, so this is belt-and-braces — fire it once, not per route.
	useEffect(() => {
		if (didInitWithIdentity.current) return;
		if (typeof window.snaptr !== "function") return;
		const userParams = getSnapUserParams();
		if (Object.keys(userParams).length === 0) return;

		const scidMatch = document.cookie.match(/_scid=([^;]+)/);
		const uuid_c1 = scidMatch ? decodeURIComponent(scidMatch[1]) : undefined;
		window.snaptr("init", SNAP_PIXEL_ID, {
			...(uuid_c1 ? { uuid_c1 } : {}),
			...userParams,
		});
		didInitWithIdentity.current = true;
	}, [isSignedIn, clerkUserId, pathname]);

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}

		if (typeof window.snaptr === "function") {
			const scidMatch = document.cookie.match(/_scid=([^;]+)/);
			const uuid_c1 = scidMatch ? decodeURIComponent(scidMatch[1]) : undefined;
			window.snaptr("track", "PAGE_VIEW", {
				...(uuid_c1 ? { uuid_c1 } : {}),
				...getSnapUserParams(),
			});
		}
	}, [pathname, searchParams]);

	return (
		<Script id="snapchat-pixel" strategy="afterInteractive">
			{`
                (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
                {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
                a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;
                r.src=n;var u=t.getElementsByTagName(s)[0];
                u.parentNode.insertBefore(r,u);})(window,document,
                'https://sc-static.net/scevent.min.js');

                var scidMatch = document.cookie.match(/_scid=([^;]+)/);
                var uuid_c1 = scidMatch ? decodeURIComponent(scidMatch[1]) : undefined;

                // Returning shopper: replay the identity captured on an earlier visit
                // so even the first PAGE_VIEW of this session is matchable.
                var userParams = {};
                try {
                    var stored = window.localStorage.getItem('snap_user_params');
                    var parsed = stored ? JSON.parse(stored) : null;
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        userParams = parsed;
                    }
                } catch (e) {}

                if (uuid_c1) userParams.uuid_c1 = uuid_c1;
                snaptr('init', '${SNAP_PIXEL_ID}', userParams);
                snaptr('track', 'PAGE_VIEW', userParams);
            `}
		</Script>
	);
}
