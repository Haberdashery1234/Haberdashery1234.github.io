import { profile, projectIcons, type Project } from "@/lib/data";

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

// Badge/status images (build status, npm version, license, coverage, social
// buttons) are almost always the first images in a README — none of them
// are the "screenshot" a visitor actually wants to see, so any image whose
// URL matches one of these common badge/button services is skipped when
// looking for a real screenshot.
const BADGE_IMAGE_PATTERN =
  /shields\.io|badge|codecov\.io|coveralls\.io|travis-ci|circleci\.com|opencollective\.com|patreon\.com|paypal\.com|buymeacoffee\.com|discord(app)?\.com|twitter\.com|x\.com\//i;

export type Screenshot = { url: string; alt: string };

/** A file's URL on GitHub's raw-content host at the default branch. Raw
 * downloads are served outside the REST API, so they don't count against
 * its 60/hour unauthenticated rate limit the way api.github.com calls do. */
export function rawRepoFileUrl(username: string, repoName: string, path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/HEAD/${encodedPath}`;
}

/** A project's app icon URL, from the repo → path list in data.ts, or null
 * if the repo isn't listed there (or `repoUrl` isn't a GitHub repo). */
export function getProjectIconUrl(repoUrl: string | undefined): string | null {
  const target = parseGithubRepoUrl(repoUrl);
  const path = target && projectIcons[target.repo];
  return target && path ? rawRepoFileUrl(target.owner, target.repo, path) : null;
}

// Screenshots follow a fixed naming convention in each repo:
// screenshots/iPhone1.png, screenshots/iPhone2.png, …, then
// screenshots/iPad1.png, … — numbered from 1 with no gaps.
const SCREENSHOT_DEVICES = ["iPhone", "iPad"] as const;
// Safety cap on the probe loop below, in case a repo ever has a huge set.
const MAX_SCREENSHOTS_PER_DEVICE = 10;

/**
 * A repo's screenshots: the conventional screenshots/iPhoneN.png and
 * screenshots/iPadN.png files if it has any (iPhone first), otherwise
 * whatever non-badge images its README contains. Empty for repos with
 * neither — normal for a framework or CLI tool, not a failure.
 *
 * Makes no REST API calls: everything is read from raw.githubusercontent.com.
 */
export function getRepoScreenshots(username: string, repoName: string): Promise<Screenshot[]> {
  return memoized(`screenshots:${username}/${repoName}`, [], async () => {
    const byDevice = await Promise.all(
      SCREENSHOT_DEVICES.map((device) => probeScreenshotSeries(username, repoName, device))
    );
    const conventional = byDevice.flat();
    return conventional.length > 0
      ? conventional
      : getReadmeScreenshots(username, repoName);
  });
}

/** Checks screenshots/{device}1.png, {device}2.png, … in order and stops
 * at the first one that doesn't exist. A HEAD request is enough — only the
 * status matters, and the <img> tags download the actual image later. */
async function probeScreenshotSeries(
  username: string,
  repoName: string,
  device: string
): Promise<Screenshot[]> {
  const found: Screenshot[] = [];
  for (let i = 1; i <= MAX_SCREENSHOTS_PER_DEVICE; i++) {
    const url = rawRepoFileUrl(username, repoName, `screenshots/${device}${i}.png`);
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    if (!res.ok) break;
    found.push({ url, alt: `${device} screenshot ${i}` });
  }
  return found;
}

export type Readme = { markdown: string; url: string };

/**
 * A repo's README.md, or null if it has none. Read from the raw host
 * rather than the /readme API endpoint, so a README under another filename
 * (readme.md, README.rst) isn't found — an acceptable trade for not
 * spending a rate-limited API call per repo. Memoized, so the screenshot
 * fallback below and the detail modal's README view share one download.
 */
export function getRepoReadme(username: string, repoName: string): Promise<Readme | null> {
  return memoized(`readme:${username}/${repoName}`, null, async () => {
    const url = rawRepoFileUrl(username, repoName, "README.md");
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    // 404 = no README.md, a real answer; anything else is worth retrying.
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`readme ${res.status}`);
    return { markdown: await res.text(), url };
  });
}

/**
 * Collects every non-badge image in a repo's README (markdown `![]()`
 * syntax or a raw `<img>` tag — both are common), in document order, as
 * absolute URLs with whatever alt text the README gave them.
 */
async function getReadmeScreenshots(username: string, repoName: string): Promise<Screenshot[]> {
  const readme = await getRepoReadme(username, repoName);
  if (!readme) return [];

  // Resolve relative paths, drop anything unresolvable, and dedupe — a
  // README sometimes repeats the same image (e.g. a hero shot up top that
  // shows up again in a gallery further down).
  const seen = new Set<string>();
  const screenshots: Screenshot[] = [];
  for (const image of findScreenshotImages(readme.markdown)) {
    const url = resolveReadmeAssetUrl(image.url, readme.url);
    if (url && !seen.has(url)) {
      seen.add(url);
      screenshots.push({ url, alt: image.alt });
    }
  }
  return screenshots;
}

// Each project card looks up its repo's screenshots, and the detail modal
// needs the same list (and README) again — memoizing the promise lets the
// modal reuse the card's result (or join its still-in-flight request)
// instead of re-downloading. Failed loads aren't kept, so a transient
// error gets retried.
const inFlight = new Map<string, Promise<unknown>>();

function memoized<T>(key: string, fallback: T, load: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = load().catch(() => {
    inFlight.delete(key);
    return fallback;
  });
  inFlight.set(key, promise);
  return promise;
}

/** Pulls {owner, repo} out of a "https://github.com/owner/repo" URL, or
 * null if it isn't one (e.g. the placeholder projects' repo is just "#"). */
export function parseGithubRepoUrl(url: string | undefined): { owner: string; repo: string } | null {
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

function findScreenshotImages(markdown: string): Screenshot[] {
  const candidates: { index: number; url: string; alt: string }[] = [];

  const mdImagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(mdImagePattern)) {
    candidates.push({ index: match.index, url: match[2], alt: match[1].trim() });
  }

  const htmlImagePattern = /<img[^>]+>/gi;
  for (const match of markdown.matchAll(htmlImagePattern)) {
    const src = match[0].match(/\ssrc=["']([^"']+)["']/i)?.[1];
    if (!src) continue;
    const alt = match[0].match(/\salt=["']([^"']*)["']/i)?.[1] ?? "";
    candidates.push({ index: match.index, url: src, alt: alt.trim() });
  }

  return candidates
    .sort((a, b) => a.index - b.index)
    .filter((c) => !BADGE_IMAGE_PATTERN.test(c.url))
    .map(({ url, alt }) => ({ url, alt }));
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
