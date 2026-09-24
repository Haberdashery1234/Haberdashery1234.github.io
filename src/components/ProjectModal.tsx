"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/data";
import { ArrowUpRight, iconMap } from "@/components/icons";
import AppIconImage from "@/components/AppIconImage";
import ReadmeView from "@/components/ReadmeView";
import DetailModal, { DetailHeader, StatGrid } from "@/components/DetailModal";
import { getRepoLanguages, parseGithubRepoUrl } from "@/lib/github";
import { useRepoMedia } from "@/lib/useRepoMedia";

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

const TITLE_ID = "project-modal-title";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const Github = iconMap.github;

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
  const repoTarget = parseGithubRepoUrl(project.repo);
  const sortedLanguages = Object.entries(languages).sort(([, a], [, b]) => b - a);

  const stats = [
    typeof project.stars === "number" && { label: "Stars", value: `★ ${project.stars}` },
    !!project.forks && { label: "Forks", value: String(project.forks) },
    project.createdAt && { label: "Created", value: project.createdAt },
    project.updatedAt && { label: "Last updated", value: project.updatedAt },
    project.license && { label: "License", value: project.license },
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <DetailModal
      titleId={TITLE_ID}
      name={project.name}
      screenshots={media.screenshots}
      onClose={onClose}
    >
      <DetailHeader
        titleId={TITLE_ID}
        icon={media.iconUrl && <AppIconImage src={media.iconUrl} className="h-16 w-16" />}
        eyebrow={`${project.category} · ${project.year}`}
        title={project.name}
      />

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

      <StatGrid stats={stats} />

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
    </DetailModal>
  );
}
