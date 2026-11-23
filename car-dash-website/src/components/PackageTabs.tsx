"use client";

import { useEffect, useState } from "react";

// On phones the packages sit in a sideways swipe row. These tabs name every
// package, show which one is in view, and jump straight to the one tapped.
export default function PackageTabs({ targetId, labels }: { targetId: string; labels: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const row = document.getElementById(targetId);
    if (!row || typeof IntersectionObserver === "undefined") return;
    const cards = Array.from(row.children) as HTMLElement[];
    const observer = new IntersectionObserver((entries) => {
      const best = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setActive(cards.indexOf(best.target as HTMLElement));
    }, { root: row, threshold: [0.55, 0.8] });
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [targetId]);

  if (labels.length < 2) return null;

  const show = (index: number) => {
    const row = document.getElementById(targetId);
    const card = row?.children[index] as HTMLElement | undefined;
    if (!row || !card) return;
    const rowBox = row.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: row.scrollLeft + cardBox.left - rowBox.left - (rowBox.width - cardBox.width) / 2, behavior: reduced ? "auto" : "smooth" });
    setActive(index);
  };

  return (
    <div className="package-tabs sm:hidden" role="group" aria-label="Choose a package">
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          aria-pressed={index === active}
          aria-controls={targetId}
          className={index === active ? "package-tab package-tab-active" : "package-tab"}
          onClick={() => show(index)}
        >
          {label.replace(/\s+Detail$/i, "")}
        </button>
      ))}
    </div>
  );
}
