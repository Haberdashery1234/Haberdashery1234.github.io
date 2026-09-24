import { publishedApps, type PublishedAppConfig } from "@/lib/data";
import type { Screenshot } from "@/lib/github";
import { slugify } from "@/lib/slug";

// Shape of the fields we use from Apple's public iTunes Lookup API:
// GET https://itunes.apple.com/lookup?id={appStoreId}&country={cc}
// https://performance-partners.apple.com/search-api
type ItunesApp = {
  trackId: number;
  trackName: string;
  artistName: string;
  trackViewUrl: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  primaryGenreName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  version?: string;
  releaseDate?: string;
  currentVersionReleaseDate?: string;
  description?: string;
  releaseNotes?: string;
  formattedPrice?: string;
  minimumOsVersion?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
};

export type PublishedApp = {
  id: string;
  slug: string;
  name: string;
  developer: string;
  url: string;
  iconUrl: string | null;
  genre: string;
  year: string;
  description: string;
  role?: string;
  rating?: number;
  ratingCount: number;
  version?: string;
  releasedAt?: string;
  updatedAt?: string;
  releaseNotes?: string;
  price?: string;
  minimumOsVersion?: string;
  screenshots: Screenshot[];
};

// The lookup API hands back small thumbnails (e.g. .../392x696bb.jpg), but
// Apple's image CDN renders any size on request from the same path — swap
// the last segment for a wider one so screenshots stay sharp at the size
// the detail dialog shows them.
const SCREENSHOT_SIZE = "800x0w.webp";

/**
 * Looks up every app in `publishedApps` (data.ts) on the App Store.
 *
 * Runs at build time only — it's called from a Server Component, which a
 * static export renders once during `next build` — so visitors never hit
 * Apple's API and the results ship in the static HTML. An app whose
 * lookup fails (bad ID, not in that storefront, network hiccup) is left
 * out with a build-log warning rather than failing the whole build.
 */
export async function getPublishedApps(): Promise<PublishedApp[]> {
  const results = await Promise.all(publishedApps.map(lookupApp));
  return results.filter((app): app is PublishedApp => app !== null);
}

async function lookupApp(config: PublishedAppConfig): Promise<PublishedApp | null> {
  const country = config.country ?? "us";
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(config.appStoreId)}&country=${encodeURIComponent(country)}&entity=software`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) {
      console.warn(`[appStore] lookup failed for ${config.appStoreId}: ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { results?: ItunesApp[] };
    const app = data.results?.[0];
    if (!app) {
      console.warn(
        `[appStore] no app found for id ${config.appStoreId} in the "${country}" store — check the ID, or set \`country\` in data.ts`
      );
      return null;
    }
    return toPublishedApp(app, config);
  } catch (err) {
    console.warn(`[appStore] lookup threw for ${config.appStoreId}:`, err);
    return null;
  }
}

function toPublishedApp(app: ItunesApp, config: PublishedAppConfig): PublishedApp {
  const screenshots: Screenshot[] = [
    ...(app.screenshotUrls ?? []).map((url, i) => ({
      url: resizeArtwork(url),
      alt: `${app.trackName} iPhone screenshot ${i + 1}`,
    })),
    ...(app.ipadScreenshotUrls ?? []).map((url, i) => ({
      url: resizeArtwork(url),
      alt: `${app.trackName} iPad screenshot ${i + 1}`,
    })),
  ];

  return {
    id: String(app.trackId),
    slug: slugify(app.trackName),
    name: app.trackName,
    developer: app.artistName,
    // Drop the "?uo=4" affiliate-tracking parameter the API appends.
    url: app.trackViewUrl.split("?")[0],
    iconUrl: app.artworkUrl512 ?? app.artworkUrl100 ?? null,
    genre: app.primaryGenreName ?? "App",
    year: app.releaseDate ? String(new Date(app.releaseDate).getFullYear()) : "",
    description: app.description?.trim() ?? "",
    role: config.role,
    // Apple reports 0 with no ratings yet — treat that as "no rating", not
    // a zero-star score.
    rating: app.userRatingCount ? app.averageUserRating : undefined,
    ratingCount: app.userRatingCount ?? 0,
    version: app.version,
    releasedAt: app.releaseDate ? formatMonthYear(app.releaseDate) : undefined,
    updatedAt: app.currentVersionReleaseDate
      ? formatMonthYear(app.currentVersionReleaseDate)
      : undefined,
    releaseNotes: app.releaseNotes?.trim() || undefined,
    price: app.formattedPrice,
    minimumOsVersion: app.minimumOsVersion,
    screenshots,
  };
}

function resizeArtwork(url: string): string {
  return url.replace(/\/[^/]+$/, `/${SCREENSHOT_SIZE}`);
}

/** e.g. "2024-03-11T02:14:00Z" -> "Mar 2024" */
function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
