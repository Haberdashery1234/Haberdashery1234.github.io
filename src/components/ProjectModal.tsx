"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Project } from "@/lib/data";
import { ArrowUpRight, iconMap } from "@/components/icons";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
        className="card relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

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
  );
}
