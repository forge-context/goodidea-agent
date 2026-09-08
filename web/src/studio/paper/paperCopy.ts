/* Every word the film says, in the three languages the site ships.
 *
 * Nothing in the stage components is written in one language and translated later:
 * the components take indexes and this file supplies the sentences, so a locale is a
 * whole reading of the same script rather than a string swap. The agent names are the
 * same in all three (Mira, Luca, Kai); the role always comes first, because what the
 * viewer needs is the kind of work, not the character.
 *
 * The film is a concept demo. It shows agents proposing, GoodIdea combining, and the
 * creator deciding — it never claims a real interview happened, a real source was
 * searched, or a real finding was verified. The wording keeps that honest: sheets say
 * "assumption to test", "exploration, not adopted", "suggestion, needs your call".
 */

export type PaperLocale = "en" | "ja" | "zh-CN";

export type AgentCopy = {
  /** What kind of work it does. Leads, because the role is the useful part. */
  role: string;
  /** A name, so a contribution can be pointed at later. */
  name: string;
  /** The role again, short enough to sit under a sheet that has shrunk to the edge. */
  tagRole: string;
  /** One letter for the small marker on a parked sheet. */
  initial: string;
  title: string;
  tag: string;
  /** What it is doing right now, before it has handed anything in. */
  work: [string, string];
  /** Line two of the rail: what it has handed in. Grows at most once. */
  notes: string[];
};

export type PaperCopyShape = {
  ui: {
    label: string; play: string; pause: string; replay: string; poster: string;
    progress: string; nextScene: string; prevScene: string; reduced: string;
    transcript: string; concept: string; stageAlt: string; loop: string; time: string;
  };
  chapters: string[];
  /** One line per chapter, so the transcript and reduced motion both read as prose. */
  chapterNotes: string[];
  opening: {
    corner: string; cornerNote: string; quoteChip: string; quoteTitle: string;
    quotePrice: string; questions: [string, string, string]; thought: string;
  };
  creator: { label: string; thoughts: string[] };
  workspace: {
    project: string; breadcrumb: string; stages: [string, string, string, string];
    statuses: string[]; evidence: string;
  };
  product: {
    stageLabel: string; canvasLabel: string; title: string; original: [string, string];
    /** What the sentence under it is: the direction the draft currently states. */
    currentLabel: string;
    versionNote: [string, string];
    proposalKicker: string; proposalKickerDone: string; proposal: string;
    proposalDetail: string; deferred: string;
    button: string; buttonDone: string; revised: [string, string]; revisedMark: string;
  };
  sketch: {
    explore: { alt: string; rows: [string, string][]; check: string; dash: string };
    accepted: { alt: string; caption: string; rows: [string, string][]; foot: string };
  };
  outlook: {
    chip: string; rows: [string, string][]; totalKey: string; totalValue: string;
    button: string; buttonDone: string; confirm: string; caption: [string, string];
  };
  brand: { mark: string; lines: [string, string] };
  agents: Record<"research" | "experience" | "engineering", AgentCopy>;
  work: {
    researchLines: [string, string];
    uxQuestion: string; uxOption: string;
    engineeringLines: [string, string, string, string];
    /** Engineering quoting the UX line it is answering. */
    engineeringQuote: string; engineeringFootnote: string;
  };
  rail: { title: string; summary: string[]; waiting: string; handedIn: string };
  fusion: {
    kicker: string; chips: [string, string, string];
    sharedLabel: string; shared: string;
    tradeLabel: string; trade: string;
    resultLabel: string; result: string;
  };
};

export const paperCopy: Record<PaperLocale, PaperCopyShape> = {
  "zh-CN": {
    ui: {
      label: "一个想法在 GoodIdea 里被推敲的过程",
      play: "播放", pause: "暂停", replay: "重播", poster: "播放这段动画",
      progress: "播放进度", nextScene: "下一段", prevScene: "上一段",
      reduced: "已按「减少动态效果」呈现：用上一段 / 下一段逐段阅读。",
      transcript: "文字版：这段动画讲了什么",
      concept: "概念动画 · 固定示例。不调用真实模型，也不连接后端。",
      stageAlt: "纸面定格动画：设计师的报价困扰，AI 团队的三份贡献，GoodIdea 综合出一项待决定，确认后产品稿改写。",
      loop: "循环播放", time: "时间",
    },
    chapters: [
      "设计师的日常", "最初的想法", "研究 · Mira", "UX · Luca", "工程 · Kai",
      "GoodIdea 综合", "你的确认", "产品稿改写", "客户视角", "回到 GoodIdea",
    ],
    chapterNotes: [
      "一位自由职业设计师发出品牌设计报价，客户接连问：包含头像吗、能改几次、加名片怎么算。",
      "她想到：能不能做个工具，帮我更快创建报价？这句话被写进 GoodIdea 的产品稿。",
      "研究 Agent Mira 提出一条待验证假设：客户反复问的，是「到底包含什么」。",
      "UX Agent Luca 承接 Mira 的发现，把交付、修改次数、包含与追加项画成探索草图，并留下一个问题：范围可以调整吗？",
      "工程 Agent Kai 指出：若允许调整范围，就要同步价格规则。他在 Luca 的草图上圈出这一条，标为留待后续，并建议轻量的第一版。",
      "GoodIdea 收下三份署名贡献，写出共同方向与待取舍项，整理成 1 项待你决定。",
      "提案停在那里，等创作者确认。产品稿在此之前没有变化。",
      "确认之后，旧描述被划掉，产品稿写上「先看清范围与价格」，版本从 v0.1 变成 v0.2。",
      "同一份产品稿摊开成客户会看到的样子：开头那三个问题，逐条得到回答。",
      "镜头拉开：设计师、三位 Agent 的工作纸、更新后的产品稿，都还在 GoodIdea 里。",
    ],
    opening: {
      corner: "一位自由职业设计师的日常", cornerNote: "产品概念演示",
      quoteChip: "报价单", quoteTitle: "品牌设计", quotePrice: "报价 ¥3,500",
      questions: ["包含头像吗？", "能改几次？", "加一张名片怎么算？"],
      thought: "每次报价，都要重新整理、解释一遍。",
    },
    creator: {
      label: "你 · 产品创作者",
      thoughts: [
        "把这个想法，交给 GoodIdea 一起推敲。",
        "原来，客户在意的是范围。",
        "这样看，就清楚多了。",
        "范围可调，会不会太重？",
        "分歧摆出来了，这一项我来定。",
        "就采用这个方向。",
        "第一版，变得更清楚了。",
        "站在客户这边，再看一遍。",
        "这下，可以开始合作了。",
      ],
    },
    workspace: {
      project: "设计师报价工具", breadcrumb: "我的想法",
      stages: ["想法", "团队推敲", "你的决定", "产品稿"],
      statuses: ["想法已接收", "团队推敲中", "1 项待你决定", "正在写入产品稿", "产品稿已更新", "体验产品预览"],
      evidence: "来自 Mira、Luca、Kai 的三份贡献",
    },
    product: {
      stageLabel: "最初的想法", canvasLabel: "产品稿", title: "设计师报价工具",
      original: ["能不能做个工具，", "帮我更快创建报价？"],
      currentLabel: "当前方向",
      versionNote: ["推敲中", "已更新"],
      proposalKicker: "待你决定 · 01", proposalKickerDone: "你已采用 · 写入产品稿",
      proposal: "先做范围确认？",
      proposalDetail: "让客户在开工前，看清交付内容、修改次数和价格。",
      deferred: "本轮暂不做：范围调整与自动计价，留待后续。",
      button: "采用这个方向", buttonDone: "你已确认",
      revised: ["先看清范围与价格，", "开工前，只读确认。"],
      revisedMark: "只把你确认的内容，写进第一版。",
    },
    sketch: {
      explore: {
        alt: "探索草图：交付内容、修改次数、包含与追加项；尚未采用",
        rows: [["交付内容", "页面 / 文件 / 交付格式"], ["修改次数", "约定次数"], ["包含", "约定内"], ["追加项", "单独说明"]],
        check: "包含", dash: "追加项",
      },
      accepted: {
        alt: "已确认的只读范围与价格局部草图",
        caption: "只读确认 · 局部稿",
        rows: [["交付内容 · 修改次数", ""], ["包含 / 追加项", "已写清"], ["价格", "已列明"]],
        foot: "阅读后确认",
      },
    },
    outlook: {
      chip: "客户视角预览",
      rows: [["交付内容", "品牌标志、社交头像"], ["包含修改", "2 轮"], ["追加项", "名片设计另行报价"]],
      totalKey: "总价", totalValue: "¥3,500",
      button: "确认范围", buttonDone: "已确认范围", confirm: "客户已确认",
      caption: ["把交付范围讲清楚，", "让合作更容易开始。"],
    },
    brand: { mark: "GoodIdea", lines: ["和 AI 团队一起，", "把想法推敲成可以开工的产品。"] },
    agents: {
      research: {
        role: "研究 Agent", name: "Mira", tagRole: "研究", initial: "M",
        title: "用户研究", tag: "待验证假设",
        work: ["正在读客户反复问的话", "正在写下范围假设"],
        notes: ["已提出范围假设"],
      },
      experience: {
        role: "UX Agent", name: "Luca", tagRole: "UX", initial: "L",
        title: "UX · 画出来", tag: "探索草图 · 尚未采用",
        work: ["正在把边界画成草图", "正在标出可调整的地方"],
        notes: ["承接研究，整理确认流程"],
      },
      engineering: {
        role: "工程 Agent", name: "Kai", tagRole: "工程", initial: "K",
        title: "工程 · 想一想", tag: "建议 · 待你确认",
        work: ["正在看实现代价", "正在核对计价依赖"],
        notes: ["已标出计价依赖", "已贡献建议：先做只读确认"],
      },
    },
    work: {
      researchLines: ["客户反复问：", "到底包含什么？"],
      uxQuestion: "承接 Mira 的发现：客户想知道到底包含什么。",
      uxOption: "范围可以调整吗？",
      engineeringLines: ["若允许调整范围，", "需要同步价格规则。", "建议轻量第一版：", "只读查看，再确认。"],
      engineeringQuote: "「范围可以调整吗？」· 留待后续",
      engineeringFootnote: "先把确认做轻。",
    },
    rail: {
      title: "AI 团队", waiting: "待接手", handedIn: "已交出",
      summary: [
        "等待团队接手",
        "1 份贡献 · 继续推敲",
        "2 份贡献 · 继续推敲",
        "3 份贡献 · 正在综合",
        "3 份贡献 → 1 项提案",
        "1 项已采用 · 写入 v0.2",
      ],
    },
    fusion: {
      kicker: "GoodIdea · 综合",
      chips: ["Mira · 范围假设", "Luca · 确认流程草图", "Kai · 计价依赖"],
      sharedLabel: "共同方向", shared: "让客户先看清范围与价格。",
      tradeLabel: "一处关键取舍", trade: "可调范围需要同步计价，第一版先做确认。",
      resultLabel: "整理成", result: "1 项提案：先做范围确认，其余留待后续。",
    },
  },

  en: {
    ui: {
      label: "How one idea gets worked out inside GoodIdea",
      play: "Play", pause: "Pause", replay: "Play again", poster: "Play the film",
      progress: "Playback position", nextScene: "Next scene", prevScene: "Previous scene",
      reduced: "Reduced motion is on: read it one scene at a time with previous / next.",
      transcript: "Text version: what the film shows",
      concept: "Concept film · fixed example. No live model, no backend.",
      stageAlt: "Paper stop-motion: a designer's quoting problem, three signed contributions from AI agents, one decision GoodIdea puts to the creator, and the product draft rewritten after they confirm it.",
      loop: "Loop", time: "Time",
    },
    chapters: [
      "A designer's day", "The first idea", "Research · Mira", "UX · Luca", "Engineering · Kai",
      "GoodIdea combines", "Your call", "The draft changes", "The client's view", "Back to GoodIdea",
    ],
    chapterNotes: [
      "A freelance designer sends a brand-design quote. The client asks: does it include avatars, how many revisions, what about a business card?",
      "She thinks: could I have a tool that makes quoting faster? That sentence becomes the product draft inside GoodIdea.",
      "Research agent Mira puts up an assumption to test: what the client keeps asking is what is actually included.",
      "UX agent Luca picks up Mira's finding and sketches deliverables, revisions, what is included and what is extra — leaving one question open: could the scope be adjustable?",
      "Engineering agent Kai answers that question: adjustable scope means pricing rules have to follow. He circles the line on Luca's sheet as something for later and suggests a lighter first version.",
      "GoodIdea takes the three signed contributions, states where they agree and what is still a trade-off, and turns it into one decision for the creator.",
      "The proposal waits. Nothing on the product draft changes until the creator confirms it.",
      "After the confirmation the first description is struck out, the draft reads “see the scope and the price first”, and the version moves from v0.1 to v0.2.",
      "The same draft opens into what the client would see, and the three opening questions are answered one by one.",
      "The camera pulls back: the designer, the three agents' sheets and the updated draft are all still there, inside GoodIdea.",
    ],
    opening: {
      corner: "A day in a freelance designer's work", cornerNote: "Product concept demo",
      quoteChip: "Quote", quoteTitle: "Brand design", quotePrice: "Quoted: $3,500",
      questions: ["Does that include avatars?", "How many revisions?", "What about a business card?"],
      thought: "Every quote, explained from scratch again.",
    },
    creator: {
      label: "You · the maker",
      thoughts: [
        "Let's work this idea out with GoodIdea.",
        "So what they care about is the scope.",
        "Laid out like that, it's much clearer.",
        "Adjustable scope — is that too much?",
        "The trade-off is on the table. This one is mine to call.",
        "Let's go with this direction.",
        "Version one just got clearer.",
        "Now read it as the client would.",
        "That's a project I can actually start.",
      ],
    },
    workspace: {
      project: "Designer quoting tool", breadcrumb: "My ideas",
      stages: ["Idea", "Team works", "Your call", "Draft"],
      statuses: ["Idea received", "Team is working", "1 decision for you", "Writing into the draft", "Draft updated", "Product preview"],
      evidence: "Three contributions: Mira, Luca, Kai",
    },
    product: {
      stageLabel: "The first idea", canvasLabel: "Product draft", title: "Designer quoting tool",
      original: ["Could I have a tool that", "makes quoting faster?"],
      currentLabel: "Current direction",
      versionNote: ["in progress", "updated"],
      proposalKicker: "Your call · 01", proposalKickerDone: "You adopted this · in the draft",
      proposal: "Start with a scope confirmation?",
      proposalDetail: "Before work starts, the client sees the deliverables, the revisions and the price.",
      deferred: "Not this round: adjustable scope and automatic pricing.",
      button: "Adopt this direction", buttonDone: "You confirmed",
      revised: ["See the scope and the price first.", "Confirm before work starts."],
      revisedMark: "Only what you confirmed goes into version one.",
    },
    sketch: {
      explore: {
        alt: "Exploration sketch: deliverables, revisions, what is included and what is extra. Not adopted.",
        rows: [["Deliverables", "pages / files"], ["Revisions", "agreed count"], ["Included", "in scope"], ["Extra", "priced apart"]],
        check: "Included", dash: "Extra",
      },
      accepted: {
        alt: "Confirmed read-only scope and price, drawn as a partial sketch",
        caption: "Read-only · partial draft",
        rows: [["Deliverables · revisions", ""], ["Included / extra", "written"], ["Price", "listed"]],
        foot: "Read, then confirm",
      },
    },
    outlook: {
      chip: "What the client sees",
      rows: [["Deliverables", "Logo, social avatars"], ["Revisions", "2 rounds"], ["Extra", "Business card quoted separately"]],
      totalKey: "Total", totalValue: "$3,500",
      button: "Confirm scope", buttonDone: "Scope confirmed", confirm: "Client confirmed",
      caption: ["Say what is in scope,", "and work is easier to start."],
    },
    brand: { mark: "GoodIdea", lines: ["With an AI team,", "an idea becomes something you can start building."] },
    agents: {
      research: {
        role: "Research agent", name: "Mira", tagRole: "Research", initial: "M",
        title: "User research", tag: "Assumption to test",
        work: ["Reading what the client keeps asking", "Writing down a scope assumption"],
        notes: ["Proposed a scope assumption"],
      },
      experience: {
        role: "UX agent", name: "Luca", tagRole: "UX", initial: "L",
        title: "UX · sketch it", tag: "Exploration · not adopted",
        work: ["Sketching where the edges are", "Marking what could be adjustable"],
        notes: ["Built on the research: a confirm flow"],
      },
      engineering: {
        role: "Engineering agent", name: "Kai", tagRole: "Engineering", initial: "K",
        title: "Engineering check", tag: "Suggestion · needs your call",
        work: ["Checking what it costs to build", "Tracing the pricing dependency"],
        notes: ["Flagged the pricing dependency", "Suggests a read-only first version"],
      },
    },
    work: {
      researchLines: ["The client keeps asking:", "what is actually included?"],
      uxQuestion: "Mira's finding, picked up: the client wants to know what is included.",
      uxOption: "Could the scope be adjustable?",
      engineeringLines: ["If scope can be adjusted,", "pricing rules follow.", "A lighter first version:", "read it, then confirm."],
      engineeringQuote: "“Could the scope be adjustable?” · later",
      engineeringFootnote: "Keep confirming light.",
    },
    rail: {
      title: "AI team", waiting: "Not started", handedIn: "Handed in",
      summary: [
        "Waiting to start",
        "1 contribution · still working",
        "2 contributions · still working",
        "3 contributions · being combined",
        "3 contributions → 1 proposal",
        "1 adopted · written into v0.2",
      ],
    },
    fusion: {
      kicker: "GoodIdea · combining",
      chips: ["Mira · scope assumption", "Luca · confirm-flow sketch", "Kai · pricing dependency"],
      sharedLabel: "Where they agree", shared: "Let the client see the scope and the price first.",
      tradeLabel: "One trade-off", trade: "Adjustable scope needs pricing to follow. Version one confirms only.",
      resultLabel: "Comes out as", result: "One proposal: confirm the scope first, the rest later.",
    },
  },

  ja: {
    ui: {
      label: "ひとつのアイデアが GoodIdea で形になるまで",
      play: "再生", pause: "一時停止", replay: "もう一度", poster: "映像を再生",
      progress: "再生位置", nextScene: "次の場面", prevScene: "前の場面",
      reduced: "「視差効果を減らす」設定のため、前へ／次へで一場面ずつ読めます。",
      transcript: "テキスト版：この映像の内容",
      concept: "コンセプト映像 · 固定の例。実モデルもバックエンドも使いません。",
      stageAlt: "紙のコマ撮り：デザイナーの見積もりの困りごと、AI エージェント 3 名の署名つき提案、GoodIdea がまとめた 1 件の判断、そして確認後に書き換わる製品ドラフト。",
      loop: "繰り返し再生", time: "時間",
    },
    chapters: [
      "デザイナーの一日", "最初のアイデア", "調査 · Mira", "UX · Luca", "実装 · Kai",
      "GoodIdea が統合", "あなたの確認", "ドラフトが変わる", "お客さまの視点", "GoodIdea へ",
    ],
    chapterNotes: [
      "フリーランスのデザイナーがブランドデザインの見積もりを送る。お客さまは次々に聞く：アイコンも入る？修正は何回？名刺を足すと？",
      "彼女は思う。見積もりをもっと早く作れる道具が作れないかな。その一文が GoodIdea の製品ドラフトになる。",
      "リサーチ Agent の Mira が検証前の仮説を出す。お客さまが繰り返し聞いているのは「どこまで含むか」。",
      "UX Agent の Luca が Mira の発見を受け、納品物・修正回数・含むものと追加分をスケッチする。ひとつ問いが残る：範囲は調整できる？",
      "エンジニアリング Agent の Kai がその問いに答える。範囲を調整できるなら価格の規則も揃える必要がある。Luca のスケッチのその行を丸で囲み「あとで」と印をつけ、軽い初版を提案する。",
      "GoodIdea が署名つきの 3 件を受け取り、共通する方向と判断が要る点を書き出して、あなたの決定 1 件にまとめる。",
      "提案はそこで止まる。あなたが確認するまで、製品ドラフトは変わらない。",
      "確認のあと、最初の説明に線が引かれ、ドラフトには「まず範囲と価格を見てもらう」と書かれる。版は v0.1 から v0.2 へ。",
      "同じドラフトが、お客さまに見える形に開く。冒頭の 3 つの問いに、ひとつずつ答えが返る。",
      "引いた画面には、デザイナーと 3 名の Agent の作業紙、更新されたドラフトが、GoodIdea の中に残っている。",
    ],
    opening: {
      corner: "フリーランスのデザイナーの日常", cornerNote: "製品コンセプトのデモ",
      quoteChip: "見積書", quoteTitle: "ブランドデザイン", quotePrice: "見積 ¥350,000",
      questions: ["アイコンも入りますか？", "修正は何回まで？", "名刺を足すといくら？"],
      thought: "見積もりのたび、また一から説明している。",
    },
    creator: {
      label: "あなた · 作り手",
      thoughts: [
        "このアイデア、GoodIdea と一緒に詰めてみよう。",
        "気にしていたのは、範囲だったのか。",
        "こう並ぶと、ずっと分かりやすい。",
        "範囲を変えられる、は重すぎない？",
        "迷いどころが見えた。ここは自分で決める。",
        "この方向で進めよう。",
        "初版が、はっきりしてきた。",
        "お客さまの側から、もう一度見てみる。",
        "これなら、気持ちよく始められる。",
      ],
    },
    workspace: {
      project: "デザイナー向け見積ツール", breadcrumb: "わたしのアイデア",
      stages: ["アイデア", "チーム検討", "あなたの決定", "ドラフト"],
      statuses: ["アイデアを受け取りました", "チームが検討中", "あなたの決定 1 件", "ドラフトに反映中", "ドラフト更新済み", "製品プレビュー"],
      evidence: "Mira・Luca・Kai の 3 件の提案から",
    },
    product: {
      stageLabel: "最初のアイデア", canvasLabel: "製品ドラフト", title: "デザイナー向け見積ツール",
      original: ["見積もりをもっと早く作れる", "道具が作れないかな？"],
      currentLabel: "いまの方向",
      versionNote: ["検討中", "更新済み"],
      proposalKicker: "あなたの決定 · 01", proposalKickerDone: "採用しました · ドラフトに反映",
      proposal: "まず範囲の確認から？",
      proposalDetail: "着手の前にお客さまが、納品物・修正回数・価格を確かめられる。",
      deferred: "今回はやらない：範囲の調整と自動見積もり。",
      button: "この方向で進める", buttonDone: "確認しました",
      revised: ["まず範囲と価格を見てもらう。", "着手前に、読んで確認。"],
      revisedMark: "確認したことだけを、初版に書きます。",
    },
    sketch: {
      explore: {
        alt: "探索スケッチ：納品物、修正回数、含むものと追加分。未採用。",
        rows: [["納品物", "ページ / ファイル / 形式"], ["修正回数", "取り決めた回数"], ["含む", "範囲内"], ["追加分", "別途見積"]],
        check: "含む", dash: "追加分",
      },
      accepted: {
        alt: "確認済みの、読むだけの範囲と価格の部分スケッチ",
        caption: "読むだけの確認 · 部分ドラフト",
        rows: [["納品物 · 修正回数", ""], ["含む / 追加分", "明記済み"], ["価格", "記載済み"]],
        foot: "読んでから確認",
      },
    },
    outlook: {
      chip: "お客さまに見える画面",
      rows: [["納品物", "ロゴ、SNS アイコン"], ["修正回数", "2 回"], ["追加分", "名刺デザインは別途見積"]],
      totalKey: "合計", totalValue: "¥350,000",
      button: "範囲を確認", buttonDone: "範囲を確認済み", confirm: "お客さまが確認しました",
      caption: ["範囲をはっきり伝えると、", "仕事は始めやすくなる。"],
    },
    brand: { mark: "GoodIdea", lines: ["AI チームと一緒に、", "アイデアを着手できる製品へ。"] },
    agents: {
      research: {
        role: "リサーチ Agent", name: "Mira", tagRole: "調査", initial: "M",
        title: "ユーザー調査", tag: "検証前の仮説",
        work: ["お客さまの問いを読んでいる", "範囲の仮説を書いている"],
        notes: ["範囲の仮説を提出"],
      },
      experience: {
        role: "UX Agent", name: "Luca", tagRole: "UX", initial: "L",
        title: "UX · 描いてみる", tag: "探索スケッチ · 未採用",
        work: ["境界をスケッチしている", "調整できる箇所に印をつけている"],
        notes: ["調査を受けて確認の流れを整理"],
      },
      engineering: {
        role: "実装 Agent", name: "Kai", tagRole: "実装", initial: "K",
        title: "実装 · 考えてみる", tag: "提案 · あなたの確認待ち",
        work: ["実装のコストを見ている", "価格の依存関係を確認している"],
        notes: ["価格の依存関係を指摘", "提案：まず読むだけの確認から"],
      },
    },
    work: {
      researchLines: ["お客さまは何度も聞く：", "結局どこまで含むの？"],
      uxQuestion: "Mira の発見：お客さまは「どこまで含むか」を知りたい。",
      uxOption: "範囲は調整できる？",
      engineeringLines: ["範囲を調整できるなら、", "価格の規則も揃える。", "軽い初版の提案：", "読んで、確認するだけ。"],
      engineeringQuote: "「範囲は調整できる？」· あとで",
      engineeringFootnote: "まず確認を軽く。",
    },
    rail: {
      title: "AI チーム", waiting: "着手前", handedIn: "提出済み",
      summary: [
        "着手を待っています",
        "貢献 1 件 · 検討中",
        "貢献 2 件 · 検討中",
        "貢献 3 件 · 統合中",
        "貢献 3 件 → 提案 1 件",
        "1 件採用 · v0.2 に反映",
      ],
    },
    fusion: {
      kicker: "GoodIdea · 統合",
      chips: ["Mira · 範囲の仮説", "Luca · 確認フローの草案", "Kai · 価格の依存"],
      sharedLabel: "共通する方向", shared: "まずお客さまに、範囲と価格を見せる。",
      tradeLabel: "判断が要る点", trade: "範囲を可変にすると価格も揃える必要がある。初版は確認だけ。",
      resultLabel: "まとまり", result: "提案 1 件：まず範囲の確認、残りは後で。",
    },
  },
};
