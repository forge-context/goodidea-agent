# GoodIdea 公开仓库工作约定

- 本仓库只维护 `web/` 官网与固定 Demo、`shared/studio/` 通用 UI 和公开文档。真实产品在独立私有仓库开发。
- 保持现有视觉体系，桌面与手机均需考虑。共用 UI 不引入后端、模型指令或私有依赖。
- 完成前运行 `python3 scripts/check-public-boundary.py` 和 `npm --prefix web run build`；按交互变化进行适当浏览器验收。
- 每次任务在 `CHANGELOG.md` 顶部追加日期、公开式样变化、兼容性、验证与未完成事项。无式样变化也留记录；内部任务履历不复制到这里。
- 保留用户原有修改。公开提交只包含 `scripts/check-public-boundary.py` 中明确允许的路径；不能合并私有分支或提交私有历史。
