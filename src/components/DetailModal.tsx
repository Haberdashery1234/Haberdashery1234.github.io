"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Screenshot } from "@/lib/github";
import ScreenshotCarousel from "@/components/ScreenshotCarousel";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The shared shell behind the project and published-app detail dialogs:
 * backdrop, close button, focus trap, scroll lock, and the screenshot
 * carousel pane. Callers supply the details pane as children, and must put
 * an element with id={titleId} in it to name the dialog.
 *
 * Two layouts: with screenshots, a wide two-pane dialog on desktop — the
 * carousel gets its own full-height column so phone shots show near real
 * size, and only the details pane scrolls. Below lg (and with no
 * screenshots) it's a single scrolling column.
 */
export default function DetailModal({
  titleId,
  name,
  screenshots: allScreenshots,
  onClose,
  children,
}: {
  titleId: string;
  /** Used to label the screenshot carousel for assistive tech. */
  name: string;
  screenshots: Screenshot[];
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Screenshot URLs that failed to load — filtered out so one dead image
  // link doesn't leave a broken slide. If every one fails, the dialog
  // switches to its single-column no-screenshots layout.
  const [failedScreenshotUrls, setFailedScreenshotUrls] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const onScreenshotError = useCallback((url: string) => {
    setFailedScreenshotUrls((prev) => new Set(prev).add(url));
  }, []);
  const screenshots = allScreenshots.filter((s) => !failedScreenshotUrls.has(s.url));
  const hasScreenshots = screenshots.length > 0;

  // Escape closes; Tab/Shift+Tab wrap around within the dialog instead of
  // escaping into the page behind it (a "focus trap" — standard practice
  // for a modal dialog per the WAI-ARIA Dialog pattern, since a sighted
  // keyboard user tabbing "past" a still-open modal into covered-up page
  // content is disorienting, and a screen reader user could act on content
  // they can't currently see).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Send focus back to whatever opened the dialog (the card's link)
      // instead of leaving it wherever it happened to land inside the
      // now-gone dialog.
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* A sibling overlay (not an ancestor of the dialog) so a click here
          can never be a click "inside" the dialog — no target-equality or
          stopPropagation checks needed. */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50 ${
          hasScreenshots
            ? "max-w-6xl lg:h-[min(92vh,860px)] lg:flex lg:overflow-hidden"
            : "max-w-3xl"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70 transition-colors"
        >
          <X size={18} />
        </button>

        {hasScreenshots && (
          <ScreenshotCarousel
            screenshots={screenshots}
            projectName={name}
            onImageError={onScreenshotError}
            className="h-[28rem] sm:h-[34rem] lg:h-full lg:w-[44%] lg:shrink-0 bg-surface-hover border-b border-border lg:border-b-0 lg:border-r"
          />
        )}

        <div className="p-6 sm:p-8 lg:flex-1 lg:overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** The header shared by both detail dialogs: icon, eyebrow line, title. */
export function DetailHeader({
  titleId,
  icon,
  eyebrow,
  title,
}: {
  titleId: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4 pr-10">
      {icon}
      <div className="min-w-0">
        <p className="text-xs font-mono text-muted truncate">{eyebrow}</p>
        <h3 id={titleId} className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
          {title}
        </h3>
      </div>
    </div>
  );
}

/** A grid of small labeled stat tiles (stars, version, dates, …). */
export function StatGrid({ stats }: { stats: { label: string; value: string }[] }) {
  if (stats.length === 0) return null;
  return (
    <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-border px-3 py-2.5">
          <dt className="text-xs text-muted">{stat.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground truncate">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
