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
// `remoteBindings: true` makes dev hit the same remote D1 (and other bindings flagged `"remote": true`)
// instead of an empty local copy, so `pnpm dev` mirrors production data.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev({ remoteBindings: true });
