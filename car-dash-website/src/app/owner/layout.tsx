"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import OwnerShell from "@/components/OwnerShell";

type AccessState = "checking" | "allowed" | "redirecting";
type User = { id: string; name?: string | null; email?: string | null; role?: string | null };

const SHARED_OWNER_ROUTES: Array<{ prefix: string; permissions: string[] }> = [
  { prefix: "/owner/calls", permissions: ["businessPhone"] },
  { prefix: "/owner/warranties", permissions: ["warranties"] },
  { prefix: "/owner/analytics", permissions: ["analytics"] },
  { prefix: "/owner/services", permissions: ["services"] },
  { prefix: "/owner/gallery", permissions: ["gallery"] },
  { prefix: "/owner/website", permissions: ["website"] },
  { prefix: "/owner/pricing-pages", permissions: ["pricing"] },
  { prefix: "/owner/booking-settings", permissions: ["pricing", "bookings"] },
];

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<AccessState>("checking");
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const requiredPermissions = useMemo(
    () => SHARED_OWNER_ROUTES.find((item) => pathname.startsWith(item.prefix))?.permissions || null,
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
        const nextPermissions = Array.isArray(data.permissions) ? data.permissions : [];

        if (role === "owner") {
          if (!cancelled) {
            setUser(data.user);
            setPermissions(nextPermissions);
            setState("allowed");
          }
          return;
        }

        if (requiredPermissions && requiredPermissions.some((permission) => nextPermissions.includes(permission))) {
          if (!cancelled) {
            setUser(data.user);
            setPermissions(nextPermissions);
            setState("allowed");
          }
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
  }, [requiredPermissions]);

  if (state !== "allowed" || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0c0c0c] px-6 text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-b-white" />
          <p className="mt-4 text-xs font-medium uppercase tracking-[.14em] text-white/35">Opening business console</p>
        </div>
      </main>
    );
  }

  return <OwnerShell user={user} permissions={permissions}>{children}</OwnerShell>;
}
