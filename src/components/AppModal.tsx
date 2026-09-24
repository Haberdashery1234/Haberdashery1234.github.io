"use client";

import type { PublishedApp } from "@/lib/appStore";
import { ArrowUpRight } from "@/components/icons";
import AppIconImage from "@/components/AppIconImage";
import DetailModal, { DetailHeader, StatGrid } from "@/components/DetailModal";

const TITLE_ID = "app-modal-title";

/** e.g. 4.50079, 62847 -> "★ 4.5 (62,847)" */
export function formatRating(app: PublishedApp): string | null {
  if (app.rating === undefined) return null;
  return `★ ${app.rating.toFixed(1)} (${app.ratingCount.toLocaleString("en-US")})`;
}

export default function AppModal({ app, onClose }: { app: PublishedApp; onClose: () => void }) {
  const rating = formatRating(app);

  const stats = [
    rating && { label: "Rating", value: rating },
    app.version && { label: "Version", value: app.version },
    app.releasedAt && { label: "Released", value: app.releasedAt },
    app.updatedAt && { label: "Last updated", value: app.updatedAt },
    app.minimumOsVersion && { label: "Requires", value: `iOS ${app.minimumOsVersion}+` },
    app.price && { label: "Price", value: app.price },
  ].filter((s): s is { label: string; value: string } => Boolean(s));

  return (
    <DetailModal titleId={TITLE_ID} name={app.name} screenshots={app.screenshots} onClose={onClose}>
      <DetailHeader
        titleId={TITLE_ID}
        icon={app.iconUrl && <AppIconImage src={app.iconUrl} className="h-16 w-16" />}
        eyebrow={`${app.genre} · ${app.developer}`}
        title={app.name}
      />

      {app.role && <p className="mt-4 text-sm font-medium text-accent">{app.role}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-button px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          View on the App Store <ArrowUpRight size={16} />
        </a>
      </div>

      <StatGrid stats={stats} />

      {app.description && (
        <section className="mt-8 pt-8 border-t border-border">
          <h4 className="text-sm font-mono text-accent mb-4">About</h4>
          {/* App Store descriptions are plain text with line breaks for
              paragraphs and bullet lists — pre-line keeps that layout. */}
          <p className="text-sm sm:text-base text-muted leading-relaxed whitespace-pre-line">
            {app.description}
          </p>
        </section>
      )}

      {app.releaseNotes && (
        <section className="mt-8 pt-8 border-t border-border">
          <h4 className="text-sm font-mono text-accent mb-1">What&apos;s New</h4>
          {app.version && (
            <p className="text-xs text-muted mb-4">
              Version {app.version}
              {app.updatedAt ? ` · ${app.updatedAt}` : ""}
            </p>
          )}
          <p className="text-sm sm:text-base text-muted leading-relaxed whitespace-pre-line">
            {app.releaseNotes}
          </p>
        </section>
      )}
    </DetailModal>
  );
}
