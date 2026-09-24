"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Screenshot } from "@/lib/github";

/**
 * A horizontally swipeable strip of screenshots, one per "page". Built on
 * native CSS scroll-snap rather than a transform-driven slider, so touch
 * swiping, trackpad scrolling, and momentum all come from the browser for
 * free — the prev/next buttons and dots just call scrollTo on the track,
 * and the current index is read back from its scroll position.
 *
 * Slides use a fixed height with object-contain (not a fixed aspect ratio
 * with object-cover) since a single README can mix tall iPhone shots, wider
 * iPad shots, and landscape GIFs — cropping any of those to a shared shape
 * would cut off parts of the actual UI.
 */
export default function ScreenshotCarousel({
  screenshots,
  projectName,
  onImageError,
}: {
  screenshots: Screenshot[];
  projectName: string;
  /** Called with a screenshot's URL if it fails to load, so the parent can
   * drop it from the list rather than leave a broken-image slide. */
  onImageError: (url: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = screenshots.length;

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
      className="relative rounded-t-2xl bg-surface-hover overflow-hidden"
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
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {screenshots.map((s, i) => (
          <div
            key={s.url}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className="snap-center shrink-0 w-full h-72 sm:h-80 flex items-center justify-center px-12 py-4"
          >
            {/* Plain <img> for the same reason as the modal's preview image:
                README images can live on any host, and this static export
                doesn't run next/image's optimizer anyway. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.url}
              alt={label(s, i)}
              loading={i === 0 ? "eager" : "lazy"}
              onError={() => onImageError(s.url)}
              className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToIndex(index - 1)}
            disabled={index === 0}
            aria-label="Previous screenshot"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60 transition-opacity disabled:opacity-0"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index === count - 1}
            aria-label="Next screenshot"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60 transition-opacity disabled:opacity-0"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur">
            {screenshots.map((s, i) => (
              <button
                key={s.url}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to screenshot ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
