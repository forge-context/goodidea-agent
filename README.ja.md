# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

**曖昧なアイデアを、根拠のある検証可能な MVP へ。一度に一つの判断を進めます。**

GoodIdea は、AI を使ってプロダクトを作り始めたいものの、何を作るべきかをまだ定義できていない人のためのプロダクトガイド Agent です。市場調査、最重要の不確実性の特定、実現可能性の検証、MVP の絞り込みを支援し、Coding Agent に渡せる明確な引き渡し内容を作ります。

> GoodIdea は行動を後押ししますが、未検証のアイデアが必ず成功するとは言いません。

## GoodIdea が必要な理由

利用者、課題、制約、プロダクト境界が明確になる前に、Coding Agent は画面やコードを作り始められます。その結果、技術的には動いても、本当に必要なプロダクトではないものが出来上がることがあります。

GoodIdea は、次の重要な問いに答えるために必要な分だけ実装を待ちます。進捗とは、文書を何枚作ったかではなく、重大な不確実性をどれだけ減らしたかです。

## 想定する体験

```text
曖昧なアイデア
  -> 根拠に基づく市場調査
  -> 実現可能性とリソースの確認
  -> 必要に応じた Sandbox Demo
  -> プロダクト像と MVP 境界
  -> 人による確認
  -> Coding Agent への引き渡し
```

経路は固定ではありません。新しい根拠によって前提が崩れた場合、GoodIdea は前の段階へ戻れます。長い質問票を提示するのではなく、一度に一つだけ価値のある問いを投げかけます。

各段階では、次を表示します。

- 何が確認できたか
- 何がまだ不明か
- 次の問いがなぜ必要か
- 現時点で先へ進めるか

## 例

「自動で株を売買し、利益を出してくれるプロダクトを作りたい」という曖昧な要求に対して、GoodIdea は利益を約束せず、すぐに画面設計も始めません。まず既存市場と技術的な現実を調べ、自動執行と利益を生む戦略の発見を分けます。そして実資金を接続する前に、ペーパートレードのような低リスクの検証ループを提示します。

最初の決定的な Offline Demo は、LLM と実 Web Search なしで実行できます。

```bash
PYTHONPATH=src python -m goodidea_agent.demo --locale ja
PYTHONPATH=src python -m goodidea_agent.demo --locale ja \
  --database goodidea.db --session demo-1
```

同じ Offline Workflow を Local API から実行できます。

```bash
PYTHONPATH=src GOODIDEA_DATABASE=goodidea.db \
  uvicorn goodidea_agent.api.app:app --reload
```

Local API は Offline Flow 全体を公開します。

- `POST /api/v1/sessions/{id}/research`
- `POST /api/v1/sessions/{id}/answers`
- `POST /api/v1/sessions/{id}/proposal`
- `POST /api/v1/sessions/{id}/approval`
- `GET /api/v1/sessions/{id}/sandbox-preview`
- `GET /api/v1/sessions/{id}`

`/docs` で Local OpenAPI UI を確認できます。

三言語の静的 LP と固定 Interactive Demo は次のように実行します。

```bash
cd web
npm install
npm run dev
```

Production Build は `npm run build`、`npm run deploy` は Build して Wrangler で Upload します。Command の流れと、絶対 URL を書き出す `SITE_URL` については [Cloudflare Pages への Deploy](docs/deployment/cloudflare-pages.ja.md) を参照してください。
配色、階層、Motion、Accessibility の判断理由は [LP Visual System と設計理由](docs/design/lp-visual-system.ja.md) に記録しています。Agent が何でできていて、各能力の境界がどこにあるかは [Agent の能力](docs/design/agent-capabilities.ja.md) に記録しています。

決定的な Agent Evaluation は次のように実行します。

```bash
PYTHONPATH=src python -m goodidea_agent.evaluation.offline
```

Model の設定は任意です。設定しなければ Workflow は完全に決定的なまま動き、設定すると
Keyword 判定の代わりに Model がアイデアを評価します。`.env.example` を `.env` にコピーして
`GOODIDEA_MODEL_*` を設定し、Key が有効なうちに実際の応答を Fixture として記録します。

```bash
set -a && source .env && set +a
PYTHONPATH=src python -m goodidea_agent.model.record
```

## MVP の範囲

最初の縦切りでは、次の流れを実装します。

1. 曖昧なプロダクトアイデアを一つ受け取る。
2. Web Search を使い、短く出典付きの「市場の現実カード」を作る。
3. 最大の未解決プロダクト仮説を特定する。
4. 理由を説明し、価値の高い質問を一つだけ行う。
5. 利用者に見える段階の進捗を更新する。
6. 初期の検証可能な MVP 定義を作る。

詳細な契約: [Vertical Slice 01 — 曖昧なアイデアから市場の現実カードへ](docs/acceptance/vertical-slice-01.ja.md)。

公開 LP には、固定データで動くことを明示した Interactive Demo があります。実 Agent は呼び出しません。最初の MVP 段階では、実 Agent は Local でのみ動かします。

## 言語

リポジトリ文書は英語、日本語、簡体字中国語で管理します。プロダクト UI も実装時には同じ三言語を最初の対象とします。言語ごとの表現が、プロダクト段階の判定や根拠の規則を変えてはなりません。

## 想定アーキテクチャ

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

初期の技術選択は次のとおりです。

- **Frontend:** React、TypeScript、Vite。Cloudflare へ静的デプロイする。
- **API:** Python、FastAPI、Pydantic。
- **Workflow:** LangGraph で状態、中断、再開、ルーティングを明示的に扱う。
- **Model:** `ModelAdapter` の背後で OpenAI 互換の Chat Completions Endpoint を利用する。
  構造化出力は Provider 固有の Schema 機能ではなく Pydantic で自前検証するため、Provider を
  交換しても契約は弱くならない。
- **Web Search:** `WebSearchAdapter` の背後で Tavily を利用し、決定的テストでは Fake Adapter を使う。
- **Memory:** SQLite に判断、根拠、リソース、未解決の問いを構造化して保存する。
- **Sandbox:** 確認用の Mock Data による HTML Preview と、名前の付いた不確実性を一つ解消するための Container 実行（Network なし、読み取り専用 File System、Capability は全て外す）。Container Runtime が無い環境では実行を拒否する。
- **Evaluation:** 決定的な状態遷移テストと、シナリオベースの Agent 品質評価を組み合わせる。

## Agent と Harness の判断

GoodIdea は LangGraph を利用し、プロダクト段階の遷移を明示的かつテスト可能に保ちます。モデルは許可された段階の中で Tool を選べますが、プロダクトが検証済みだと自ら判断したり、利用者を黙って実装段階へ進めたりはできません。

Adapter の境界には DeepSeek Harness などの Agent Harness が持つ構成可能性を取り入れますが、Developer Preview 中の Runtime には依存しません。

V1 では意図的に Deep Agents へ依存しません。初期調査は、次の判断に必要な最小限の根拠を集めるべきです。Evaluation によって長期計画、Context の退避、Sub-agent が必要だと確認できた場合に、Research Agent interface の背後へ Deep Agents 実装を追加できます。

## プロダクト原則

- 仮想的な商業成功ではなく、具体的な前進を評価する。
- 根拠、仮説、利用者の判断を分ける。
- 「はい」が続いたことをプロダクトの確実性に変換しない。
- 長いチェックリストより、意味のある問いを一つ提示する。
- Demo は特定の不確実性を解消するために使い、未完了の発見工程を隠すために使わない。
- 重大な判断と外部への副作用は人の管理下に置く。

## 現在の状態

Offline Workflow は市場調査、人の判断、制約付き実現可能性、MVP 提案、承認、Coding Agent Handoff まで実行できます。曖昧な同意では Path を選ばず、未承認の提案から Handoff を作りません。SQLite は Snapshot、根拠、未解決の問い、Product 判断、承認を分けて保存します。Script、Network、Storage を許可しない Sandbox Adapter で Mock Preview を生成でき、Offline Evaluation が根拠、利用者の権限、言語 Parity、Proposal Identity、副作用の安全性を検査します。

React/Vite の LP は英語、日本語、簡体字中国語で実装済みです。Interactive Demo は Browser 内の固定データだけを使い、Cloudflare Pages の静的 Build ができます。

Model の境界は実装済みです。`ModelAdapter`、OpenAI 互換 Adapter、Script 化した Fake、そして Provider ではなく Prompt で照合する記録済み Fixture があります。構造化応答は Pydantic Schema で検証し、一度だけ修復するため、Provider 固有の Schema 機能に依存しません。Model を設定するとアイデア評価に使われます。さらに Tavily Key を設定すると Research 全体が実物になります。Model が検索 Query を書き、Tavily が答え、返ってきた内容から Market Reality Card を書きます。Source の信頼度は Model ではなく URL から判断し、帰属を持てない Page は引用せず、取得していない Source を引用した回答は採用前に差し戻します。MVP 境界も同じ方法で書かれます。Feasibility Path、最初の版に入れるものと入れないもの、Acceptance Criteria、実装順序が、この Session の判断と根拠から書かれ、同じ項目を included と excluded の両方に置いた境界は利用者に見せる前に差し戻します。提案を生成しても承認にはなりません。利用者の回答も同じ方法で読みます。自分の言葉で書かれた回答を照合ではなく理解し、その言葉のまま言い返します。選択を伴わない同意は Model に届かないので「はい」が Product Path になることはなく、Model が判断できない回答には、利用者が実際に言ったことに即して問い直します。設定がなければ Keyword 判定のまま決定的に動きます。Broker 接続と公開 Agent Service はまだ有効にしていません。

Acceptance Contract: [Vertical Slice 02 — 人の判断から Coding Handoff まで](docs/acceptance/vertical-slice-02.ja.md)。
