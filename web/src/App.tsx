import { useEffect, useState } from "react";

import { IdeaMapHero } from "./IdeaMap";
import type { ReactNode } from "react";

type Locale = "en" | "ja" | "zh-CN";
type Phase = "idle" | "research" | "proposal" | "handoff";
type PathChoice = "existing" | "discover";

type SandboxRun = {
  question: string;
  code: string;
  output: string;
  verdict: string;
  limit: string;
};

type HandoffItem = {
  label: string;
  text: string;
};

type BranchCopy = {
  lead: string;
  summary: string;
  included: string[];
  excluded: string[];
  flow: string[];
  assumptions: string[];
  sandbox: SandboxRun;
  handoff: HandoffItem[];
};

type ResearchToken = {
  text: string;
  source?: 0 | 1 | 2;
};

type ResearchAnswerCopy = {
  lead: string;
  paragraphs: ResearchToken[][];
  sourcePrefix: string;
};

type Copy = {
  navDemo: string;
  navHow: string;
  github: string;
  tryDemo: string;
  viewGithub: string;
  demoNote: string;
  githubNote: string;
  primaryNavigationLabel: string;
  languageLabel: string;
  stages: string[];
  demoEyebrow: string;
  demoTitle: string;
  demoIntro: string;
  fixedDemo: string;
  ideaLabel: string;
  idea: string;
  analyze: string;
  currentStage: string;
  complete: string;
  current: string;
  upcoming: string;
  researchAnswer: ResearchAnswerCopy;
  decisionNeeded: string;
  bridge: string;
  question: string;
  why: string;
  existingChoice: string;
  discoverChoice: string;
  proposalEyebrow: string;
  included: string;
  excluded: string;
  flow: string;
  assumptions: string;
  approve: string;
  revise: string;
  revisionMessage: string;
  handoffEyebrow: string;
  handoffTitle: string;
  handoffIntro: string;
  evidence: string;
  approvedBy: string;
  howEyebrow: string;
  howTitle: string;
  howItems: { number: string; title: string; text: string }[];
  sandboxCta: string;
  sandboxLabel: string;
  sandboxConstraints: string[];
  sandboxAsks: string;
  sandboxStages: string[];
  sandboxOutput: string;
  boundaryEyebrow: string;
  boundaryTitle: string;
  boundaryIntro: string;
  boundaryItems: { term: string; text: string }[];
  boundaryNote: string;
  boundaryLink: string;
  boundaryDoc: string;
  principleTitle: string;
  principles: { title: string; text: string }[];
  footer: string;
  branches: Record<PathChoice, BranchCopy>;
};

const copies: Record<Locale, Copy> = {
  en: {
    navDemo: "Demo",
    navHow: "How it works",
    github: "GitHub",
    tryDemo: "Try the fixed demo",
    viewGithub: "View implementation",
    demoNote: "No sign-up. Fixed data.",
    githubNote: "Open source. Runs locally.",
    primaryNavigationLabel: "Primary navigation",
    languageLabel: "Language",
    stages: ["Research", "Feasibility", "Product shape", "MVP boundary", "Handoff"],
    demoEyebrow: "Interactive product example",
    demoTitle: "See how GoodIdea slows down at the right moment.",
    demoIntro:
      "This example runs entirely in your browser with fixed data. It demonstrates the product behavior without calling a live agent.",
    fixedDemo: "Fixed demo · no live agent",
    ideaLabel: "Your rough idea",
    idea: "Build a product that automatically trades stocks and makes money for me.",
    analyze: "Research this idea",
    currentStage: "Milestone path",
    complete: "Complete",
    current: "Current",
    upcoming: "Upcoming",
    researchAnswer: {
      lead: "It is feasible—but the first version should not promise automated profit.",
      paragraphs: [
        [
          { text: "Broker APIs", source: 1 },
          { text: " and " },
          { text: "paper-trading environments", source: 0 },
          { text: " already exist, so a safe validation version is technically achievable." },
        ],
        [
          { text: "First prove that one explicit rule can run reliably and that every decision is logged. " },
          { text: "A profit promise", source: 2 },
          { text: " is not the goal of this version." },
        ],
      ],
      sourcePrefix: "Source",
    },
    decisionNeeded: "Choose the next step",
    bridge: "So before we scope the first version, there is one thing to confirm.",
    question: "Do you already have a specific trading strategy or signal logic defined for this system, or do you need help finding and comparing candidate strategies?",
    why: "The next step requires either validating your existing logic in a simulation or researching viable strategy candidates, as building execution code is not feasible without knowing what rules it must follow.",
    existingChoice: "I already trade a moving-average rule by hand.",
    discoverChoice: "Not yet — help me compare candidates.",
    proposalEyebrow: "A bounded proposal—not an automatic decision",
    included: "Build now",
    excluded: "Keep out of the MVP",
    flow: "First user flow",
    assumptions: "Explicit assumptions",
    approve: "Approve this boundary",
    revise: "This is not right yet",
    revisionMessage:
      "Good catch. Nothing has been handed to a coding agent. In the real product, GoodIdea would ask one focused revision question here.",
    handoffEyebrow: "Human-approved output",
    handoffTitle: "The coding handoff is ready.",
    handoffIntro:
      "The handoff contains the approved goal, the build order, the acceptance criteria, and explicit non-goals.",
    evidence: "Evidence",
    approvedBy: "Approved by user · external side effects remain disabled",
    howEyebrow: "The agent loop",
    howTitle: "Enough structure to move forward. Not enough ceremony to stop.",
    howItems: [
      { number: "01", title: "Ground the idea", text: "Search only what the next product decision needs, and attach every claim to a source you can open." },
      { number: "02", title: "Reduce one uncertainty", text: "Explain why one question matters and pause for you. What you said about your own limits is remembered, so you never say it twice." },
      { number: "03", title: "Freeze the boundary", text: "Write down what this version will not do, and hand anything over only after you approve that exact proposal." },
    ],
    sandboxCta: "Run it first",
    sandboxLabel: "sandbox run",
    sandboxConstraints: ["no network", "read-only", "no side effects", "10s limit"],
    sandboxAsks: "This run answers",
    sandboxStages: ["Starting an isolated environment", "Loading the fixed sample", "Running", "Collecting output"],
    sandboxOutput: "Output",
    boundaryEyebrow: "Engineering boundaries",
    boundaryTitle: "The model does the language.\u200B The code keeps the authority.",
    boundaryIntro: "Each line below answers the same question: what happens when the model is wrong?",
    boundaryItems: [
      { term: "Who starts a search", text: "The model writes the queries; the workflow issues them. It cannot decide how many times to look, or when it has looked enough." },
      { term: "Who decides trust", text: "The URL does — not the page, and not the model. Pages that cannot carry attribution never become sources." },
      { term: "What the model may write", text: "What you said about yourself, never what the product asserts. A note carries no source, so it can never become cited evidence." },
      { term: "Who approves", text: "Writing a proposal approves nothing, and repeated agreement never accumulates into certainty." },
    ],
    boundaryNote: "A suite that replays real recorded model output checks these rules, with no key and no network.",
    boundaryLink: "Full capability map",
    boundaryDoc: "https://github.com/forge-context/goodidea-agent/blob/main/docs/design/agent-capabilities.md",
    principleTitle: "Designed for honest momentum",
    principles: [
      { title: "Evidence is not a decision", text: "Market facts, assumptions, and human choices stay separate in memory." },
      { title: "A vague yes means nothing", text: "GoodIdea repeats concrete options instead of silently selecting one." },
      { title: "Safety is part of the MVP", text: "High-impact integrations remain excluded until the product boundary justifies them." },
    ],
    footer: "Open implementation · English, Japanese, and Simplified Chinese",
    branches: {
      existing: {
        lead: "Paper Trading Moving Average Crossover Automator",
        summary: "A local script can implement the user's existing moving average crossover logic and execute simulated trades via a free paper trading API to verify mechanical correctness without financial risk.",
        included: [
          "Crossover signal calculation logic",
          "Paper trading API integration",
          "Simulated order execution",
          "Local trade activity logging",
        ],
        excluded: [
          "Real capital deployment",
          "Profitability guarantees",
          "Multi-asset portfolio management",
          "Live market data subscriptions",
        ],
        flow: [
          "Configure strategy parameters",
          "Start paper trading session",
          "Monitor signal generation",
          "Review executed trade log",
        ],
        assumptions: [
          "User has defined exact MA periods and crossover type",
          "Paper API provides sufficient rate limits for testing",
          "User accepts simulated execution differs from live fills",
        ],
        sandbox: {
          question: "Can this rule be replayed deterministically on a fixed sample?",
          code: "rows = load_csv(\"sample-2024.csv\")\nma5, ma20 = moving_average(rows, 5), moving_average(rows, 20)\nsignals = cross_up(ma5, ma20)\nprint(len(signals), \"signals\", checksum(signals))",
          output: "run 1  ->  17 signals  4f2ac1\nrun 2  ->  17 signals  4f2ac1",
          verdict: "Two runs over the same sample agree, so the rule can be replayed.",
          limit: "This says nothing about whether the rule makes money. It says the rule can be executed the same way twice.",
        },
        handoff: [
          { label: "Approved goal", text: "A runnable system that executes your specific crossover rules in a simulated environment exactly as coded, providing verifiable logs of automated behavior without guaranteeing profit." },
          { label: "Implementation order", text: "Implement MA crossover signal calculator with unit tests → Build paper API client with connection verification → Integrate signal generator with order execution module → Add local logging for signals and trade confirmations" },
          { label: "Acceptance", text: "Script connects to paper API without authentication errors" },
        ],
      },
      discover: {
        lead: "Offline Strategy Backtest Comparator",
        summary: "Build a local Python tool that ingests static CSV price data and runs multiple candidate trading rules to compare net returns, enabling strategy discovery without live market connections or capital risk.",
        included: [
          "CSV data loader",
          "Three baseline strategy templates",
          "Fee-aware backtest engine",
          "Comparative metrics dashboard",
        ],
        excluded: [
          "Live market data feeds",
          "Real order execution",
          "Broker account integration",
          "Machine learning optimization",
        ],
        flow: [
          "Import price CSV",
          "Select candidate rules",
          "Configure fee parameters",
          "Run backtest comparison",
        ],
        assumptions: [
          "User has historical price CSVs available",
          "Python environment is pre-configured locally",
          "Strategy logic can be expressed as code",
        ],
        sandbox: {
          question: "Do two candidate rules differ in a way the same sample reproduces?",
          code: "sample = load_csv(\"sample-2024.csv\")\nfor rule in (ma_crossover, mean_reversion):\n    result = replay(rule, sample, fees=0.001, slippage=0.0005)\n    print(rule.name, result.trades, result.max_drawdown)",
          output: "ma_crossover     12 trades   -8.4%\nmean_reversion    31 trades   -5.1%\nreplayed twice -> identical",
          verdict: "The two rules differ under one shared cost assumption, and the difference reproduces.",
          limit: "Neither rule is recommended. A reproducible difference is not evidence that either one works.",
        },
        handoff: [
          { label: "Approved goal", text: "This tool enables systematic comparison of trading rule candidates using historical data, but cannot guarantee any strategy will generate positive returns in live markets." },
          { label: "Implementation order", text: "CSV data ingestion module → Base backtest engine with fee logic → First baseline strategy implementation → Additional strategy templates" },
          { label: "Acceptance", text: "System accepts standard OHLCV CSV format without error" },
        ],
      },
    },
  },
  ja: {
    navDemo: "Demo",
    navHow: "仕組み",
    github: "GitHub",
    tryDemo: "固定 Demo を試す",
    viewGithub: "実装を見る",
    demoNote: "登録不要。固定データ。",
    githubNote: "Open Source。手元で動きます。",
    primaryNavigationLabel: "メインナビゲーション",
    languageLabel: "言語",
    stages: ["市場調査", "実現可能性", "Product 像", "MVP 境界", "引き渡し"],
    demoEyebrow: "Interactive Product Example",
    demoTitle: "GoodIdea が、必要な瞬間に止まる様子を体験できます。",
    demoIntro: "この例は固定データだけで Browser 内で動きます。実 Agent を呼ばずに Product Behavior を示します。",
    fixedDemo: "固定 Demo · 実 Agent なし",
    ideaLabel: "まだ粗いアイデア",
    idea: "株を自動で売買して、自分の代わりに利益を出す Product を作りたい。",
    analyze: "このアイデアを調べる",
    currentStage: "Milestone Path",
    complete: "完了",
    current: "現在",
    upcoming: "この先",
    researchAnswer: {
      lead: "実現可能です。ただし、最初の Version で自動収益を約束してはいけません。",
      paragraphs: [
        [
          { text: "Broker API", source: 1 },
          { text: " と " },
          { text: "Paper Trading 環境", source: 0 },
          { text: " は既に存在するため、安全な検証版は技術的に作れます。" },
        ],
        [
          { text: "まず、一つの明示的なルールを正しく実行し、判断 Log をすべて残せるかを確かめます。" },
          { text: "収益保証", source: 2 },
          { text: "はこの Version の目標ではありません。" },
        ],
      ],
      sourcePrefix: "出典",
    },
    decisionNeeded: "次の進め方を選ぶ",
    bridge: "そこで、最初の Version の範囲を決める前に、一つだけ確認させてください。",
    question: "自動化したい具体的な売買ルールや戦略は既に手元にありますか、それとも候補となる戦略の探索と比較から始める必要がありますか？",
    why: "既存ルールの検証と新規戦略の探索では、ペーパートレーディング環境での最初の作業内容が全く異なるためです。",
    existingChoice: "移動平均のルールを手動で売買しています。",
    discoverChoice: "まだありません。候補の比較を手伝ってください。",
    proposalEyebrow: "自動決定ではなく、確認できる提案",
    included: "いま作るもの",
    excluded: "MVP に入れないもの",
    flow: "最初の User Flow",
    assumptions: "明示した前提",
    approve: "この境界を承認する",
    revise: "まだ違う",
    revisionMessage: "大切な指摘です。Coding Agent にはまだ何も渡していません。実 Product では、ここで修正点を一つだけ質問します。",
    handoffEyebrow: "人が承認した Output",
    handoffTitle: "Coding Agent への引き渡しができました。",
    handoffIntro: "承認済み Goal、実装順序、Acceptance Criteria、明示的な Non-goal が含まれます。",
    evidence: "根拠",
    approvedBy: "利用者が承認 · 外部への副作用は無効のまま",
    howEyebrow: "Agent Loop",
    howTitle: "前進に必要な構造だけ。動けなくなるほどの形式は持ち込まない。",
    howItems: [
      { number: "01", title: "アイデアを根拠へつなぐ", text: "次の Product 判断に必要な範囲だけを調べ、主張には開ける出典を必ず付けます。" },
      { number: "02", title: "不確実性を一つ減らす", text: "質問の理由を説明し、あなたの答えを待ちます。ご自身の制約として話したことは記憶され、二度言う必要はありません。" },
      { number: "03", title: "境界を固定する", text: "この版でやらないことを書き出し、その提案をあなたが承認した後だけ引き渡します。" },
    ],
    sandboxCta: "先に動かす",
    sandboxLabel: "Sandbox 実行",
    sandboxConstraints: ["Network なし", "読み取り専用", "副作用なし", "10 秒で打ち切り"],
    sandboxAsks: "この実行が答えること",
    sandboxStages: ["隔離環境を起動", "固定 Sample を読み込み", "実行中", "出力を回収"],
    sandboxOutput: "出力",
    boundaryEyebrow: "エンジニアリングの境界",
    boundaryTitle: "言語は Model が、\u200B権限は Code が持つ。",
    boundaryIntro: "以下はすべて「Model が間違えたとき何が起きるか」への答えです。",
    boundaryItems: [
      { term: "検索を始めるのは誰か", text: "Query は Model が書き、発行は Workflow が行います。何回調べるか、もう十分かを Model は決められません。" },
      { term: "信頼度を決めるのは何か", text: "URL です。Page 自身でも Model でもありません。帰属を持てない Page は Source になりません。" },
      { term: "Model が書けるもの", text: "あなたが自分について語ったことだけです。Product が主張する事実は書けません。Note に Source は無く、引用された根拠にはなりません。" },
      { term: "承認するのは誰か", text: "提案の生成は承認ではなく、同意の反復が確実性に変わることもありません。" },
    ],
    boundaryNote: "これらの規則は、記録した実際の Model 出力を再生する Evaluation が、Key も Network も無しで検査し続けます。",
    boundaryLink: "能力マップ全体",
    boundaryDoc: "https://github.com/forge-context/goodidea-agent/blob/main/docs/design/agent-capabilities.ja.md",
    principleTitle: "正直な前進のための設計",
    principles: [
      { title: "根拠は判断ではない", text: "市場の事実、前提、人の選択を Memory で分けます。" },
      { title: "曖昧な『はい』は選択ではない", text: "勝手に決めず、具体的な二択をもう一度示します。" },
      { title: "安全も MVP の一部", text: "影響の大きい接続は、境界が必要性を示すまで除外します。" },
    ],
    footer: "公開実装 · English / 日本語 / 简体中文",
    branches: {
      existing: {
        lead: "ゴールデンクロス戦略のローカル・ペーパー検証ツール",
        summary: "実資金やAPIキーを一切使わず、過去の株価データ（CSV）を用いてゴールデンクロス戦略のシミュレーション結果を可視化するMVPです。利益を保証するものではありませんが、手動ルールが過去にどう機能したかを再現可能な形で確認できます。",
        included: [
          "ローカルCSVファイルからの株価データ読み込み",
          "移動平均線算出とゴールデンクロス判定ロジック",
          "仮想売買による損益計算とチャート表示",
          "パラメータ（期間など）の変更機能",
        ],
        excluded: [
          "証券会社APIとの連携や自動発注",
          "リアルタイム相場データの取得",
          "利益の保証や将来予測",
          "複数銘柄の同時分析やポートフォリオ管理",
        ],
        flow: [
          "CSVデータ選択",
          "パラメータ設定",
          "シミュレーション実行",
          "結果チャート確認",
        ],
        assumptions: [
          "ユーザーは検証用の株価CSVデータを自力で用意できる",
          "ゴールデンクロスの定義（短期線が長期線を上抜け）は共通認識である",
          "バックテスト結果が将来の利益を示唆するものではないと理解している",
        ],
        sandbox: {
          question: "このルールは固定 Sample 上で決定的に再生できますか。",
          code: "rows = load_csv(\"sample-2024.csv\")\nma5, ma20 = moving_average(rows, 5), moving_average(rows, 20)\nsignals = cross_up(ma5, ma20)\nprint(len(signals), \"signals\", checksum(signals))",
          output: "run 1  ->  17 signals  4f2ac1\nrun 2  ->  17 signals  4f2ac1",
          verdict: "同じ Sample で二回とも一致したので、このルールは再生できます。",
          limit: "これは儲かるかどうかを何も語りません。同じ実行を二度できる、とだけ言っています。",
        },
        handoff: [
          { label: "承認済み Goal", text: "実資金を使わずに、特定の期間におけるゴールデンクロス戦略の損益推移を再現し、ルールの特性を理解するための材料を提供します" },
          { label: "実装順序", text: "CSVパーサーとデータ正規化モジュールの実装 → 移動平均計算とクロス判定エンジンの構築 → 仮想売買ロジックと損益集計機能の開発 → Chart.js等を用いた結果可視化UIの作成" },
          { label: "Acceptance", text: "指定したCSVファイルから日付・終値を読み込みエラーなく処理できる" },
        ],
      },
      discover: {
        lead: "ローカル株戦略比較シミュレータ",
        summary: "外部APIや実資金への接続を行わず、ブラウザ上の擬似データと簡易計算ロジックのみを用いて複数の売買ルールを並列検証する環境を構築します。これにより、コストゼロかつリスクゼロで「どのルールが過去のパターンに対して優位性を持つか」の比較検討が可能です。",
        included: [
          "擬似株価データの生成",
          "複数ルールの同時実行",
          "成績比較ダッシュボード",
          "パラメータ調整機能",
        ],
        excluded: [
          "実証券口座との連携",
          "リアルタイム市場データの取得",
          "実際の注文執行機能",
          "利益の保証や予測",
        ],
        flow: [
          "ルール選択",
          "パラメータ設定",
          "シミュレーション実行",
          "結果比較",
        ],
        assumptions: [
          "ユーザーはプログラミング基礎知識またはUI操作能力を持つ",
          "擬似データでもルールの相対比較には有効である",
          "ブラウザの計算リソースでシミュレーションが完結する",
        ],
        sandbox: {
          question: "二つの候補ルールの差は、同じ Sample で再現しますか。",
          code: "sample = load_csv(\"sample-2024.csv\")\nfor rule in (ma_crossover, mean_reversion):\n    result = replay(rule, sample, fees=0.001, slippage=0.0005)\n    print(rule.name, result.trades, result.max_drawdown)",
          output: "ma_crossover     12 trades   -8.4%\nmean_reversion    31 trades   -5.1%\nreplayed twice -> identical",
          verdict: "共通の Cost 前提の下で二つは異なり、その差は再現します。",
          limit: "どちらも推奨しません。差が再現することは、どちらかが有効である根拠にはなりません。",
        },
        handoff: [
          { label: "承認済み Goal", text: "実資金やアカウント登録なしに、複数の売買候補ルールの成績差を可視化し、検討の足掛かりを得られる状態を提供します。ただし、この結果は将来の利益を保証するものではありません。" },
          { label: "実装順序", text: "擬似データ生成エンジンの実装 → 単一ルールの計算ロジック実装 → 結果可視化コンポーネントの実装 → 複数ルールの管理・比較UI実装" },
          { label: "Acceptance", text: "3つ以上の異なる売買ロジックを選択・実行できる" },
        ],
      },
    },
  },
  "zh-CN": {
    navDemo: "体验 Demo",
    navHow: "工作方式",
    github: "GitHub",
    tryDemo: "体验固定 Demo",
    viewGithub: "查看产品实现",
    demoNote: "不需要注册，固定数据。",
    githubNote: "开源，可以在本地运行。",
    primaryNavigationLabel: "主导航",
    languageLabel: "语言",
    stages: ["市场调研", "可行性", "产品形态", "MVP 边界", "交接"],
    demoEyebrow: "可交互的产品示例",
    demoTitle: "看看 GoodIdea \u200B如何在正确的地方\u200B停下来。",
    demoIntro: "这个示例完全使用固定数据在浏览器中运行。它展示产品效果，但不会调用真实 Agent。",
    fixedDemo: "固定 Demo · 不调用真实 Agent",
    ideaLabel: "你现在还很模糊的想法",
    idea: "帮我做一个能自动炒股、替我赚钱的产品。",
    analyze: "调研这个想法",
    currentStage: "阶段进度",
    complete: "已完成",
    current: "当前",
    upcoming: "之后",
    researchAnswer: {
      lead: "可以做，但第一版不应该承诺“自动赚钱”。",
      paragraphs: [
        [
          { text: "技术上，" },
          { text: "券商 API", source: 1 },
          { text: "和" },
          { text: "模拟交易环境", source: 0 },
          { text: "已经具备，做出安全的验证版是可行的。" },
        ],
        [
          { text: "真正要先验证的是：它能否可靠执行一条明确规则，并记录每次判断。" },
          { text: "收益承诺", source: 2 },
          { text: "不是这一版的目标。" },
        ],
      ],
      sourcePrefix: "来源",
    },
    decisionNeeded: "选择下一步",
    bridge: "所以在划定第一版范围之前，只需要你确认一件事。",
    question: "您目前是否已经有一套明确定义的交易规则或策略希望该产品去执行？",
    why: "如果您已有策略，下一步可直接进入模拟验证阶段；如果您还没有，则必须先协助您筛选和对比候选策略框架，否则无法开展任何有效的测试工作。",
    existingChoice: "我有一条均线金叉的规则，一直手动在做。",
    discoverChoice: "还没有，帮我比较几个候选方案。",
    proposalEyebrow: "这是一份可确认的提案，不是系统替你做的决定",
    included: "这一版要做",
    excluded: "MVP 明确不做",
    flow: "第一条用户流程",
    assumptions: "明确写出的前提",
    approve: "批准这个 MVP 边界",
    revise: "这还不是我想要的",
    revisionMessage: "很好，你发现了偏差。现在还没有向 Coding Agent 交接任何内容；真实产品会在这里继续问一个聚焦的修正问题。",
    handoffEyebrow: "经过用户批准的输出",
    handoffTitle: "Coding Agent 交接包已经准备好了。",
    handoffIntro: "其中包含已批准的目标、实现顺序、验收条件和明确不做的内容。",
    evidence: "证据来源",
    approvedBy: "由用户批准 · 外部副作用仍然关闭",
    howEyebrow: "Agent 工作闭环",
    howTitle: "提供足够前进的结构，\u200B但不制造\u200B阻止行动的形式。",
    howItems: [
      { number: "01", title: "用证据落地想法", text: "只调查下一个产品决定真正需要的内容，每条结论都挂着能点开的出处。" },
      { number: "02", title: "一次减少一个未知", text: "解释一个问题为什么重要，然后停下来等你决定。你说过的条件会被记住，不用说第二遍。" },
      { number: "03", title: "固定 MVP 边界", text: "先写清这一版不做什么，等你批准眼前这份提案，才交出去。" },
    ],
    sandboxCta: "先跑一段验证",
    sandboxLabel: "沙箱运行",
    sandboxConstraints: ["断网", "只读", "无外部副作用", "10 秒超时"],
    sandboxAsks: "这次运行要回答的",
    sandboxStages: ["启动隔离环境", "载入固定样本", "执行中", "收集输出"],
    sandboxOutput: "输出",
    boundaryEyebrow: "工程边界",
    boundaryTitle: "模型负责语言，\u200B代码保留权限。",
    boundaryIntro: "下面每一条都在回答同一个问题：模型出错时会发生什么。",
    boundaryItems: [
      { term: "检索由谁发起", text: "模型写检索式，workflow 负责发出。模型没有决定查几次、什么时候算查够的权力。" },
      { term: "可信度由谁判定", text: "由 URL 判定，不由页面判定，也不由模型判定。无法承担署名的页面不会成为来源。" },
      { term: "模型能写什么", text: "可以记录你说过的话，不能写产品对外断言的事实。笔记没有来源，永远不会变成被引用的证据。" },
      { term: "谁来批准", text: "生成提案不构成批准，反复的同意也不会累积成确定性。" },
    ],
    boundaryNote: "这些规则由一套回放真实模型输出的评估套件持续检查，无需 key 也无需网络。",
    boundaryLink: "完整能力地图",
    boundaryDoc: "https://github.com/forge-context/goodidea-agent/blob/main/docs/design/agent-capabilities.zh.md",
    principleTitle: "为诚实而主动的\u200B前进设计",
    principles: [
      { title: "证据不等于决定", text: "市场事实、系统假设和用户选择会分别保存在 Memory 中。" },
      { title: "模糊的“好”不代表选择", text: "GoodIdea 不会擅自决定，只会重新给出两个明确选项。" },
      { title: "安全边界也是 MVP", text: "影响较大的外部连接会保持排除，直到产品边界证明它确实必要。" },
    ],
    footer: "公开产品实现 · English / 日本語 / 简体中文",
    branches: {
      existing: {
        lead: "均线金叉策略本地回测验证器",
        summary: "利用开源金融数据与本地Python环境，构建一个零成本、无实盘连接的离线回测工具。该工具仅验证用户既定均线金叉规则在历史数据中扣除模拟费用后的数学期望，不涉及任何真实资金操作或外部API密钥申请，完全符合零投入与安全验证的边界。",
        included: [
          "本地CSV历史行情数据加载",
          "均线金叉买卖信号生成逻辑",
          "模拟手续费与滑点扣除计算",
          "策略净值曲线可视化图表",
        ],
        excluded: [
          "实盘账户连接与下单",
          "实时行情数据订阅",
          "第三方云服务部署",
          "策略参数自动优化",
        ],
        flow: [
          "导入历史数据文件",
          "配置均线周期参数",
          "设定模拟费率滑点",
          "执行本地回测运算",
        ],
        assumptions: [
          "用户能提供或获取合规的历史K线CSV文件",
          "本地计算机已安装Python运行环境",
          "均线金叉规则可被转化为确定性代码逻辑",
        ],
        sandbox: {
          question: "这条规则能否在固定样本上被确定地重放？",
          code: "rows = load_csv(\"sample-2024.csv\")\nma5, ma20 = moving_average(rows, 5), moving_average(rows, 20)\nsignals = cross_up(ma5, ma20)\nprint(len(signals), \"signals\", checksum(signals))",
          output: "run 1  ->  17 signals  4f2ac1\nrun 2  ->  17 signals  4f2ac1",
          verdict: "同一份样本跑两次结果一致，这条规则可以被确定地重放。",
          limit: "这不能说明规则能不能赚钱，只能说明它可以被同样地执行两次。",
        },
        handoff: [
          { label: "已批准目标", text: "提供一份基于历史数据的策略净值曲线与交易统计报告，作为评估该规则是否值得进入模拟盘测试的客观依据，但不承诺未来实盘盈利。" },
          { label: "实现顺序", text: "实现本地CSV数据解析与标准化模块 → 编写均线金叉信号生成核心算法 → 集成费用滑点扣除与净值计算引擎 → 开发统计指标汇总与图表渲染功能" },
          { label: "验收条件", text: "程序能在无网络环境下读取本地CSV并成功运行" },
        ],
      },
      discover: {
        lead: "零成本本地策略回测与模拟执行验证器",
        summary: "利用开源历史行情数据与本地Python环境，构建一个无需实盘账户、无需API密钥即可运行的策略逻辑验证工具。该工具仅验证“代码能否按规则执行”及“历史数据下的理论盈亏”，完全规避资金风险与第三方服务依赖，作为筛选候选方案的纯技术基准。",
        included: [
          "本地CSV历史行情数据加载模块",
          "基于固定规则的策略逻辑引擎",
          "包含手续费与滑点的模拟撮合器",
          "本地生成的交易执行日志与净值曲线",
        ],
        excluded: [
          "连接任何真实券商或交易所API",
          "实时行情订阅与实盘下单功能",
          "云端部署或服务器托管服务",
          "机器学习模型训练与预测算法",
        ],
        flow: [
          "导入本地历史数据文件",
          "配置策略规则与费率参数",
          "运行本地回测脚本",
          "查看执行日志与统计报表",
        ],
        assumptions: [
          "用户具备基础Python运行环境与命令行操作能力",
          "用户可自行获取或下载免费的历史行情CSV数据",
          "历史数据格式符合工具预设的标准化字段要求",
        ],
        sandbox: {
          question: "两条候选规则的差异，在同一样本上能否复现？",
          code: "sample = load_csv(\"sample-2024.csv\")\nfor rule in (ma_crossover, mean_reversion):\n    result = replay(rule, sample, fees=0.001, slippage=0.0005)\n    print(rule.name, result.trades, result.max_drawdown)",
          output: "ma_crossover     12 trades   -8.4%\nmean_reversion    31 trades   -5.1%\nreplayed twice -> identical",
          verdict: "在同一套成本假设下两者不同，而且这个差异可以复现。",
          limit: "两条规则都不构成推荐。差异可复现，不等于其中任何一条是有效的。",
        },
        handoff: [
          { label: "已批准目标", text: "提供一个可重复执行的本地测试环境，让您在不投入任何真金白银的前提下，量化观察特定交易规则在历史数据中的理论表现与执行逻辑正确性。" },
          { label: "实现顺序", text: "实现CSV数据加载与标准化解析器 → 构建带费率计算的模拟撮合引擎 → 开发单策略回测主循环与日志记录器 → 添加净值计算与基础统计指标输出" },
          { label: "验收条件", text: "程序可在无网络环境下仅凭本地CSV文件完成全流程回测" },
        ],
      },
    },
  },
};

const handoffFileName = "goodidea-handoff.md";

const sourceLinks = [
  { label: "Alpaca Paper Trading", url: "https://docs.alpaca.markets/us/docs/paper-trading" },
  { label: "IBKR TWS API", url: "https://interactivebrokers.github.io/tws-api/introduction.html" },
  { label: "Investor.gov", url: "https://www.investor.gov/protect-your-investments/fraud/protect-your-money" },
] as const;

function App() {
  const documentLocale = document.documentElement.dataset.locale;
  const locale: Locale =
    documentLocale === "ja" || documentLocale === "zh-CN" ? documentLocale : "en";
  const t = copies[locale];
  const [phase, setPhase] = useState<Phase>("idle");
  const [choice, setChoice] = useState<PathChoice>("existing");
  const [revisionRequested, setRevisionRequested] = useState(false);
  const [sandboxStage, setSandboxStage] = useState(-1);
  const sandboxStarted = sandboxStage >= 0;
  const sandboxDone = sandboxStage >= t.sandboxStages.length;

  // A run that finishes the instant it is asked for reads as a picture of a run. The
  // phases below are the ones a real isolated run goes through, shown at a length
  // that matches how long they actually take.
  useEffect(() => {
    if (!sandboxStarted || sandboxDone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSandboxStage(t.sandboxStages.length);
      return;
    }
    const timer = window.setTimeout(
      () => setSandboxStage((stage) => stage + 1),
      sandboxStage === 0 ? 620 : 460,
    );
    return () => window.clearTimeout(timer);
  }, [sandboxStarted, sandboxDone, sandboxStage, t.sandboxStages.length]);
  const phaseRank = { idle: 0, research: 1, proposal: 3, handoff: 4 }[phase];
  const branch = t.branches[choice];

  const selectPath = (nextChoice: PathChoice) => {
    setChoice(nextChoice);
    setRevisionRequested(false);
    setSandboxStage(-1);
    setPhase("proposal");
  };

  return (
    <>
      <a className="skip-link" href="#main">
        {locale === "ja" ? "本文へ移動" : locale === "zh-CN" ? "跳到正文" : "Skip to content"}
      </a>
      <header className="site-header">
        <a className="brand" href={locale === "en" ? "/en/" : locale === "ja" ? "/ja/" : "/zh-cn/"}>
          <BrandMark />
          <span>GoodIdea</span>
        </a>
        <nav aria-label={t.primaryNavigationLabel}>
          <a href="#demo">{t.navDemo}</a>
          <a href="#how">{t.navHow}</a>
          <a href="https://github.com/forge-context/goodidea-agent">{t.github}</a>
        </nav>
        <div className="locale-switch" aria-label={t.languageLabel}>
          <a className={locale === "en" ? "active" : ""} href="/en/" hrefLang="en" lang="en">EN</a>
          <a className={locale === "ja" ? "active" : ""} href="/ja/" hrefLang="ja" lang="ja">JA</a>
          <a className={locale === "zh-CN" ? "active" : ""} href="/zh-cn/" hrefLang="zh-CN" lang="zh-CN">中文</a>
        </div>
      </header>

      <main id="main">
        <IdeaMapHero
          actions={
            <div className="hero-actions">
              <div>
                <a className="button button-primary" href="#demo">{t.tryDemo}<ArrowDownIcon /></a>
                <small>{t.demoNote}</small>
              </div>
              <div>
                <a className="button button-quiet" href="https://github.com/forge-context/goodidea-agent">{t.viewGithub}<ArrowUpRightIcon /></a>
                <small>{t.githubNote}</small>
              </div>
            </div>
          }
          locale={locale}
        />

        <section className="demo-section" id="demo">
          <div className="section-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.demoEyebrow}</p>
                <h2>{t.demoTitle}</h2>
              </div>
              <p>{t.demoIntro}</p>
            </div>

            <div className="demo-window" data-phase={phase}>
              <div className="demo-toolbar">
                <span className="demo-brand"><BrandMark small />GoodIdea</span>
                <span className="demo-mode"><span aria-hidden="true">●</span>{t.fixedDemo}</span>
              </div>

              <div className="demo-grid">
                <aside className="progress-panel">
                  <p className="panel-label">{t.currentStage}</p>
                  <ol>
                    {t.stages.map((stage, index) => {
                      const completed = index < phaseRank;
                      const current = index === phaseRank && phase !== "idle";
                      return (
                        <li className={completed ? "done" : current ? "now" : ""} key={stage}>
                          <span>{completed ? "✓" : index + 1}</span>
                          <div><strong>{stage}</strong><small>{completed ? t.complete : current ? t.current : t.upcoming}</small></div>
                        </li>
                      );
                    })}
                  </ol>
                </aside>

                <div className="demo-content" aria-live="polite">
                  <div className="idea-field">
                    <p className="idea-label">{t.ideaLabel}</p>
                    <p className="idea-sentence">{t.idea}</p>
                  </div>

                  {phase === "idle" && (
                    <button className="button button-primary full" onClick={() => setPhase("research")}>
                      {t.analyze}<span aria-hidden="true">→</span>
                    </button>
                  )}

                  {phase !== "idle" && (
                    <div className="result-stack" key={phase}>
                      <ResearchAnswer
                        answer={t.researchAnswer}
                        decision={phase === "research" ? {
                          label: t.decisionNeeded,
                          bridge: t.bridge,
                          question: t.question,
                          why: t.why,
                          existingChoice: t.existingChoice,
                          discoverChoice: t.discoverChoice,
                        } : undefined}
                        onSelect={selectPath}
                      />

                      {(phase === "proposal" || phase === "handoff") && (
                        <p className="user-reply">{choice === "existing" ? t.existingChoice : t.discoverChoice}</p>
                      )}

                      {(phase === "proposal" || phase === "handoff") && (
                        <article className="chat-turn">
                          <span className="agent-answer-avatar" aria-hidden="true">G</span>
                          <div className="chat-bubble">
                            <p className="chat-author">GoodIdea</p>
                            <p className="agent-answer-lead">{branch.lead}</p>
                            <p>{branch.summary}</p>
                            <div className="boundary-grid">
                              <BoundaryList title={t.included} values={branch.included} positive />
                              <BoundaryList title={t.excluded} values={branch.excluded} />
                            </div>
                            <p className="chat-meta-line"><strong>{t.flow}</strong>{branch.flow.join(" → ")}</p>
                            <p className="chat-meta-line"><strong>{t.assumptions}</strong>{branch.assumptions.join(" · ")}</p>
                            {phase === "proposal" && (
                              <>
                                {sandboxStarted && (
                                  <SandboxPanel
                                    run={branch.sandbox}
                                    label={t.sandboxLabel}
                                    constraints={t.sandboxConstraints}
                                    asks={t.sandboxAsks}
                                    outputLabel={t.sandboxOutput}
                                    stages={t.sandboxStages}
                                    stage={sandboxStage}
                                  />
                                )}
                                {revisionRequested && <p className="revision-note">↩ {t.revisionMessage}</p>}
                                <p className="decision-why">{t.proposalEyebrow}</p>
                                <div className="chat-choices" role="group" aria-label={t.proposalEyebrow}>
                                  <button className="primary" onClick={() => setPhase("handoff")}>{t.approve}<span aria-hidden="true">→</span></button>
                                  {!sandboxStarted && <button onClick={() => setSandboxStage(0)}>{t.sandboxCta}</button>}
                                  <button onClick={() => setRevisionRequested(true)}>{t.revise}</button>
                                </div>
                              </>
                            )}
                          </div>
                        </article>
                      )}

                      {phase === "handoff" && (
                        <div className="handoff-card">
                          <p className="mini-eyebrow">{t.handoffEyebrow}</p>
                          <h3>{t.handoffTitle}</h3>
                          <p>{t.handoffIntro}</p>
                          <div className="handoff-doc">
                            <p className="handoff-doc-bar"><span aria-hidden="true">●</span>{handoffFileName}</p>
                            <div className="handoff-doc-body">
                              <HandoffSection title={branch.handoff[0].label}><p>{branch.handoff[0].text}</p></HandoffSection>
                              <HandoffSection title={t.included}>
                                <ul>{branch.included.map((item) => <li key={item}>{item}</li>)}</ul>
                              </HandoffSection>
                              <HandoffSection title={t.excluded}>
                                <ul>{branch.excluded.map((item) => <li key={item}>{item}</li>)}</ul>
                              </HandoffSection>
                              <HandoffSection title={t.flow}>
                                <ol>{branch.flow.map((item) => <li key={item}>{item}</li>)}</ol>
                              </HandoffSection>
                              <HandoffSection title={branch.handoff[1].label}><p>{branch.handoff[1].text}</p></HandoffSection>
                              <HandoffSection title={branch.handoff[2].label}><p>{branch.handoff[2].text}</p></HandoffSection>
                              <HandoffSection title={t.assumptions}>
                                <ul>{branch.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
                              </HandoffSection>
                              <HandoffSection title={t.evidence}>
                                <ul>{sourceLinks.map((source) => (
                                  <li key={source.url}>{source.label} — <a href={source.url} rel="noreferrer" target="_blank">{source.url}</a></li>
                                ))}</ul>
                              </HandoffSection>
                            </div>
                          </div>
                          <div className="approval-stamp">✓ {t.approvedBy}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="how-section section-shell" id="how">
          <div className="section-heading compact">
            <div><p className="eyebrow">{t.howEyebrow}</p><h2>{t.howTitle}</h2></div>
          </div>
          <div className="how-grid">
            {t.howItems.map((item) => (
              <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>
            ))}
          </div>
          <div className="principles-panel">
            <h2>{t.principleTitle}</h2>
            <div>
              {t.principles.map((item) => <article key={item.title}><span aria-hidden="true">◆</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="boundary-section section-shell" id="boundaries">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">{t.boundaryEyebrow}</p>
              <h2>{t.boundaryTitle}</h2>
              <p className="boundary-intro">{t.boundaryIntro}</p>
            </div>
          </div>
          <dl className="boundary-list-grid">
            {t.boundaryItems.map((item) => (
              <div key={item.term}>
                <dt>{item.term}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
          <p className="boundary-note">{t.boundaryNote}</p>
          <a className="button button-quiet" href={t.boundaryDoc}>{t.boundaryLink}<ArrowUpRightIcon /></a>
        </section>
      </main>

      <footer>
        <a className="brand" href="#top"><BrandMark /><span>GoodIdea</span></a>
        <p>{t.footer}</p>
        <a href="https://github.com/forge-context/goodidea-agent">github.com/forge-context/goodidea-agent ↗</a>
      </footer>
    </>
  );
}

function SandboxPanel({
  run,
  label,
  constraints,
  asks,
  outputLabel,
  stages,
  stage,
}: {
  run: SandboxRun;
  label: string;
  constraints: string[];
  asks: string;
  outputLabel: string;
  stages: string[];
  stage: number;
}) {
  const done = stage >= stages.length;
  return (
    <section className="sandbox-panel" aria-busy={!done}>
      <p className="sandbox-bar">
        <span className="sandbox-name">
          <span aria-hidden="true">{done ? "▶" : "◐"}</span>{label}
        </span>
        <span className="sandbox-constraints">
          {constraints.map((item) => <span key={item}>{item}</span>)}
        </span>
      </p>
      <div className="sandbox-body">
        <p className="sandbox-asks"><strong>{asks}</strong>{run.question}</p>
        {/* The phases stay on screen after the run: what it did is part of the result. */}
        <ol className="sandbox-stages" aria-live="polite">
          {stages.map((item, index) => (
            <li className={index < stage ? "done" : index === stage ? "now" : ""} key={item}>
              <span aria-hidden="true">{index < stage ? "✓" : index === stage ? "◐" : "·"}</span>
              {item}
            </li>
          ))}
        </ol>
        {done && (
          <>
            <pre className="sandbox-code">{run.code}</pre>
            <p className="sandbox-asks"><strong>{outputLabel}</strong></p>
            <pre className="sandbox-output">{run.output}</pre>
            <p className="sandbox-verdict"><span aria-hidden="true">✓</span>{run.verdict}</p>
            <p className="sandbox-limit">{run.limit}</p>
          </>
        )}
      </div>
    </section>
  );
}

function HandoffSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="handoff-section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function BoundaryList({ title, values, positive = false }: { title: string; values: string[]; positive?: boolean }) {
  return (
    <div className={positive ? "boundary-list positive" : "boundary-list"}>
      <h4>{title}</h4>
      <ul>{values.map((value) => <li key={value}><span>{positive ? "+" : "−"}</span>{value}</li>)}</ul>
    </div>
  );
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark small" : "brand-mark"} aria-hidden="true">
      <svg viewBox="0 0 36 36">
        <path className="brand-loop" d="M26.4 10.8A10.5 10.5 0 1 0 27.7 24" />
        <path className="brand-turn" d="M18.8 18.2h8.7v7.5" />
        <circle className="brand-spark" cx="28.3" cy="7.6" r="2.5" />
      </svg>
    </span>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3.5v12.2m0 0-4-4m4 4 4-4" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg className="action-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.2 14.8 14.8 5.2M7.2 5.2h7.6v7.6" />
    </svg>
  );
}

type DecisionPrompt = {
  label: string;
  bridge: string;
  question: string;
  why: string;
  existingChoice: string;
  discoverChoice: string;
};

function ResearchAnswer({
  answer,
  decision,
  onSelect,
}: {
  answer: ResearchAnswerCopy;
  decision?: DecisionPrompt;
  onSelect: (choice: PathChoice) => void;
}) {
  return (
    <article className="chat-turn">
      <span className="agent-answer-avatar" aria-hidden="true">G</span>
      <div className="chat-bubble">
        <p className="chat-author">GoodIdea</p>
        <p className="agent-answer-lead">{answer.lead}</p>
        {answer.paragraphs.map((tokens, paragraphIndex) => (
          <p key={paragraphIndex}>
            {tokens.map((token, tokenIndex) => {
              if (token.source === undefined) return token.text;
              const source = sourceLinks[token.source];
              const sourceDescription = `${answer.sourcePrefix}: ${source.label}`;
              return (
                <a
                  aria-label={`${token.text}。${sourceDescription}`}
                  className="evidence-link"
                  data-source={sourceDescription}
                  href={source.url}
                  key={`${paragraphIndex}-${tokenIndex}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {token.text}<span aria-hidden="true">↗</span>
                </a>
              );
            })}
          </p>
        ))}

        {decision && (
          <div className="chat-decision">
            <p className="chat-bridge">{decision.bridge}</p>
            <h3>{decision.question}</h3>
            <p className="decision-why">{decision.why}</p>
            <div className="chat-choices" role="group" aria-label={decision.label}>
              <button onClick={() => onSelect("existing")}>{decision.existingChoice}<span aria-hidden="true">→</span></button>
              <button onClick={() => onSelect("discover")}>{decision.discoverChoice}<span aria-hidden="true">→</span></button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default App;
