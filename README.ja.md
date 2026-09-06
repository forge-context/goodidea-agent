# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

公開サイト、固定の製品 Demo、再利用可能な Studio UI を管理します。開発中の実ワークスペースと Agent バックエンドは別リポジトリに移動しました。

```bash
npm --prefix web ci
npm --prefix web run dev
npm --prefix web run build
python3 scripts/check-public-boundary.py
```

- `web/`: static website and scripted Demo; no live model or backend credentials.
- `shared/studio/`: shared styles, map renderer and presentation types. Product consumers pin a reviewed commit and verify file hashes.
- [Visual system](docs/design/lp-visual-system.ja.md)
- [Cloudflare Pages](docs/deployment/cloudflare-pages.ja.md)
- [Change history](CHANGELOG.md)

Earlier experimental backend code remains part of repository history. This migration does not revoke previously published copies. [MIT license](LICENSE).
