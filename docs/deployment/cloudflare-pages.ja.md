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

`npm run build` の最後に `scripts/finalize-seo.mjs` が動き、Host が決まって初めて書ける絶対 URL を出力します。`hreflang` の Alternate、`canonical`、`og:url`、`dist/sitemap.xml`、そして `dist/robots.txt` の `Sitemap:` 行です。英語の Canonical Page は `/` です。`/en/` は同じ Copy を配信しつつ `/` を指すので、2 つが重複として競合せず 1 つに統合されます。同じ理由で sitemap は `/`・`/ja/`・`/zh-cn/` を載せ `/en/` は載せません。Page 内の英語 Link も、Brand Mark も言語切り替えも `/` を指します。canonical が別 URL を指す Page を、Search Console はその別 URL のものとして扱います。つまり自分自身を指さない Page は、Index に載せないでほしいと自分から言っている Page です。

Host は `SITE_URL` から取得し、既定値は `https://goodidea.jianguoding.com` です。この Host のままなら変数の設定は不要です。別の Host にする場合は Pages の環境変数に `SITE_URL` を追加して Deploy し直してください。URL は Build 時にファイルへ焼き込まれるため、Domain の変更には Build のやり直しが必要です。

## Crawler が最初に読むもの

同じ Script が Build の最後に、`scripts/prerenderShell.mjs` を通して Page の Copy を
`<div id="root">` へ書き込みます。Google は最初の Response を Index し、Rendering は
後から行うため、空の Container では見出しも本文も内部 Link もない Page が登録されて
しまいます。Shell は Markup だけで、Mount 時に React が置き換えます。どちらも
`src/siteCopy.ts` を読むので、Copy の出どころは 1 つのままです。

Build が `no empty #root to prerender into` で失敗した場合、Vite の HTML 出力の形が
変わり Copy が Container へ届かなくなっています。Check を外すのではなく Match を直して
ください。外すと Page は再び空のまま公開され、それを知らせるものが何もありません。

## 存在しない Path

どの File にも一致しない Request には `public/404.html` が応答します。これが無いと
Cloudflare は未知の Path すべてに Home Page の複製を Status 200 で返していました。
Soft 404 です。1 つの Page の重複にしか見えない URL を、Crawler に無限に与えます。
Deploy 後、本当に 404 が返るか確認してください。

```bash
curl -sI https://goodidea.jianguoding.com/no-such-page | head -1
```

ここで `200` なら、Cloudflare 側がまだ `index.html` へ Fallback しています。Project の
Redirect Rule を確認してください。

## Custom Domain

**Workers & Pages → goodidea → Custom domains。** DNS を変更する前に Pages 側で Domain を関連付けてください。Domain が Cloudflare 管理下にある場合、この Flow の中で通常は必要な CNAME が作成されます。

## Local Preview

```bash
cd web
npm run dev       # Vite Dev Server
npm run preview   # 本番 Build を Local で配信
```

Wrangler の設定も Deploy Script も**意図的に置いていません**。Git 接続の Pages Project にはどちらも不要で、手動 Upload はどの Commit にも対応しない Deployment を作ってしまうためです。

公式資料: [Git Integration](https://developers.cloudflare.com/pages/get-started/git-integration/) / [Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) / [Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)

## Shared UI build boundary

Keep the repository root available during the `web` build: the Demo imports `shared/studio/` from its parent directory. If Cloudflare build watch paths are customized, include both `web/**` and `shared/studio/**`; otherwise keep the default all-path trigger. No private repository token or model key is required.
