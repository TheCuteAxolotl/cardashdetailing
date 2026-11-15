"use client";

import { useState } from "react";

export default function AboutStory({ story }: { story: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = story.length > 400;
  const space = story.lastIndexOf(" ", 360);
  const visible = long && !expanded ? story.slice(0, space > 0 ? space : 360).trimEnd() : story;

  return (
    <>
      <div id="full-story" className="mt-6 max-w-[60ch] text-base leading-8 text-[#d3cec5] sm:text-[17px]">
        <span className="whitespace-pre-line">{visible}</span>
        {long && <button type="button" aria-expanded={expanded} aria-controls="full-story"
          onClick={() => setExpanded(!expanded)}
          className="inline-block min-h-11 cursor-pointer whitespace-nowrap px-1 font-semibold text-[#d6b779] hover:underline focus-visible:underline">
          {expanded ? "Show less" : "… More"}
        </button>}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/gallery" className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-[#f4efe5] hover:border-[#d6b779]">See the work</a>
        {expanded && <a href="/reviews" className="inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-medium">Read reviews</a>}
      </div>
    </>
  );
}
