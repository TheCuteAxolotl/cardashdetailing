import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SupportWidget from "@/components/SupportWidget";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#0B1822] text-white`}
    >
      <body className="min-h-full flex min-h-screen flex-col bg-[#0B1822] text-white">
        <StructuredData data={localBusinessSchema} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter blurb={siteContent.footerBlurb} />
        <SupportWidget />
      </body>
    </html>
  );
}
