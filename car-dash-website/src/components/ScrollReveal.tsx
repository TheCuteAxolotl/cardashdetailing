"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EXCLUDED_PREFIXES = [
  "/owner",
  "/admin",
  "/staff-guide",
  "/account",
  "/login",
  "/invoice",
  "/api",
];

function shouldAnimate(pathname: string) {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldAnimate(pathname)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observed = new Set<Element>();
    const revealImmediatelyBelow = window.innerHeight * 0.92;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
          observed.delete(entry.target);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -9% 0px",
      }
    );

    const register = (root: ParentNode = document) => {
      const elements = root.querySelectorAll<HTMLElement>(
        "main section:not([data-no-scroll-reveal]), main [data-scroll-reveal]:not([data-no-scroll-reveal])"
      );

      for (const element of elements) {
        if (element.classList.contains("scroll-reveal")) continue;

        element.classList.add("scroll-reveal");
        const rect = element.getBoundingClientRect();

        // Anything already visible should stay visible so hydration never causes a flash.
        if (rect.top <= revealImmediatelyBelow) {
          element.classList.add("is-revealed");
          continue;
        }

        observer.observe(element);
        observed.add(element);
      }
    };

    register();

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches("section:not([data-no-scroll-reveal]), [data-scroll-reveal]:not([data-no-scroll-reveal])")) {
            register(node.parentElement || document);
          } else {
            register(node);
          }
        }
      }
    });

    const main = document.querySelector("main");
    if (main) mutationObserver.observe(main, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      observed.clear();
      document.querySelectorAll(".scroll-reveal").forEach((element) => {
        element.classList.remove("scroll-reveal", "is-revealed");
      });
    };
  }, [pathname]);

  return null;
}
