"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "@/lib/data";
import { ArrowUpRight, iconMap } from "@/components/icons";
import ScreenshotCarousel from "@/components/ScreenshotCarousel";
import AppIconImage from "@/components/AppIconImage";
import ReadmeView from "@/components/ReadmeView";
import { getRepoLanguages, parseGithubRepoUrl } from "@/lib/github";
import { useRepoMedia } from "@/lib/useRepoMedia";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Swatch colors for the language-breakdown bar — just needs to be visually
// distinct dot-next-to-text, not text-on-color, so this doesn't need the
// same contrast treatment as the phone mockup's icon tiles.
const LANGUAGE_COLORS = [
  "#7c5cff",
  "#f97316",
  "#22c55e",
  "#38bdf8",
  "#f43f5e",
  "#eab308",
  "#a855f7",
  "#14b8a6",
];

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const Github = iconMap.github;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Language breakdown (e.g. "Swift 72%, Objective-C 28%") isn't included
  // in the list-of-repos fetch that populates the cards — it's a separate
  // GitHub API call, so it's only made here, on demand, for whichever
  // project's modal is actually open right now.
  const [languages, setLanguages] = useState<Record<string, number>>({});

  useEffect(() => {
    const target = parseGithubRepoUrl(project.repo);
    if (!target) return;
    let cancelled = false;
    getRepoLanguages(target.owner, target.repo).then((result) => {
      if (!cancelled) setLanguages(result);
    });
    return () => {
      cancelled = true;
    };
  }, [project.repo]);

  const media = useRepoMedia(project.repo);

  // Screenshot URLs that failed to load — filtered out so one dead image
  // link doesn't leave a broken slide. If every one fails, the modal
  // switches to its single-column no-screenshots layout.
  const [failedScreenshotUrls, setFailedScreenshotUrls] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const onScreenshotError = useCallback((url: string) => {
    setFailedScreenshotUrls((prev) => new Set(prev).add(url));
  }, []);

  const screenshots = media.screenshots.filter((s) => !failedScreenshotUrls.has(s.url));

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
      // Send focus back to whatever opened the modal (the project card's
      // link) instead of leaving it wherever it happened to land inside
      // the now-gone dialog.
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const repoTarget = parseGithubRepoUrl(project.repo);
  const hasScreenshots = screenshots.length > 0;
  const sortedLanguages = Object.entries(languages).sort(([, a], [, b]) => b - a);

  const stats = [
    typeof project.stars === "number" && { label: "Stars", value: `★ ${project.stars}` },
    !!project.forks && { label: "Forks", value: String(project.forks) },
    project.createdAt && { label: "Created", value: project.createdAt },
    project.updatedAt && { label: "Last updated", value: project.updatedAt },
    project.license && { label: "License", value: project.license },
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* A sibling overlay (not an ancestor of the dialog) so a click here
          can never be a click "inside" the dialog — no target-equality or
          stopPropagation checks needed. */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={onClose}
      />

      {/* Two layouts: with screenshots, a wide two-pane dialog on desktop —
          the carousel gets its own full-height column so phone shots show
          near real size, and only the details pane scrolls. Below lg (and
          for repos without screenshots) it's a single scrolling column. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
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
            key={project.repo}
            screenshots={screenshots}
            projectName={project.name}
            onImageError={onScreenshotError}
            className="h-[28rem] sm:h-[34rem] lg:h-full lg:w-[44%] lg:shrink-0 bg-surface-hover border-b border-border lg:border-b-0 lg:border-r"
          />
        )}

        <div className="p-6 sm:p-8 lg:flex-1 lg:overflow-y-auto">
          <div className="flex items-center gap-4 pr-10">
            {media.iconUrl && <AppIconImage src={media.iconUrl} className="h-16 w-16" />}
            <div className="min-w-0">
              <p className="text-xs font-mono text-muted truncate">
                {project.category} · {project.year}
              </p>
              <h3 id="project-modal-title" className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
                {project.name}
              </h3>
            </div>
          </div>

          <p className="mt-5 text-base text-muted leading-relaxed">{project.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent-button px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Github size={16} /> View code
              </a>
            )}
            {project.href && project.href !== project.repo && (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent transition-colors"
              >
                Live site <ArrowUpRight size={16} />
              </a>
            )}
          </div>

          {stats.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border px-3 py-2.5">
                  <dt className="text-xs text-muted">{stat.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-foreground truncate">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {sortedLanguages.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-muted mb-2">Languages</p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                {sortedLanguages.map(([language, pct], i) => (
                  <div
                    key={language}
                    style={{ width: `${pct}%`, backgroundColor: LANGUAGE_COLORS[i % LANGUAGE_COLORS.length] }}
                    title={`${language} ${pct}%`}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {sortedLanguages.map(([language, pct], i) => (
                  <span key={language} className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: LANGUAGE_COLORS[i % LANGUAGE_COLORS.length] }}
                    />
                    {language} {pct}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full border border-border px-2.5 py-1 text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {repoTarget && (
            <section className="mt-8 pt-8 border-t border-border">
              <h4 className="text-sm font-mono text-accent mb-4">README</h4>
              <ReadmeView owner={repoTarget.owner} repo={repoTarget.repo} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
