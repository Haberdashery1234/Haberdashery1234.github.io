"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Project } from "@/lib/data";
import { ArrowUpRight, iconMap } from "@/components/icons";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const Github = iconMap.github;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
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
        tabIndex={-1}
        className="card relative w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-8 outline-none"
      >
        <button
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
