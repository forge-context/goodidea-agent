# Deploy the landing page to Cloudflare Pages

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

The landing page is a static Vite build. It calls no API, holds no secret, and needs
no paid runtime service.

Production deploys come from a push to `main`. Cloudflare builds the page itself, so
what is published is always a commit that exists in this repository.

## Connect the project once

A Pages project is either Git-connected or direct-upload, and a direct-upload project
cannot be converted later. Create this one through **Workers & Pages → Create →
Pages → Connect to Git**, then set:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `web` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION=22` |

Nothing else is required. The build needs no API key, because the published page runs
a fixed demo rather than the agent.

## Production URLs

`npm run build` finishes by running `scripts/finalize-seo.mjs`, which writes the
absolute URLs that can only exist once the host is known: `hreflang` alternates,
`canonical`, `og:url`, `dist/sitemap.xml`, and the `Sitemap:` line in
`dist/robots.txt`. `/` is the canonical English page: `/en/` serves the same copy and
points back at it, so the pair is consolidated rather than indexed as two competitors.
For the same reason the sitemap lists `/`, `/ja/` and `/zh-cn/` but not `/en/`, and
every English link in the page — the brand mark, the language switch — points at `/`.
Search Console reports a page whose canonical names a different URL as belonging to
that other URL, so a page that points away from itself is a page that asks not to be
indexed.

The host comes from `SITE_URL` and defaults to `https://goodidea.jianguoding.com`, so
no variable is needed while that is the host. To publish under a different one, add
`SITE_URL` to the Pages environment variables and redeploy: the URLs are written into
the files at build time, so changing the domain requires a new build.

## What a crawler reads first

The same script writes the page's copy into `<div id="root">` before the build
finishes, through `scripts/prerenderShell.mjs`. Google indexes the first response and
renders later, and an empty container gives it a page with no heading, no prose and no
internal links to file. The shell is markup only — React replaces it on mount — and
both sides read `src/siteCopy.ts`, so the copy still has one source.

If the build fails with `no empty #root to prerender into`, Vite's HTML output changed
shape and the copy is no longer reaching the container. Fix the match rather than
removing the check: without it the page ships empty again and nothing reports it.

## Unknown paths

`public/404.html` answers requests that match no file. Without it Cloudflare replied to
every unknown path with a copy of the home page at status 200 — a soft 404, which
offers a crawler unlimited URLs that all look like duplicates of one page. After a
deploy, confirm the status is really 404:

```bash
curl -sI https://goodidea.jianguoding.com/no-such-page | head -1
```

A `200` there means something on the Cloudflare side still falls back to `index.html`;
check the project's redirect rules.

## Custom domain

**Workers & Pages → goodidea → Custom domains.** Associate the domain in Pages before
changing DNS; when the domain is already managed by Cloudflare, the required CNAME is
normally created during this flow.

## Preview locally

```bash
cd web
npm run dev       # Vite dev server
npm run preview   # the production build, served locally
```

The repository carries no Wrangler configuration and no deploy script on purpose. A
Git-connected Pages project needs neither, and a manual upload would create a
deployment that matches no commit.

Official references: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/),
[build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/),
and [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Shared UI build boundary

Keep the repository root available during the `web` build: the Demo imports `shared/studio/` from its parent directory. If Cloudflare build watch paths are customized, include both `web/**` and `shared/studio/**`; otherwise keep the default all-path trigger. No private repository token or model key is required.
