# Portfolio Website

A personal portfolio site built with Next.js (App Router), TypeScript, and
Tailwind CSS, inspired by the layout and dark aesthetic of
[sideapps.dev](https://www.sideapps.dev/). Includes a sticky nav, hero,
about, projects grid, skills, contact form, and footer with social links.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Editing content

All of the placeholder copy lives in one place: **`src/lib/data.ts`**. Update
it with your real name, role, bio, projects, skills, and social links and
every section will pick up the changes automatically:

- `profile` — name, role/title, tagline, email, location, resume link,
  GitHub username (used to pull live projects — see below)
- `socials` — GitHub / LinkedIn / email / resume links shown in the hero,
  contact section, and footer
- `about` — bio paragraphs, stat callouts, and a `clients` list rendered as
  a "Worked with" strip (omit or empty the array to hide it)
- `placeholderProjects` — fallback cards shown only if the live GitHub
  fetch below fails or returns nothing
- `skills` — grouped skills/tools list
- `nav` — the links shown in the navbar/footer
- `formspreeEndpoint` — where the contact form submits to (see below)

## Projects (live from GitHub)

`src/lib/github.ts` fetches `profile.githubUsername`'s public, non-fork,
non-archived repos from the GitHub REST API and renders the 6 most
recently pushed as project cards — using each repo's primary language +
GitHub topics as the "technologies used" tags. Two repos are always
excluded even if they're public: `{username}.github.io` (this site's own
repo) and `{username}` (GitHub's special profile-README repo) — neither
is a real project.

This fetch happens **client-side, in the visitor's browser** — the site is
a static export (see below), so there's no server left to fetch it ahead
of time. `ProjectsGrid.tsx` renders `placeholderProjects` from `data.ts`
immediately (so there's real content in the page from the first paint,
not a blank section) and swaps in live data once the fetch resolves. If
the fetch fails for any reason — offline, rate-limited, GitHub down — it
just stays on the placeholder cards instead of breaking the page.

Because this runs in the browser, it's always unauthenticated (a token
would have to ship inside the public JS bundle for anyone to read, which
isn't safe), capped at 60 requests/hour — but that limit is scoped to
each visitor's own IP address, not shared across everyone who visits the
site, so it's a non-issue at normal portfolio traffic.

To pull fresh data while developing locally, just reload the page —
there's no build-time cache to clear anymore.

## Contact form

Submissions POST directly to [Formspree](https://formspree.io) — no
backend code needed. The endpoint lives in `formspreeEndpoint` in
`src/lib/data.ts`. To change where messages go, create/manage the form at
[formspree.io/forms](https://formspree.io/forms) and swap in its endpoint
URL.

## Styling

- Dark theme by default (see `src/app/globals.css` for the color tokens —
  `--background`, `--surface`, `--accent`, etc. Change `--accent` to
  restyle the whole site's accent color).
- Uses the system font stack (no external font fetch needed at build time).
- Tailwind CSS v4, configured via `@theme inline` in `globals.css`.

## Building for production

This project builds to a **static export** — `next build` produces a
plain `out/` folder of HTML/CSS/JS with no Node server required, which is
what GitHub Pages (and most static hosts) need. This is configured via
`output: "export"` in `next.config.ts`.

```bash
npm run build      # writes the static site to out/
npm run preview    # serves out/ locally at http://localhost:3000 so you
                    # can sanity-check the production build before pushing
```

## Deploying to GitHub Pages

This repo is set up to publish as your GitHub **user site**, which means
the repo itself must be named exactly `Haberdashery1234.github.io` — that
exact name is what tells GitHub to serve it at the clean root URL
`https://haberdashery1234.github.io` instead of a project-site URL with a
subpath. A GitHub Actions workflow at
`.github/workflows/deploy.yml` builds and publishes the site
automatically on every push to `main`, using the same official pattern as
Next.js's own GitHub Pages deploy template.

One-time setup:

1. On GitHub, create a new repository named exactly
   `Haberdashery1234.github.io` (public, no README/`.gitignore`/license —
   this project already has its own).
2. From this project folder, push it to that repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/Haberdashery1234/Haberdashery1234.github.io.git
   git push -u origin main
   ```
3. On GitHub, go to the repo's **Settings → Pages**, and under "Build and
   deployment" set **Source** to **GitHub Actions** (not "Deploy from a
   branch" — the workflow handles the build itself).
4. Push triggers the workflow automatically; watch its progress under the
   repo's **Actions** tab. Once it finishes, the site is live at
   `https://haberdashery1234.github.io`.

After that first push, every future `git push` to `main` rebuilds and
redeploys automatically — no manual steps needed. You can also trigger a
rebuild without a new commit from the Actions tab (`Deploy to GitHub
Pages` workflow → **Run workflow**), e.g. after adding a new pinned repo
description on GitHub.

### Other hosts

The site also works on any static host if you'd rather not use GitHub
Pages — e.g. Netlify or Cloudflare Pages, pointed at the `out/` folder
produced by `npm run build`. It would also run on
[Vercel](https://vercel.com/new) even without the static-export config
(Vercel supports full Next.js natively), though as configured now it
builds to a static export either way.
