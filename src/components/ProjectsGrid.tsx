"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { placeholderProjects, profile, type Project } from "@/lib/data";
import { getGithubProjects } from "@/lib/github";
import { ArrowUpRight, iconMap } from "@/components/icons";
import { slugify } from "@/lib/slug";
import ProjectModal from "@/components/ProjectModal";

const QUERY_KEY = "project";

export default function ProjectsGrid() {
  const Github = iconMap.github;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Render placeholder cards immediately (present in the static HTML from
  // build, so there's no blank projects section) and swap in live GitHub
  // data once it arrives client-side — this is a static export, so there's
  // no server left to fetch it ahead of time.
  const [projects, setProjects] = useState<Project[]>(placeholderProjects);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGithubProjects().then((live) => {
      if (!cancelled && live.length > 0) {
        setProjects(live);
        setIsLive(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const bySlug = useMemo(() => {
    const map = new Map<string, Project>();
    for (const project of projects) map.set(slugify(project.name), project);
    return map;
  }, [projects]);

  // The selected project is derived straight from the URL's ?project=slug
  // param, so a deep link opens the modal automatically and the two stay in
  // sync with no extra state or effect needed. Note: a deep link to a real
  // repo won't resolve until the live fetch above completes, since the
  // slug lookup only has placeholder names to match against until then.
  const slug = searchParams.get(QUERY_KEY);
  const selected = slug ? bySlug.get(slug) ?? null : null;

  const openProject = useCallback(
    (project: Project) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(QUERY_KEY, slugify(project.name));
      router.push(`${pathname}?${params.toString()}#projects`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const closeProject = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(QUERY_KEY);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}#projects`, { scroll: false });
  }, [router, pathname, searchParams]);

  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-sm font-mono text-accent">Projects</p>
        {isLive && (
          <span className="text-xs rounded-full border border-border px-2 py-0.5 text-muted">
            live from GitHub
          </span>
        )}
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
        Selected Work
      </h2>
      <p className="text-sm text-muted mb-12">
        {isLive ? (
          <>
            Pulled automatically from{" "}
            <a
              href={`https://github.com/${profile.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:opacity-80"
            >
              github.com/{profile.githubUsername}
            </a>
            .{" "}
          </>
        ) : null}
        Click a project for more details.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set(QUERY_KEY, slugify(project.name));
          const detailHref = `${pathname}?${params.toString()}#projects`;

          return (
            <article
              key={project.name}
              className="card relative p-6 flex flex-col h-full transition-colors hover:border-accent/50"
            >
              {/* A "stretched link" covering the whole card, so the card is
                  clickable/keyboard-focusable as one unit without nesting a
                  role="button" around the real "Live site"/"Code" links
                  below — nesting interactive controls like that isn't valid
                  and confuses assistive tech. It's a real link (not a div
                  with a click handler), so browser features like "open in
                  new tab" and middle-click work on it too. */}
              <a
                href={detailHref}
                onClick={(e) => {
                  e.preventDefault();
                  openProject(project);
                }}
                aria-label={`View details for ${project.name}`}
                className="absolute inset-0 z-0 rounded-[inherit]"
              />

              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono text-muted truncate">{project.category}</span>
                <span className="text-xs font-mono text-muted shrink-0">{project.year}</span>
              </div>

              <h3 className="mt-4 text-lg font-semibold">{project.name}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed flex-1">
                {project.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Card shows a preview; the modal shows all of project.tags. */}
                {project.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-full border border-border px-2.5 py-1 text-muted"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 5 && (
                  <span className="text-xs px-1 py-1 text-muted">
                    +{project.tags.length - 5} more
                  </span>
                )}
              </div>

              {/* Sits above the stretched link (z-10 vs its z-0) so these
                  stay independently clickable instead of the overlay
                  swallowing the click. */}
              <div className="relative z-10 mt-5 flex items-center gap-4 pt-4 border-t border-border">
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
            </article>
          );
        })}
      </div>

      {selected && <ProjectModal project={selected} onClose={closeProject} />}
    </>
  );
}
