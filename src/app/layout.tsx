import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	title: "dotmd — ANYTHING.md directory",
	description: "Browse, share, and remix AGENTS.md, SOUL.md, and every agent config in one place.",
	metadataBase: new URL("https://dotmd.directory"),
	robots: {
		index: true,
		follow: true,
	},
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: SITE_NAME,
		title: "dotmd — ANYTHING.md directory",
		description: SITE_TAGLINE,
		url: "https://dotmd.directory",
		images: [
			{
				url: "/opengraph-image.png",
				width: 1200,
				height: 630,
				alt: "dotmd — ANYTHING.md directory",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "dotmd — ANYTHING.md directory",
		description: SITE_TAGLINE,
		images: ["/opengraph-image.png"],
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
			<head>
				<meta name="color-scheme" content="dark" />
			</head>
			<body className="min-h-screen bg-bg-base font-sans text-text-primary antialiased">
				<NuqsAdapter>
					<div className="flex min-h-screen flex-col">
						<Header />
						<main className="flex-1">{children}</main>
						<Footer />
					</div>
				</NuqsAdapter>
			<Analytics />
			</body>
		</html>
	);
}
