"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Script from "next/script";

const SNAP_PIXEL_ID = "31bfe258-9f77-46a0-b0d0-c1a3f9fdd715";

declare global {
	interface Window {
		snaptr: (...args: unknown[]) => void;
	}
}

export default function SnapPixel() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const isMounted = useRef(false);

	useEffect(() => {
		if (!isMounted.current) {
			isMounted.current = true;
			return;
		}

		if (typeof window.snaptr === "function") {
			const scidMatch = document.cookie.match(/_scid=([^;]+)/);
			const uuid_c1 = scidMatch ? decodeURIComponent(scidMatch[1]) : undefined;
			window.snaptr("track", "PAGE_VIEW", uuid_c1 ? { uuid_c1 } : {});
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
                snaptr('init', '${SNAP_PIXEL_ID}', uuid_c1 ? { uuid_c1: uuid_c1 } : {});
                snaptr('track', 'PAGE_VIEW');
            `}
		</Script>
	);
}
