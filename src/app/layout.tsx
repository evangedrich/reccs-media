import type { Metadata } from "next";
import { juliaMono } from "./fonts/fonts";
import "./globals.css";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import { ViewProvider } from "@/app/lib/viewContext";

export const metadata: Metadata = {
	title: "Reccs",
	description: "A geoscheme-based media library",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={juliaMono.variable}>
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
