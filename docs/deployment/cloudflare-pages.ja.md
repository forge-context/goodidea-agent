# LP を Cloudflare Pages へ Deploy する

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

LP は静的な Vite Build です。API を呼ばず、Secret を持たず、有料の Runtime Service も必要ありません。

本番 Deploy は `main` への push で行われ、Build は Cloudflare 側で走ります。公開されるのは常に、この Repository に実在する Commit です。

## Project の接続（初回のみ）

Pages Project は Git 接続か Direct Upload のどちらかで、**Direct Upload の Project を後から Git 接続へ変更することはできません**。**Workers & Pages → 作成 → Pages → Git に接続** から作成し、次を設定します。

| 設定 | 値 |
| --- | --- |
| Production branch | `main` |
| Root directory | `web` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| 環境変数 | `NODE_VERSION=22` |

他に必要なものはありません。公開 Page は固定 Demo であり Agent ではないため、Build に API Key は不要です。

## 本番 URL

`npm run build` の最後に `scripts/finalize-seo.mjs` が動き、Host が決まって初めて書ける絶対 URL を出力します。`hreflang` の Alternate、`canonical`、`og:url`、`dist/sitemap.xml`、そして `dist/robots.txt` の `Sitemap:` 行です。Root Page は `/en/` を canonical として宣言するので、両者が重複として競合しません。

Host は `SITE_URL` から取得し、既定値は `https://goodidea.jianguoding.com` です。この Host のままなら変数の設定は不要です。別の Host にする場合は Pages の環境変数に `SITE_URL` を追加して Deploy し直してください。URL は Build 時にファイルへ焼き込まれるため、Domain の変更には Build のやり直しが必要です。

## Custom Domain

**Workers & Pages → goodidea → Custom domains。** DNS を変更する前に Pages 側で Domain を関連付けてください。Domain が Cloudflare 管理下にある場合、この Flow の中で通常は必要な CNAME が作成されます。

## Local Preview

```bash
cd web
npm run dev     # Vite
npm run pages   # Pages Runtime 経由。本番に近い
```

`npm run pages` は Wrangler と `web/wrangler.jsonc` を使います。Deploy Script は**意図的に置いていません**。公開は push で行うものであり、手動 Upload はどの Commit にも対応しない Deployment を作ってしまうためです。

公式資料: [Git Integration](https://developers.cloudflare.com/pages/get-started/git-integration/) / [Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) / [Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
