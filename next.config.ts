import type { NextConfig } from "next";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.snapchat.com https://*.sc-static.net;
    connect-src 'self' https://*.snapchat.com https://*.sc-static.net;
    img-src 'self' https://*.snapchat.com https://*.sc-cdn.net;
    frame-src 'self' https://*.snapchat.com;
    style-src 'self' 'unsafe-inline';
`
	.replace(/\s{2,}/g, " ")
	.trim();

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
			{
				protocol: "https",
				hostname: "cdn.sanity.io",
			},
			{
				protocol: "https",
				hostname: "www.facebook.com",
			},
			{
				protocol: "https",
				hostname: "upload.wikimedia.org",
				pathname: "/wikipedia/commons/**",
			},
		],
	},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value: cspHeader,
					},
				],
			},
		];
	},
};

export default nextConfig;
