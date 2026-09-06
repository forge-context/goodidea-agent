# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

Public website, scripted product Demo, and reusable Studio UI. This repository does not contain the actively developed product backend or live workspace.

```bash
npm --prefix web ci
npm --prefix web run dev
npm --prefix web run build
python3 scripts/check-public-boundary.py
```

- `web/`: static website and scripted Demo; no live model or backend credentials.
- `shared/studio/`: shared styles, map renderer and presentation types. Product consumers pin a reviewed commit and verify file hashes.
- [Visual system](docs/design/lp-visual-system.md)
- [Cloudflare Pages](docs/deployment/cloudflare-pages.md)
- [Change history](CHANGELOG.md)

Earlier experimental backend code remains part of repository history. This migration does not revoke previously published copies. [MIT license](LICENSE).
