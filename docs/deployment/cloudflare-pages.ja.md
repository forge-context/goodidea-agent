# LP を Cloudflare Pages へ Deploy する

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

LP は静的な Vite Build です。API を呼ばず、Secret を持たず、有料の Runtime Service も必要ありません。

## Command で Deploy する

`web/wrangler.jsonc` に Project 名と出力先が書いてあるため、Deploy Command に引数は要りません。

```bash
cd web
npx wrangler login          # 各 Machine で一度だけ
npm run deploy
```

`npm run deploy` は Build してから `wrangler pages deploy` を実行します。初回は Pages Project が無ければ作成されます。

Vite ではなく Pages Runtime で Local Preview する場合：

```bash
cd web
npm run pages
```

## 本番 URL

`npm run build` の最後に `scripts/finalize-seo.mjs` が動き、Host が決まって初めて書ける絶対 URL を出力します。`hreflang` の Alternate、`canonical`、`og:url`、`dist/sitemap.xml`、そして `dist/robots.txt` の `Sitemap:` 行です。Root Page は `/en/` を canonical として宣言するので、両者が重複として競合しません。

Host は `SITE_URL` から取得し、既定値は `https://goodidea.jianguoding.com` です。別の Host にする場合も変数一つで、HTML の編集は不要です。

```bash
SITE_URL=https://example.com npm run deploy
```

URL は Build 時にファイルへ焼き込まれるため、Host を変えたら Build し直してください。Cloudflare の設定画面だけで変更しても、ファイルの中は以前の Host のままです。

## Custom Domain

Domain を紐付ける Command は wrangler にありません。この手順だけ Dashboard で行います：**Workers & Pages → goodidea → Custom domains**。DNS を変更する前に Pages 側で Domain を関連付けてください。Domain が Cloudflare 管理下にある場合、この Flow の中で通常は必要な CNAME が作成されます。

## Git 連携を使う場合

Dashboard で Repository を接続し、Root directory を `web`、Build command を `npm run build`、Build output directory を `dist`、`NODE_VERSION=22` に設定します。`SITE_URL` は既定値と異なる場合だけ設定します。

公式資料: [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) / [Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) / [Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
