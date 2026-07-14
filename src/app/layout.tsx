import type { Metadata } from "next";
import { juliaMonoSubset, notoMalayalam, notoTibetan, notoCanadian, notoArabic, notoTamil, notoTelugu } from "./fonts/fonts";
import "./globals.css";

// Every conditional script font's CSS variable is registered once on <html>, so its
// @font-face + `--font-noto-*` variable exist site-wide. checkFont() returns utility
// classes (globals.css) that read these; the woff2 files stay lazy (preload: false).
const scriptFontVars = [notoMalayalam, notoTibetan, notoCanadian, notoArabic, notoTamil, notoTelugu]
  .map((f) => f.variable)
  .join(" ");

// Body-font stack: the preloaded, comprehensively-subset JuliaMono renders first;
// generic monospace then sans-serif are the universal OS safety net. The full 1 MB
// JuliaMono is deliberately NOT in this stack — because it carries no unicode-range,
// listing it made the browser download the whole 1 MB weight just to discover it
// lacks a foreign glyph (e.g. ﷺ, ＋, CJK titles) before falling through to a system
// font. The subset is regenerated from all source text on every deploy, so it always
// covers what JuliaMono can render; anything it can't now falls straight to the OS.
const juliaMonoStack =
  `${juliaMonoSubset.style.fontFamily}, monospace, sans-serif`;
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
