# 把 LP 部署到 Cloudflare Pages

[English](cloudflare-pages.md) | [日本語](cloudflare-pages.ja.md) | [中文](cloudflare-pages.zh.md)

LP 是纯静态的 Vite 构建产物。它不调用任何 API，不持有任何密钥，也不需要付费运行时服务。

正式部署由推送到 `main` 触发，构建在 Cloudflare 上完成。因此线上内容始终对应仓库里真实存在的某个 commit。

## 一次性连接项目

一个 Pages 项目要么连接 Git，要么是直接上传，**直接上传的项目之后无法改成 Git 集成**。请通过 **Workers & Pages → 创建 → Pages → 连接到 Git** 创建，并设置：

| 设置项 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 根目录 | `web` |
| 构建命令 | `npm run build` |
| 构建输出目录 | `dist` |
| 环境变量 | `NODE_VERSION=22` |

其余都不需要。构建不需要任何 API key，因为公开页面跑的是固定 Demo，不是真实 Agent。

## 正式 URL

`npm run build` 结束时会运行 `scripts/finalize-seo.mjs`，写入只有确定域名后才存在的绝对 URL：`hreflang` 备用链接、`canonical`、`og:url`、`dist/sitemap.xml`，以及 `dist/robots.txt` 里的 `Sitemap:` 行。根路径声明 `/en/` 为 canonical，因此两者不会作为重复内容互相竞争。

域名来自 `SITE_URL`，默认是 `https://goodidea.jianguoding.com`，所以只要用这个域名就不需要设任何变量。要换域名，在 Pages 的环境变量里加上 `SITE_URL` 并重新部署——这些 URL 是构建时写进文件的，换域名必须重新构建。

## 自定义域名

**Workers & Pages → goodidea → Custom domains。** 先在 Pages 里关联域名，再修改 DNS。如果域名已经由 Cloudflare 管理，通常会在这个流程中自动创建所需的 CNAME。

## 本地预览

```bash
cd web
npm run dev       # Vite 开发服务器
npm run preview   # 在本地跑正式构建产物
```

仓库里**刻意不放 Wrangler 配置和部署脚本**。连接 Git 的 Pages 项目两者都不需要，而手动上传会产生一个不对应任何 commit 的部署。

官方文档：[Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)、[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)和[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。
