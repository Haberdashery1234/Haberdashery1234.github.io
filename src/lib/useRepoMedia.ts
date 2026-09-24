"use client";

import { useEffect, useState } from "react";
import {
  getProjectIconUrl,
  getRepoScreenshots,
  parseGithubRepoUrl,
  type Screenshot,
} from "@/lib/github";

export type RepoMedia = { iconUrl: string | null; screenshots: Screenshot[] };

/**
 * A project's app icon and screenshots. The icon comes straight from the
 * list in data.ts, so it's available on the first render; screenshots are
 * an empty list until they've loaded (or if `repoUrl` isn't a GitHub repo).
 * Shared by the project cards and the detail modal — the lookup underneath
 * is memoized, so the modal reuses what its card already loaded.
 */
export function useRepoMedia(repoUrl: string | undefined): RepoMedia {
  // Tagged with the repo they were loaded for, so switching to a different
  // project before a lookup resolves can't briefly show the previous
  // project's screenshots — handled by comparing against the current repo
  // below rather than by resetting state synchronously inside the effect.
  const [loaded, setLoaded] = useState<{ repo: string; screenshots: Screenshot[] } | null>(null);

  useEffect(() => {
    const target = parseGithubRepoUrl(repoUrl);
    if (!repoUrl || !target) return;
    let cancelled = false;
    getRepoScreenshots(target.owner, target.repo).then((screenshots) => {
      if (!cancelled) setLoaded({ repo: repoUrl, screenshots });
    });
    return () => {
      cancelled = true;
    };
  }, [repoUrl]);

  return {
    iconUrl: getProjectIconUrl(repoUrl),
    screenshots: loaded && loaded.repo === repoUrl ? loaded.screenshots : [],
  };
}
