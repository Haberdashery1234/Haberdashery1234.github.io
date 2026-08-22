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
  forks_count: number;
  created_at: string;
  pushed_at: string;
  license: { name: string; spdx_id: string } | null;
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
  // naive Set would keep both. Keep the full list here — the project card
  // only displays the first handful, but the detail modal shows all of it.
  const tags = dedupeCaseInsensitive(
    [repo.language, ...(repo.topics ?? [])].filter((v): v is string => Boolean(v))
  );

  const liveUrl = repo.homepage?.trim() || undefined;

  // Some repos have no license file at all (license is null), and a few
  // have a non-standard one GitHub can't identify (spdx_id "NOASSERTION")
  // — skip showing a license in either case rather than a confusing label.
  const license =
    repo.license && repo.license.spdx_id !== "NOASSERTION" ? repo.license.name : undefined;

  return {
    name: repo.name,
    category: repo.language ?? "Repository",
    description: repo.description ?? "No description yet — add one on GitHub.",
    tags: tags.length > 0 ? tags : ["Repository"],
    href: liveUrl,
    repo: repo.html_url,
    year: String(new Date(repo.pushed_at).getFullYear()),
    stars: repo.stargazers_count,
    createdAt: formatMonthYear(repo.created_at),
    updatedAt: formatMonthYear(repo.pushed_at),
    forks: repo.forks_count,
    license,
  };
}

/** e.g. "2024-03-11T02:14:00Z" -> "Mar 2024" */
function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Fetches the language breakdown (bytes of code per language) for a single
 * repo, converted to rounded percentages of the total. Only called when a
 * project's detail modal is actually opened (not for every card up front),
 * so it doesn't add to the 60/hour rate limit budget unless someone's
 * actively looking at that project.
 *
 * Returns an empty object on failure — the caller just hides the language
 * breakdown in that case rather than showing broken/partial data.
 */
export async function getRepoLanguages(
  username: string,
  repoName: string
): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/languages`,
      {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return {};

    const bytesByLanguage = (await res.json()) as Record<string, number>;
    const total = Object.values(bytesByLanguage).reduce((sum, n) => sum + n, 0);
    if (total === 0) return {};

    const percentages: Record<string, number> = {};
    for (const [language, bytes] of Object.entries(bytesByLanguage)) {
      percentages[language] = Math.round((bytes / total) * 100);
    }
    return percentages;
  } catch {
    return {};
  }
}

/**
 * GitHub auto-generates a social-preview card image for every public repo
 * — the same image GitHub uses for link previews — even if the owner
 * never set a custom one. This is a stable pattern GitHub's own site uses,
 * but it isn't part of the documented, versioned REST API, so treat it as
 * "reliable in practice" rather than a guaranteed-forever contract.
 */
export function getRepoSocialPreviewUrl(username: string, repoName: string): string {
  return `https://opengraph.githubassets.com/1/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}`;
}

// Badge/status images (build status, npm version, license, coverage, social
// buttons) are almost always the first images in a README — none of them
// are the "screenshot" a visitor actually wants to see, so any image whose
// URL matches one of these common badge/button services is skipped when
// looking for a real screenshot.
const BADGE_IMAGE_PATTERN =
  /shields\.io|badge|codecov\.io|coveralls\.io|travis-ci|circleci\.com|opencollective\.com|patreon\.com|paypal\.com|buymeacoffee\.com|discord(app)?\.com|twitter\.com|x\.com\//i;

/**
 * Looks for the first non-badge image in a repo's README (markdown
 * `![]()` syntax or a raw `<img>` tag — both are common) and returns its
 * absolute URL, or null if the README has no README, no images, or only
 * badge images. Many project READMEs lead with a screenshot or demo GIF,
 * but plenty don't (a CLI tool or backend library, for instance), so a
 * null result here is normal and expected, not a failure.
 */
export async function getRepoReadmeScreenshot(
  username: string,
  repoName: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/readme`,
      {
        headers: { Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      content?: string;
      encoding?: string;
      download_url?: string | null;
    };
    if (data.encoding !== "base64" || !data.content) return null;

    const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
    const markdown = new TextDecoder("utf-8").decode(bytes);

    const imageUrl = findFirstScreenshotUrl(markdown);
    if (!imageUrl) return null;

    return resolveReadmeAssetUrl(imageUrl, data.download_url ?? null);
  } catch {
    return null;
  }
}

function findFirstScreenshotUrl(markdown: string): string | null {
  const candidates: { index: number; url: string }[] = [];

  const mdImagePattern = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(mdImagePattern)) {
    candidates.push({ index: match.index, url: match[1] });
  }

  const htmlImagePattern = /<img[^>]+src=["']([^"']+)["']/gi;
  for (const match of markdown.matchAll(htmlImagePattern)) {
    candidates.push({ index: match.index, url: match[1] });
  }

  candidates.sort((a, b) => a.index - b.index);

  const firstNonBadge = candidates.find((c) => !BADGE_IMAGE_PATTERN.test(c.url));
  return firstNonBadge?.url ?? null;
}

/** A README image reference can be a relative path (e.g. "assets/demo.png")
 * — resolve it against the README's own raw-content URL so it points
 * somewhere real. Absolute URLs pass through unchanged. */
function resolveReadmeAssetUrl(imageUrl: string, readmeDownloadUrl: string | null): string | null {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (!readmeDownloadUrl) return null;
  try {
    const base = readmeDownloadUrl.slice(0, readmeDownloadUrl.lastIndexOf("/") + 1);
    return new URL(imageUrl, base).toString();
  } catch {
    return null;
  }
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
