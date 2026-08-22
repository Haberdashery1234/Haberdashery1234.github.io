"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "@/lib/data";
import { ArrowUpRight, iconMap } from "@/components/icons";
import { getRepoLanguages, getRepoReadmeScreenshot, getRepoSocialPreviewUrl } from "@/lib/github";

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

/** Pulls {owner, repo} out of a "https://github.com/owner/repo" URL, or
 * null if it isn't one (e.g. the placeholder projects' repo is just "#"). */
function parseGithubRepoUrl(url: string | undefined): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== "github.com") return null;
    const [owner, repo] = pathname.split("/").filter(Boolean);
    return owner && repo ? { owner, repo } : null;
  } catch {
    return null;
  }
}

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

  // Preview image: GitHub's auto-generated social-preview card shows
  // immediately — it's a plain URL, derived synchronously from the repo, no
  // fetch or state needed — then gets replaced by a real screenshot pulled
  // from the README if one turns up, the same "show something now, upgrade
  // it if a better version arrives shortly after" approach used for the
  // placeholder-then-live project cards.
  const fallbackImageUrl = useMemo(() => {
    const target = parseGithubRepoUrl(project.repo);
    return target ? getRepoSocialPreviewUrl(target.owner, target.repo) : null;
  }, [project.repo]);

  // Tagged with the repo it was fetched for, so switching to a different
  // project before this fetch resolves can't briefly show the previous
  // project's screenshot — handled by comparing against the current repo
  // below, rather than by resetting this state with a synchronous setState
  // call in the effect (which the current-project screenshot arriving async
  // in the .then() below already makes unnecessary).
  const [screenshot, setScreenshot] = useState<{ repo: string | undefined; url: string } | null>(
    null
  );

  useEffect(() => {
    const target = parseGithubRepoUrl(project.repo);
    if (!target) return;
    let cancelled = false;
    getRepoReadmeScreenshot(target.owner, target.repo).then((result) => {
      if (!cancelled && result) setScreenshot({ repo: project.repo, url: result });
    });
    return () => {
      cancelled = true;
    };
  }, [project.repo]);

  const screenshotUrl = screenshot && screenshot.repo === project.repo ? screenshot.url : null;
  const imageUrl = screenshotUrl ?? fallbackImageUrl;

  // Which URL failed to load, if any — compared against the current
  // imageUrl below instead of tracked as a plain boolean, so a new image
  // (a new project opened, or a screenshot arriving to replace the
  // fallback) automatically counts as "not failed" with no explicit reset.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const imageFailed = imageUrl !== null && imageUrl === failedUrl;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
        aria-labelledby="project-modal-title"
        className="card relative w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-1.5 text-white backdrop-blur hover:bg-black/60 transition-colors"
        >
          <X size={18} />
        </button>

        {imageUrl && !imageFailed && (
          // GitHub's social-preview card or a screenshot pulled from the
          // README — decorative (the heading right below names the
          // project), and purely best-effort: hide it entirely rather
          // than show a broken-image icon if it fails to load.
          //
          // Plain <img> rather than next/image is intentional here: this is
          // a static export with images.unoptimized already set (so
          // next/image's optimizer never runs anyway), and the URL is
          // whatever domain GitHub or a repo's README happens to host the
          // image on — an arbitrary, unbounded set of hosts that next/image
          // would need every one of listed in next.config.ts's
          // images.remotePatterns to allow.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            onError={() => setFailedUrl(imageUrl)}
            className="w-full aspect-video object-cover rounded-t-2xl bg-surface-hover"
          />
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-2 pr-8">
            <span className="text-xs font-mono text-muted truncate">{project.category}</span>
            <span className="text-xs font-mono text-muted shrink-0">{project.year}</span>
          </div>

          <h3 id="project-modal-title" className="mt-3 text-2xl font-semibold pr-8">
            {project.name}
          </h3>

          <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
            {project.description}
          </p>

          {(project.createdAt || project.updatedAt || project.license || !!project.forks) && (
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
              {project.createdAt && (
                <div>
                  <dt className="text-muted">Created</dt>
                  <dd className="mt-0.5 text-foreground/90">{project.createdAt}</dd>
                </div>
              )}
              {project.updatedAt && (
                <div>
                  <dt className="text-muted">Last updated</dt>
                  <dd className="mt-0.5 text-foreground/90">{project.updatedAt}</dd>
                </div>
              )}
              {!!project.forks && (
                <div>
                  <dt className="text-muted">Forks</dt>
                  <dd className="mt-0.5 text-foreground/90">{project.forks}</dd>
                </div>
              )}
              {project.license && (
                <div>
                  <dt className="text-muted">License</dt>
                  <dd className="mt-0.5 text-foreground/90">{project.license}</dd>
                </div>
              )}
            </dl>
          )}

          {project.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
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

          {Object.keys(languages).length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-muted mb-2">Languages</p>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                {Object.entries(languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([language, pct], i) => (
                    <div
                      key={language}
                      style={{ width: `${pct}%`, backgroundColor: LANGUAGE_COLORS[i % LANGUAGE_COLORS.length] }}
                      title={`${language} ${pct}%`}
                    />
                  ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {Object.entries(languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([language, pct], i) => (
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

          <div className="mt-6 flex items-center gap-4 pt-5 border-t border-border">
            {project.href && project.href !== project.repo && (
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80"
              >
                Live site <ArrowUpRight size={14} />
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
              >
                <Github size={14} /> Code
              </a>
            )}
            {typeof project.stars === "number" && project.stars > 0 && (
              <span className="ml-auto text-xs text-muted">★ {project.stars}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
