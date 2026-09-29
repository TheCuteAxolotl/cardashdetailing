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

function setHiddenDirection(element: Element, top: number) {
  element.classList.remove("is-above", "is-below");
  element.classList.add(top < 0 ? "is-above" : "is-below");
}

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!shouldAnimate(pathname)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observed = new Set<Element>();
    const isPhone = window.matchMedia("(max-width: 640px)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target;

          if (entry.isIntersecting) {
            element.classList.add("is-revealed");
            element.classList.remove("is-above", "is-below");
          } else {
            element.classList.remove("is-revealed");
            setHiddenDirection(element, entry.boundingClientRect.top);
          }
        }
      },
      {
        // A low threshold keeps the effect responsive on phones and on tall sections.
        threshold: isPhone ? 0.015 : 0.03,
        rootMargin: isPhone ? "-2% 0px -2% 0px" : "-4% 0px -4% 0px",
      }
    );

    const register = (root: ParentNode = document) => {
      const elements = root.querySelectorAll<HTMLElement>(
        "main section:not([data-no-scroll-reveal]), main [data-scroll-reveal]:not([data-no-scroll-reveal])"
      );

      for (const element of elements) {
        if (!element.classList.contains("scroll-reveal")) {
          element.classList.add("scroll-reveal");
        }

        if (observed.has(element)) continue;

        const rect = element.getBoundingClientRect();
        const edgeInset = window.innerHeight * (isPhone ? 0.02 : 0.04);
        const initiallyVisible = rect.bottom > edgeInset && rect.top < window.innerHeight - edgeInset;

        if (initiallyVisible) {
          element.classList.add("is-revealed");
          element.classList.remove("is-above", "is-below");
        } else {
          element.classList.remove("is-revealed");
          setHiddenDirection(element, rect.top);
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
        element.classList.remove("scroll-reveal", "is-revealed", "is-above", "is-below");
      });
    };
  }, [pathname]);

  return null;
}
