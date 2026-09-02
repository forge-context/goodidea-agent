# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

**一次只做一个决定，把模糊想法变成有证据支持、可验证的 MVP。**

GoodIdea 是一款产品引导 Agent，面向准备使用 AI 构建产品、却尚未明确应该构建什么的用户。它帮助用户调查市场、找出最重要的不确定性、验证可行性、收敛 MVP，并为 Coding Agent 准备清晰的交接内容。

> GoodIdea 鼓励用户采取行动，但不会假装一个未经验证的想法必然成功。

## 为什么需要 GoodIdea

当用户、问题、约束和产品边界还不清晰时，Coding Agent 就可能开始生成页面和代码。最终结果或许在技术上可以运行，却并不是用户真正需要的产品。

GoodIdea 只在必要范围内推迟实现，用来回答下一个影响最大的产品问题。进度代表关键不确定性减少了多少，而不是完成了多少文档。

## 预期体验

```text
模糊想法
  -> 有证据支持的市场调研
  -> 可行性与资源检查
  -> 可选的沙盒 Demo
  -> 产品最终形态与 MVP 边界
  -> 人工确认
  -> 交给 Coding Agent
```

这条路径不是固定的。当新证据推翻已有假设时，GoodIdea 可以退回前面的阶段。它每次只问一个有价值的问题，而不是给用户一份很长的问卷。

每个阶段都会显示：

- 已经确认了什么；
- 还存在哪些不确定性；
- 为什么需要回答下一个问题；
- 当前是否可以继续前进。

## 示例

当用户提出“做一个能自动炒股、帮我赚钱的产品”时，GoodIdea 不应该承诺收益，也不应该立即设计页面。它会先调查现有市场和技术现实，把自动执行与盈利策略发现分开，并在接入真钱前提出风险更低的验证闭环，例如模拟交易。

第一个确定性离线 Demo 不需要 LLM 或真实 Web Search：

```bash
PYTHONPATH=src python -m goodidea_agent.demo --locale zh-CN
PYTHONPATH=src python -m goodidea_agent.demo --locale zh-CN \
  --database goodidea.db --session demo-1
```

也可以通过本地 API 运行同一条离线工作流：

```bash
PYTHONPATH=src GOODIDEA_DATABASE=goodidea.db \
  uvicorn goodidea_agent.api.app:app --reload
```

本地 API 提供完整的离线流程：

- `POST /api/v1/sessions/{id}/research`
- `POST /api/v1/sessions/{id}/answers`
- `POST /api/v1/sessions/{id}/proposal`
- `POST /api/v1/sessions/{id}/approval`
- `GET /api/v1/sessions/{id}/sandbox-preview`
- `GET /api/v1/sessions/{id}`

可以在 `/docs` 查看本地 OpenAPI UI。

三语言静态 LP 和固定交互 Demo 的启动方式：

```bash
cd web
npm install
npm run dev
```

正式构建使用 `npm run build`。每次推送到 `main`，Cloudflare Pages 都会执行它，因此线上内容始终与仓库中的某个 commit 一致。项目设置以及写入绝对 URL 的 `SITE_URL` 变量，参见[部署到 Cloudflare Pages](docs/deployment/cloudflare-pages.zh.md)。
配色、层级、动效和无障碍决定参见 [LP 视觉系统与设计理由](docs/design/lp-visual-system.zh.md)。Agent 由什么构成、每项能力的边界划在哪里，记录在 [Agent 能力地图](docs/design/agent-capabilities.zh.md)。

确定性的 Agent Evaluation 可以这样运行：

```bash
PYTHONPATH=src python -m goodidea_agent.evaluation.offline
```

模型配置是可选的。不配置时工作流保持完全确定；配置后由模型评估想法，取代关键词匹配。
把 `.env.example` 复制为 `.env` 并填入 `GOODIDEA_MODEL_*`，然后在 Key 还有效时把真实响应
录制成 Fixture，这样依赖模型的测试在 Key 过期后仍然可用：

```bash
set -a && source .env && set +a
PYTHONPATH=src python -m goodidea_agent.model.record
```

## MVP 范围

第一个纵向切片支持以下流程：

1. 接收一个模糊的产品想法。
2. 使用 Web Search 生成简短、带引用的“市场现实卡”。
3. 找出当前最大的未解决产品假设。
4. 解释原因，并提出一个高价值的后续问题。
5. 更新用户可见的阶段进度。
6. 生成一份初步且可验证的 MVP 定义。

详细契约：[纵向切片 01——从模糊想法到市场现实卡](docs/acceptance/vertical-slice-01.zh.md)。

公开 LP 已经包含一个明确标注、由固定数据驱动的交互 Demo，不会调用真实 Agent。第一阶段的真实 Agent 只在本地运行。

## 语言

仓库文档维护英语、日语和简体中文三个版本。产品 UI 实现时也以这三种语言为首批目标。语言层只改变呈现方式，不得改变产品阶段判断和证据规则。

## 计划架构

```text
React + TypeScript + Vite
          | REST / SSE
          v
FastAPI + Pydantic
          |
          v
LangGraph workflow
  |-- model adapter
  |-- web-search adapter
  |-- structured memory
  |-- sandbox adapter
  `-- coding-agent adapter
```

初始技术选择：

- **前端：** React、TypeScript 和 Vite，静态部署到 Cloudflare。
- **API：** Python、FastAPI 和 Pydantic。
- **工作流：** 使用 LangGraph 显式管理状态、中断、恢复和路由。
- **模型：** 在 `ModelAdapter` 之后使用任何 OpenAI 兼容的 Chat Completions 端点。
  结构化输出由 Pydantic 在本地校验，不依赖某个厂商专有的 Schema 功能，因此更换供应商
  不会削弱契约。
- **网络搜索：** 在 `WebSearchAdapter` 后使用 Tavily，确定性测试使用 Fake Adapter。
- **Memory：** 使用 SQLite，以结构化记录保存决定、证据、资源和未解决问题。
- **沙盒：** 供审阅的模拟数据 HTML 预览，以及为解决一个被点名的不确定性而进行的容器执行（无网络、只读文件系统、去掉全部 capability）。没有容器运行时则拒绝运行。
- **Evaluation：** 确定性的状态迁移测试，加上基于场景的 Agent 质量评估。

## Agent 与 Harness 的选择

GoodIdea 使用 LangGraph，使产品阶段的迁移保持显式且可测试。模型可以在获得授权的阶段内选择工具，但不能自行认定产品已经通过验证，也不能悄悄把用户推进到实现阶段。

Adapter 边界借鉴了 DeepSeek Harness 等 Agent Harness 的可组合思想，但不依赖仍处于 Developer Preview 的运行时。

V1 刻意不依赖 Deep Agents。初始调研应该只取得足够做出下一步判断的最少证据。如果 Evaluation 证明调研确实需要长任务规划、上下文卸载或子 Agent，之后可以在 Research Agent 接口后增加 Deep Agents 实现。

## 产品原则

- 赞扬用户取得的具体进展，而不是假设产品会商业成功。
- 明确区分证据、假设和用户决定。
- 不把连续回答“是”当成产品已经明确。
- 用一个有意义的问题代替很长的检查表。
- Demo 只用于解决一个明确的不确定性，不用于掩盖尚未完成的产品定义。
- 重要决定和外部副作用始终由人控制。

## 当前状态

离线工作流现在可以完成市场调研、用户决定、带约束的可行性分析、MVP 提案、用户批准和 Coding Agent 交接。模糊同意不会选择路径，未经批准的提案也不能产生交接包。SQLite 分别保存 Snapshot、证据、未解决问题、产品决定和批准记录。Sandbox Adapter 在禁止脚本、网络和持久化的条件下生成 Mock Preview；离线 Evaluation 会检查证据、用户权限、语言一致性、Proposal Identity 和副作用安全。

React/Vite LP 已经实现英语、日语和简体中文，每次推送到 `main` 自动发布。首屏是一张地图：一个想法在通往「可以动手」的路上，三次拒绝看起来更快的捷径。背后的理由记录在 [LP 视觉系统](docs/design/lp-visual-system.zh.md)。`web/lab/` 单独渲染这个首屏，带三语言切换和重播，用于在不触碰整页的情况下调整它。交互 Demo 是一段完全在浏览器里运行的固定体验：左边对话，右边的想法地图跟着长出来。概念先以碎片出现并逐渐聚合；所有节点可以选中和轻量编辑，只有带 `↗` 的节点能显式进入分枝。分枝结果会先预览，再选择合入、留作候选或不保留。

页面标题和标题栏文案刻意不同：`<title>` 承担产品的定位句，那是应该出现在搜索结果里的一句；H1 是页面上的钩子。

模型边界已经实装：`ModelAdapter`、OpenAI 兼容 Adapter、脚本化 Fake，以及按 Prompt 而不是按供应商匹配的录制 Fixture。结构化响应由 Pydantic Schema 校验并最多修复一次，因此不依赖任何供应商专有的 Schema 功能。配置模型后由模型评估想法。再配置 Tavily Key，整个调研环节就变成真实的：模型写检索式，Tavily 返回结果，市场现实卡由返回内容写成。来源可信度由 URL 判断而不是由模型判断，无法承担署名的页面不会被引用，引用了未检索到的来源的回答会被退回修正后才可使用。MVP 边界也由同样的方式写成：可行性路径、这一版要做与明确不做、验收条件和实现顺序，都基于本次会话的决定和证据生成；同一项同时出现在要做和不做两侧的边界，会在用户看到之前被退回。生成提案本身不构成批准。用户的回答也由同样的方式读取：用自己的话给出的回答会被理解而不是被匹配，并用同样的话复述回去。没有做出选择的同意不会到达模型，因此「好的」不会变成一条产品路径；模型无法判定的回答，会针对用户实际说了什么再问一次。不配置时工作流保持关键词判断且完全确定。券商连接和公开 Agent Service 尚未启用。

验收契约：[纵向切片 02——从用户决定到 Coding Agent 交接](docs/acceptance/vertical-slice-02.zh.md)。
