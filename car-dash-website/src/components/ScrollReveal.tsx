"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EXCLUDED_PREFIXES = ["/owner", "/admin", "/staff-guide", "/account", "/login", "/invoice", "/api"];

export default function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (EXCLUDED_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;
    const root = document.querySelector(".public-clean");
    if (!root) return;
    const observed = new Set<HTMLElement>();
    let frame = 0;
    // Explicit viewport checks also handle mobile Safari scroll/toolbar changes.
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const width = window.innerWidth;
      const measurements = [...observed].map(element => ({ element, rect: element.getBoundingClientRect() }));
      for (const { element, rect } of measurements) {
        if (!element.isConnected) { observed.delete(element); continue; }
        const visible = element.classList.contains("is-revealed");
        // Separate entry/exit boundaries avoid flicker while the transform is running.
        const enters = rect.bottom > 24 && rect.top < height - 24 && rect.right > 0 && rect.left < width;
        const leaves = rect.bottom < -32 || rect.top > height + 32 || rect.right < -32 || rect.left > width + 32;
        if (enters && !visible) {
          element.classList.add("is-revealed");
          element.classList.remove("is-above", "is-below");
        } else if (leaves || !visible) {
          element.classList.remove("is-revealed");
          element.classList.toggle("is-above", rect.bottom <= 24);
          element.classList.toggle("is-below", rect.bottom > 24);
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const register = () => {
      root.querySelectorAll<HTMLElement>("section, [data-reveal], [data-scroll-reveal]").forEach(element => {
        if (element.closest("[data-no-scroll-reveal]")) return;
        if (element.matches("section") && element.querySelector("[data-reveal], [data-scroll-reveal]")) {
          observed.delete(element);
          element.classList.remove("scroll-reveal", "is-revealed", "is-above", "is-below");
          return;
        }
        if (observed.has(element)) return;
        element.classList.add("scroll-reveal");
        observed.add(element);
      });
      schedule();
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    document.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      mutations.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      observed.forEach(element => element.classList.remove("scroll-reveal", "is-revealed", "is-above", "is-below"));
    };
  }, [pathname]);
  return null;
}
