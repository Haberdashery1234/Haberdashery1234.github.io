import { Suspense } from "react";
import { getPublishedApps } from "@/lib/appStore";
import PublishedAppsGrid from "@/components/PublishedAppsGrid";

// A Server Component: with a static export, this runs once during
// `next build`, so the App Store lookup happens then and the results are
// baked into the HTML — visitors never call Apple's API. Renders nothing
// until at least one app is listed in `publishedApps` (data.ts).
export default async function PublishedApps() {
  const apps = await getPublishedApps();
  if (apps.length === 0) return null;

  return (
    <section id="apps" className="section-shell py-20 sm:py-28">
      <p className="text-sm font-mono text-accent mb-3">App Store</p>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
        Published Projects
      </h2>
      <p className="text-sm text-muted mb-12">
        Apps I&apos;ve built and shipped. Click one for screenshots and details.
      </p>

      {/* The grid reads ?app= from the URL to deep-link a detail view, and
          useSearchParams needs a Suspense boundary in a static export. The
          fallback is null rather than a copy of the grid, matching the
          Projects section. */}
      <Suspense fallback={null}>
        <PublishedAppsGrid apps={apps} />
      </Suspense>
    </section>
  );
}
