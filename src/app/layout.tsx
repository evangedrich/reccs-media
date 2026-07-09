import type { Metadata } from "next";
import { juliaMonoSubset, juliaMonoFull, notoMalayalam, notoTibetan, notoCanadian, notoArabic, notoTamil, notoTelugu } from "./fonts/fonts";
import "./globals.css";

// Every conditional script font's CSS variable is registered once on <html>, so its
// @font-face + `--font-noto-*` variable exist site-wide. checkFont() returns utility
// classes (globals.css) that read these; the woff2 files stay lazy (preload: false).
const scriptFontVars = [notoMalayalam, notoTibetan, notoCanadian, notoArabic, notoTamil, notoTelugu]
  .map((f) => f.variable)
  .join(" ");

// Layered body-font stack: the preloaded subset renders first; the full JuliaMono
// lazily covers any glyph missing from the subset (same metrics, no shift); generic
// monospace then sans-serif are the universal OS safety net so nothing is ever tofu.
const juliaMonoStack =
  `${juliaMonoSubset.style.fontFamily}, ${juliaMonoFull.style.fontFamily}, monospace, sans-serif`;
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ViewProvider } from "@/app/lib/viewContext";

export const metadata: Metadata = {
	title: {
    template: "%s - Reccs",
    default: "Reccs",
  },
	description: "A geoscheme-based media library",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={scriptFontVars} style={{ '--font-julia-mono': juliaMonoStack } as React.CSSProperties}>
			<body className="antialiased flex flex-col min-h-screen">
				<ViewProvider>
					<Header />
					<main className="flex-grow mb-[-2px] flex flex-col">
						{children}
					</main>
					<Footer />
				</ViewProvider>
			</body>
		</html>
	);
}
