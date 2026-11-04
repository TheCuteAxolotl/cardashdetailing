import type { Metadata } from "next";
export const metadata: Metadata = { title: "Verify your service", robots: { index: false, follow: false } };
export default function LookupLayout({ children }: { children: React.ReactNode }) { return children; }
