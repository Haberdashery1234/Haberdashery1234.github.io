import { profile, type Project } from "@/lib/data";

// Shape of the fields we use from GitHub's REST API:
// GET https://api.github.com/users/{username}/repos
// https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
type GithubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  private: boolean;
  stargazers_count: number;
  pushed_at: string;
};

const MAX_PROJECTS = 6;

/**
 * Fetches the user's public, non-fork, non-archived repos from GitHub and
 * maps them into the same `Project` shape the UI already renders.
 *
 * This runs in the visitor's browser (called from a "use client" component),
 * not on a server — the site is a static export with no server to run on.
 * That has two consequences:
 * - No auth token: a token would have to ship inside the public JS bundle
 *   for every visitor to read, which isn't safe, so this always calls the
 *   API unauthenticated. That means a 60 requests/hour rate limit — but
 *   it's scoped per visitor's own IP address, not shared across everyone
 *   who visits the site, so it's a non-issue at normal portfolio traffic.
 * - No caching layer: every page load fetches fresh data directly, so
 *   there's no "stale for up to an hour" window like a server-rendered
 *   version would have.
 *
 * Returns an empty array on any failure (offline, rate-limited, username
 * typo, etc.) so the caller can fall back to placeholder content instead
 * of breaking the page.
 */
export async function getGithubProjects(
  username: string = profile.githubUsername,
  limit: number = MAX_PROJECTS
): Promise<Project[]> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(
        username
      )}/repos?per_page=100&sort=pushed&direction=desc`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.warn(`[github] fetch failed for ${username}: ${res.status}`);
      return [];
    }

    const repos = (await res.json()) as GithubRepo[];
    if (!Array.isArray(repos)) return [];

    return repos
      .filter(
        (repo) =>
          !repo.fork &&
          !repo.archived &&
          !repo.private &&
          !isGithubPagesSiteRepo(repo.name, username)
      )
      .slice(0, limit)
      .map(repoToProject);
  } catch (err) {
    console.warn(`[github] fetch threw for ${username}:`, err);
    return [];
  }
}

function repoToProject(repo: GithubRepo): Project {
  // "Technologies used" = primary language + any topics the repo is
  // tagged with on GitHub (a common place people list frameworks/tools).
  // Dedupe case-insensitively — GitHub topics are lowercase (e.g.
  // "typescript") but `language` is properly cased ("TypeScript"), so a
  // naive Set would keep both.
  const tags = dedupeCaseInsensitive(
    [repo.language, ...(repo.topics ?? [])].filter((v): v is string => Boolean(v))
  ).slice(0, 5);

  const liveUrl = repo.homepage?.trim() || undefined;

  return {
    name: repo.name,
    category: repo.language ?? "Repository",
    description: repo.description ?? "No description yet — add one on GitHub.",
    tags: tags.length > 0 ? tags : ["Repository"],
    href: liveUrl,
    repo: repo.html_url,
    year: String(new Date(repo.pushed_at).getFullYear()),
    stars: repo.stargazers_count,
  };
}

/**
 * GitHub repos that exist for site plumbing rather than as an actual
 * project, so they're excluded from the projects list even though they're
 * normal public, non-fork repos:
 * - "{username}.github.io" — the special repo behind a GitHub Pages user site
 * - "{username}" (exact match) — the special repo GitHub uses for the
 *   profile README shown on your GitHub profile page
 */
function isGithubPagesSiteRepo(repoName: string, username: string): boolean {
  const name = repoName.toLowerCase();
  const user = username.toLowerCase();
  return name === `${user}.github.io` || name === user;
}

/** Dedupes strings ignoring case, keeping the first-seen casing. */
function dedupeCaseInsensitive(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}
