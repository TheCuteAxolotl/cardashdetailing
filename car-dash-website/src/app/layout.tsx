import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./scroll-reveal.css";
import SiteChrome from "@/components/SiteChrome";
import StructuredData from "@/components/StructuredData";
import { localBusinessSchema, SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/site-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Car Dash Detailing | Mobile Detailing in South Elgin, IL",
    template: "%s | Car Dash Detailing",
  },
  description:
    "Mobile car and marine detailing based in South Elgin, Illinois. Interior detailing, exterior detailing, paint correction, ceramic coatings, and condition-based exact quotes.",
  applicationName: "Car Dash Detailing",
  category: "automotive detailing",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: "Car Dash Detailing",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#171411] text-[#F7F5F2]`}
    >
      <body className="flex min-h-screen flex-col bg-[#171411] text-[#F7F5F2]">
        <StructuredData data={localBusinessSchema} />
        <SiteChrome footerBlurb={siteContent.footerBlurb}>{children}</SiteChrome>
      </body>
    </html>
  );
}
