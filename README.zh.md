# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

公开官网、固定产品 Demo 与可复用 Studio UI。持续开发的真实工作台与 Agent 后端已迁出本仓库。

```bash
npm --prefix web ci
npm --prefix web run dev
npm --prefix web run build
python3 scripts/check-public-boundary.py
```

- `web/`: static website and scripted Demo; no live model or backend credentials.
- `shared/studio/`: shared styles, map renderer and presentation types. Product consumers pin a reviewed commit and verify file hashes.
- [Visual system](docs/design/lp-visual-system.zh.md)
- [Cloudflare Pages](docs/deployment/cloudflare-pages.zh.md)
- [Change history](CHANGELOG.md)

Earlier experimental backend code remains part of repository history. This migration does not revoke previously published copies. [MIT license](LICENSE).
