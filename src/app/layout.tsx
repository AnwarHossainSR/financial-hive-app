import { Providers } from "@/components/Providers";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#1E3A8A" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Financial Hive - Smart Money Management",
    template: "%s | Financial Hive",
  },
  description:
    "Track and manage your finances with ease. Financial Hive helps you monitor income, expenses, budgets, and achieve your financial goals.",
  keywords: [
    "finance tracker",
    "expense management",
    "budget planner",
    "money management",
    "personal finance",
    "income tracker",
    "cashbook",
    "financial planning",
  ],
  authors: [{ name: "Financial Hive" }],
  creator: "Financial Hive",
  publisher: "Financial Hive",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://financial-hive.vercel.app"
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Financial Hive",
    title: "Financial Hive - Smart Money Management",
    description:
      "Track and manage your finances with ease. Monitor income, expenses, and budgets all in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Hive - Smart Money Management",
    description:
      "Track and manage your finances with ease. Monitor income, expenses, and budgets all in one place.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
