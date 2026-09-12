const links = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61588917429050",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor"><path d="M13.7 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.7-1.6H17V4a22 22 0 0 0-2.4-.1c-2.4 0-4.1 1.5-4.1 4.2v2.4H7.8v3.2h2.7V22h3.2Z"/></svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/cardashdetailing?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>
    ),
  },
  {
    name: "Google",
    href: "https://share.google/WlNx2ffVbM4Pl5WUv",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10 10 0 0 0 12 22Z" opacity=".8"/><path d="M6.4 13.9A6 6 0 0 1 6 12c0-.7.1-1.3.4-1.9V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.6Z" opacity=".65"/><path d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3 7.5l3.4 2.6A6 6 0 0 1 12 5.9Z" opacity=".9"/></svg>
    ),
  },
];

export default function SocialLinks({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          aria-label={link.name}
          title={link.name}
          className={`grid h-11 w-11 place-items-center rounded-full border transition hover:-translate-y-0.5 ${light ? "border-black/15 bg-black text-white hover:bg-[#FF2D2D] hover:text-[#0D0D0D]" : "border-white/15 bg-white/[.04] text-white hover:border-[#FF2D2D] hover:bg-[#FF2D2D] hover:text-[#0D0D0D]"}`}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
