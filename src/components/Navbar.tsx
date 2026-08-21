"use client";

import { useEffect, useState } from "react";
import { nav, profile } from "@/lib/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? "bg-background/80 backdrop-blur border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="section-shell flex items-center justify-between h-16">
        <a href="#top" className="font-semibold tracking-tight text-foreground">
          {profile.name}
        </a>
        <ul className="hidden sm:flex items-center gap-8 text-sm text-muted">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#contact"
          className="text-sm rounded-full border border-border px-4 py-2 hover:border-accent hover:text-accent transition-colors"
        >
          Let&apos;s Connect
        </a>
      </nav>
    </header>
  );
}
