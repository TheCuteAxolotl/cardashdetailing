"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AccessState = "checking" | "allowed" | "redirecting";

const SHARED_OWNER_ROUTES: Array<{ prefix: string; permission: string }> = [
  { prefix: "/owner/calls", permission: "businessPhone" },
  { prefix: "/owner/warranties", permission: "warranties" },
  { prefix: "/owner/analytics", permission: "analytics" },
  { prefix: "/owner/services", permission: "services" },
  { prefix: "/owner/gallery", permission: "gallery" },
  { prefix: "/owner/website", permission: "website" },
  { prefix: "/owner/pricing-pages", permission: "pricing" },
  { prefix: "/owner/booking-settings", permission: "pricing" },
];

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AccessState>("checking");

  const requiredPermission = useMemo(
    () => SHARED_OWNER_ROUTES.find((item) => pathname.startsWith(item.prefix))?.permission || null,
    [pathname]
  );

  useEffect(() => {
    let cancelled = false;
    setState("checking");

    (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setState("redirecting");
            window.location.assign("/login");
          }
          return;
        }

        const data = await response.json();
        const role = String(data.user?.role || "user");
        const permissions = Array.isArray(data.permissions) ? data.permissions : [];

        if (role === "owner") {
          if (!cancelled) setState("allowed");
          return;
        }

        if (requiredPermission && permissions.includes(requiredPermission)) {
          if (!cancelled) setState("allowed");
          return;
        }

        if (!cancelled) {
          setState("redirecting");
          window.location.assign(data.staffAccess ? "/admin/dashboard" : "/dashboard");
        }
      } catch {
        if (!cancelled) {
          setState("redirecting");
          window.location.assign("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requiredPermission]);

  if (state !== "allowed") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-b-[#FF2D2D]" />
          <p className="mt-4 text-sm text-white/45">Checking dashboard access…</p>
        </div>
      </main>
    );
  }

  return children;
}
