# 把 LP 部署到 Cloudflare Pages

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

LP 是纯静态的 Vite 构建产物。它不调用任何 API，不持有任何密钥，也不需要付费运行时服务。

## 用命令行部署

`web/wrangler.jsonc` 里已经写好项目名和输出目录，所以部署命令不带参数：

```bash
cd web
npx wrangler login          # 每台机器一次
npm run deploy
```

`npm run deploy` 会先构建再执行 `wrangler pages deploy`。首次部署时，如果 Pages 项目还不存在会自动创建。

想用 Pages 运行时而不是 Vite 做本地预览：

```bash
cd web
npm run pages
```

## 正式 URL

`npm run build` 结束时会运行 `scripts/finalize-seo.mjs`，写入只有确定域名后才存在的绝对 URL：`hreflang` 备用链接、`canonical`、`og:url`、`dist/sitemap.xml`，以及 `dist/robots.txt` 里的 `Sitemap:` 行。根路径声明 `/en/` 为 canonical，因此两者不会作为重复内容互相竞争。

域名来自 `SITE_URL`，默认是 `https://goodidea.jianguoding.com`。换域名只需要改这一个变量，不动任何 HTML 文件：

```bash
SITE_URL=https://example.com npm run deploy
```

因为这些 URL 是在构建时写进文件的，换域名必须重新构建。只在 Cloudflare 控制台里改环境变量，文件里留下的仍然是旧域名。

## 自定义域名

wrangler 没有绑定域名的命令，这一步仍然在控制台完成：**Workers & Pages → goodidea → Custom domains**。先在 Pages 里关联域名，再修改 DNS。如果域名已经由 Cloudflare 管理，通常会在这个流程中自动创建所需的 CNAME。

## 如果你更想用 Git 集成

在控制台连接仓库，根目录填 `web`，构建命令 `npm run build`，输出目录 `dist`，并设置 `NODE_VERSION=22`。只有当域名和默认值不同时，才需要在那里设置 `SITE_URL`。

官方文档：[Pages 直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)、[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)和[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。
