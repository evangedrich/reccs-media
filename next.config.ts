import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["@vercel/og"],
	webpack: (config, { isServer }) => {
		if (isServer) {
			const externals = Array.isArray(config.externals) ? config.externals : [];
			config.externals = [
				...externals,
				"next/dist/compiled/@vercel/og",
				"@vercel/og",
				"next/og",
			];
		}
		return config;
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
