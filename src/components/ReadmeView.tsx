"use client";

import { useEffect, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { getRepoReadme } from "@/lib/github";

/**
 * Renders a repo's README.md inside the project modal — the bulk of what
 * makes the modal worth opening over just reading the card.
 *
 * Deliberately trimmed for this context:
 * - The leading "# RepoName" title is dropped (the modal already shows it).
 * - A "Screenshots" section is dropped, and images are never rendered —
 *   the modal's carousel already shows them, larger.
 * - Raw HTML in the markdown is skipped entirely (react-markdown's
 *   `skipHtml`), which is also what keeps rendering someone's README safe.
 */
export default function ReadmeView({ owner, repo }: { owner: string; repo: string }) {
  const repoKey = `${owner}/${repo}`;
  // Tagged with the repo it was loaded for — see useRepoMedia for why.
  const [loaded, setLoaded] = useState<{ key: string; markdown: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRepoReadme(owner, repo).then((readme) => {
      if (!cancelled) setLoaded({ key: repoKey, markdown: readme?.markdown ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [owner, repo, repoKey]);

  if (!loaded || loaded.key !== repoKey) {
    return (
      <div aria-hidden="true" className="space-y-3 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-surface-hover" />
        <div className="h-3 w-full rounded bg-surface-hover" />
        <div className="h-3 w-5/6 rounded bg-surface-hover" />
        <div className="h-3 w-2/3 rounded bg-surface-hover" />
      </div>
    );
  }

  const markdown = loaded.markdown && prepareReadme(loaded.markdown);
  if (!markdown?.trim()) return null;

  const repoBase = `https://github.com/${owner}/${repo}`;

  return (
    <div className="prose prose-sm sm:prose-base prose-site max-w-none prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-pre:border prose-pre:border-border prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => defaultUrlTransform(resolveReadmeLink(url, repoBase))}
        components={{
          img: () => null,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** README links are written relative to the repo (e.g. "docs/SETUP.md" or
 * "#getting-started") — point them at the matching page on github.com,
 * since they'd otherwise resolve against this site. Absolute URLs and
 * mailto: links pass through unchanged. */
function resolveReadmeLink(url: string, repoBase: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  if (url.startsWith("#")) return `${repoBase}${url}`;
  try {
    return new URL(url, `${repoBase}/blob/HEAD/`).toString();
  } catch {
    return url;
  }
}

/** Drops the leading H1 title and any "Screenshots" section (up to the
 * next heading of the same or higher level), ignoring "#" lines inside
 * fenced code blocks so a shell comment isn't mistaken for a heading. */
function prepareReadme(markdown: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  let skipUntilLevel: number | null = null;
  let seenContent = false;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1];
      else if (fenceMatch[1] === fence) fence = null;
    }

    const heading = fence === null && !fenceMatch ? line.match(/^(#{1,6})\s+(.*?)[\s#]*$/) : null;
    if (heading) {
      const level = heading[1].length;
      if (skipUntilLevel !== null && level <= skipUntilLevel) skipUntilLevel = null;
      if (!seenContent && level === 1) {
        seenContent = true;
        continue;
      }
      if (/^screenshots?$/i.test(heading[2])) {
        skipUntilLevel = level;
        continue;
      }
    }

    if (line.trim()) seenContent = true;
    if (skipUntilLevel === null) out.push(line);
  }

  return out.join("\n");
}
