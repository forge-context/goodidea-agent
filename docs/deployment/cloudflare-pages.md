# Deploy the landing page to Cloudflare Pages

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

The landing page is a static Vite build. It calls no API, holds no secret, and needs
no paid runtime service.

## Deploy from the command line

`web/wrangler.jsonc` carries the project name and the output directory, so the
deploy command takes no arguments:

```bash
cd web
npx wrangler login          # once per machine
npm run deploy
```

`npm run deploy` builds and then runs `wrangler pages deploy`. The first deploy
creates the Pages project if it does not exist yet.

Local preview through the Pages runtime rather than Vite:

```bash
cd web
npm run pages
```

## Production URLs

`npm run build` finishes by running `scripts/finalize-seo.mjs`, which writes the
absolute URLs that can only exist once the host is known: `hreflang` alternates,
`canonical`, `og:url`, `dist/sitemap.xml`, and the `Sitemap:` line in
`dist/robots.txt`. The root page declares `/en/` as its canonical so the two are not
indexed as competing duplicates.

The host comes from `SITE_URL` and defaults to `https://goodidea.jianguoding.com`.
Deploying under a different host is one variable, and no HTML file changes:

```bash
SITE_URL=https://example.com npm run deploy
```

Because the URLs are baked into the build, a host change requires a rebuild. Setting
it only in the Cloudflare dashboard would leave the previous host inside the files.

## Custom domain

Wrangler has no command for attaching a domain, so this step stays in the dashboard:
**Workers & Pages → goodidea → Custom domains**. Associate the domain in Pages before
changing DNS; when the domain is already managed by Cloudflare, the required CNAME is
normally created during this flow.

## If you prefer Git integration instead

Connect the repository in the dashboard with root directory `web`, build command
`npm run build`, output directory `dist`, and `NODE_VERSION=22`. Set `SITE_URL` there
only if it differs from the default.

Official references: [Pages direct upload](https://developers.cloudflare.com/pages/get-started/direct-upload/),
[build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/),
and [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
