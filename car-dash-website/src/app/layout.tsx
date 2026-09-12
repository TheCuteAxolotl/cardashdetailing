import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SupportWidget from "@/components/SupportWidget";
import { BUSINESS_PHONE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Dash Detailing",
  description:
    "Mobile auto and marine detailing from Car Dash Detailing. Interior, exterior, paint correction, ceramic coatings, marine care, and custom service packages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black text-white`}
    >
      <body className="min-h-full flex min-h-screen flex-col bg-[#0D0D0D] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Car Dash Detailing",
              url: "https://cardashdetailing.com",
              telephone: BUSINESS_PHONE,
              email: "cardashdetailing@gmail.com",
              areaServed: "South Elgin, Illinois",
              description: metadata.description,
            }),
          }}
        />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <SupportWidget />
      </body>
    </html>
  );
}
