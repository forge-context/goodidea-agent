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
`dist/robots.txt`. The root page declares `/en/` as its canonical so the two are not
indexed as competing duplicates.

The host comes from `SITE_URL` and defaults to `https://goodidea.jianguoding.com`, so
no variable is needed while that is the host. To publish under a different one, add
`SITE_URL` to the Pages environment variables and redeploy: the URLs are written into
the files at build time, so changing the domain requires a new build.

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
