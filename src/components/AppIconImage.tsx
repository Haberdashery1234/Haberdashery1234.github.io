"use client";

import { useState } from "react";

/**
 * A repo's app icon, masked to iOS's rounded-square shape (Xcode app icons
 * are exported as full-bleed squares — the OS applies the corner radius).
 * Decorative (alt="") since it always sits next to the project's name, and
 * hides itself rather than showing a broken-image icon if it fails to load.
 */
export default function AppIconImage({ src, className = "" }: { src: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return null;

  return (
    // Plain <img>: hosted on raw.githubusercontent.com, and this static
    // export doesn't run next/image's optimizer anyway.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={`shrink-0 rounded-[22.5%] shadow-md object-cover ${className}`}
    />
  );
}
