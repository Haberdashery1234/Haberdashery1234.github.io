"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PublishedApp } from "@/lib/appStore";
import { ArrowUpRight } from "@/components/icons";
import AppIconImage from "@/components/AppIconImage";
import AppModal, { formatRating } from "@/components/AppModal";

const QUERY_KEY = "app";

export default function PublishedAppsGrid({ apps }: { apps: PublishedApp[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Same URL-driven selection as the Projects grid: ?app=slug opens the
  // detail view, so a specific app can be linked to directly.
  const slug = searchParams.get(QUERY_KEY);
  const selected = slug ? apps.find((app) => app.slug === slug) ?? null : null;

  const hrefFor = useCallback(
    (app: PublishedApp | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (app) params.set(QUERY_KEY, app.slug);
      else params.delete(QUERY_KEY);
      const query = params.toString();
      return `${pathname}${query ? `?${query}` : ""}#apps`;
    },
    [pathname, searchParams]
  );

  const openApp = useCallback(
    (app: PublishedApp) => router.push(hrefFor(app), { scroll: false }),
    [router, hrefFor]
  );
  const closeApp = useCallback(
    () => router.push(hrefFor(null), { scroll: false }),
    [router, hrefFor]
  );

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} detailHref={hrefFor(app)} onOpen={openApp} />
        ))}
      </div>

      {selected && <AppModal app={selected} onClose={closeApp} />}
    </>
  );
}

function AppCard({
  app,
  detailHref,
  onOpen,
}: {
  app: PublishedApp;
  detailHref: string;
  onOpen: (app: PublishedApp) => void;
}) {
  const screenshot = app.screenshots[0];
  const [screenshotFailed, setScreenshotFailed] = useState(false);
  const rating = formatRating(app);

  return (
    <article className="card relative p-6 flex flex-col h-full transition-colors hover:border-accent/50">
      {/* Stretched link covering the card — see ProjectsGrid for why this
          is a real link rather than a clickable div. */}
      <a
        href={detailHref}
        onClick={(e) => {
          e.preventDefault();
          onOpen(app);
        }}
        aria-label={`View details for ${app.name}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
      />

      {screenshot && !screenshotFailed && (
        // Full-bleed across the top of the card, contained rather than
        // cropped. Decorative: the heading names the app, and the detail
        // view carries descriptive alt text.
        <div className="-mx-6 -mt-6 mb-5 h-44 rounded-t-2xl bg-surface-hover flex items-center justify-center overflow-hidden px-6 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot.url}
            alt=""
            loading="lazy"
            onError={() => setScreenshotFailed(true)}
            className="max-h-full max-w-full object-contain rounded-md shadow-md"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-muted truncate">{app.genre}</span>
        <span className="text-xs font-mono text-muted shrink-0">{app.year}</span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {app.iconUrl && <AppIconImage src={app.iconUrl} className="h-10 w-10" />}
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate">{app.name}</h3>
          {app.role && <p className="text-xs text-accent truncate">{app.role}</p>}
        </div>
      </div>

      <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3 flex-1">
        {app.description}
      </p>

      {/* Above the stretched link (z-10) so it stays independently clickable. */}
      <div className="relative z-10 mt-5 flex items-center gap-4 pt-4 border-t border-border">
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80"
        >
          App Store <ArrowUpRight size={14} />
        </a>
        {rating && <span className="ml-auto text-xs text-muted">{rating}</span>}
      </div>
    </article>
  );
}
