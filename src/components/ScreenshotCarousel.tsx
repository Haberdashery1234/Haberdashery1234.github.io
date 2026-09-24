"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Screenshot } from "@/lib/github";

/**
 * A horizontally swipeable strip of screenshots, one per "page", with a
 * thumbnail row underneath for jumping straight to one. Built on native CSS
 * scroll-snap rather than a transform-driven slider, so touch swiping,
 * trackpad scrolling, and momentum all come from the browser for free —
 * the arrows and thumbnails just call scrollTo on the track, and the
 * current index is read back from its scroll position.
 *
 * Fills whatever height its parent gives it (pass sizing via className).
 * Images are contained, not cropped, since a single repo can mix tall
 * iPhone shots, wider iPad shots, and landscape GIFs — cropping any of
 * those to a shared shape would cut off parts of the actual UI.
 */
export default function ScreenshotCarousel({
  screenshots,
  projectName,
  onImageError,
  className = "",
}: {
  screenshots: Screenshot[];
  projectName: string;
  /** Called with a screenshot's URL if it fails to load, so the parent can
   * drop it from the list rather than leave a broken-image slide. */
  onImageError: (url: string) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [rawIndex, setIndex] = useState(0);
  const count = screenshots.length;
  // Clamped in case a slide was removed (failed to load) while it was the
  // last one, before the next scroll event corrects the stored index.
  const index = Math.min(rawIndex, count - 1);

  const scrollToIndex = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }, []);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const label = (s: Screenshot, i: number) =>
    s.alt || `${projectName} screenshot ${i + 1} of ${count}`;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={`${projectName} screenshots`}
      className={`flex flex-col ${className}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollToIndex(Math.max(0, index - 1));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollToIndex(Math.min(count - 1, index + 1));
        }
      }}
    >
      <div className="relative flex-1 min-h-0">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {screenshots.map((s, i) => (
            <div
              key={s.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="snap-center shrink-0 w-full h-full flex items-center justify-center px-12 py-6"
            >
              {/* Opens the full-resolution image in a new tab — the slide is
                  sized to fit the modal, which can be well below an iPad
                  screenshot's native size. Only the visible slide's link is
                  tabbable, so keyboard users don't tab through every
                  offscreen slide to get past the carousel. */}
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={i === index ? 0 : -1}
                aria-label={`${label(s, i)} (opens full size in a new tab)`}
                className="flex h-full w-full items-center justify-center cursor-zoom-in"
              >
                {/* Plain <img>: README images can live on any host, and
                    this static export doesn't run next/image's optimizer
                    anyway. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.url}
                  alt={label(s, i)}
                  loading={i === 0 ? "eager" : "lazy"}
                  onError={() => onImageError(s.url)}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl shadow-black/40"
                />
              </a>
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => scrollToIndex(index - 1)}
              disabled={index === 0}
              aria-label="Previous screenshot"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70 transition-opacity disabled:opacity-0"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(index + 1)}
              disabled={index === count - 1}
              aria-label="Next screenshot"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70 transition-opacity disabled:opacity-0"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-4 pt-1">
          {screenshots.map((s, i) => (
            <button
              key={s.url}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to screenshot ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={`h-14 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                i === index
                  ? "border-accent"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" loading="lazy" className="h-full w-auto object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
