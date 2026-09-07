/* Every word the landing page says outside the walkthrough, in the three languages
 * it ships.
 *
 * The page is ordered so that scrolling alone answers four questions: what this is,
 * when it is for me, what I end up holding, and how to try it now. Each locale is
 * written in its own language rather than translated line for line, but the four
 * answers have to survive in all three.
 *
 * The site tells one story — a freelancer sorting a client's change requests — and
 * every section here refers to that same one. The words the walkthrough itself says
 * live in `studio/story/storyCopy.ts`; the output preview is assembled from them in
 * `studio/story/handoffPackage.ts`, so the page and the demo cannot drift apart.
 */

export type Locale = "en" | "ja" | "zh-CN";

/* How long the walkthrough actually runs is derived from the script, never typed
 * into the copy: any line that mentions the length carries `{seconds}` and is filled
 * in at render, so trimming a turn cannot leave the page promising the old number. */
export function withSeconds(text: string, seconds: number): string {
  return text.replace("{seconds}", String(seconds));
}

export type SiteCopy = {
  skip: string;
  primaryNavigationLabel: string;
  languageLabel: string;
  nav: { brief: string; demo: string; how: string; github: string };

  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
  /** The old brand line, kept as a quieter second voice. */
  heroBrandLine: string;
  heroPrimary: string;
  heroPrimaryNote: string;
  heroSecondary: string;
  heroSecondaryNote: string;
  mapReplay: string;
  mapReplayed: string;

  briefEyebrow: string;
  briefTitle: string;
  briefIntro: string;
  briefInputLabel: string;
  briefScenarioNote: string;
  briefDownload: string;
  briefLabels: {
    direction: string;
    prototype: string;
    scope: string;
    nonGoals: string;
    done: string;
    open: string;
    handoff: string;
  };
  briefFooter: string;

  demoEyebrow: string;
  demoTitle: string;
  demoIntro: string;
  demo: {
    startTitle: string;
    startText: string;
    watch: string;
    tryIt: string;
    play: string;
    pause: string;
    resume: string;
    replay: string;
    prevStep: string;
    /** Reduced motion has no autoplay to replay, so the end offers the steps again. */
    restartSteps: string;
    nextStep: string;
    stageLabel: string;
    lengthNote: string;
    playing: string;
    paused: string;
    finished: string;
    stepOf: string;
    finishedTitle: string;
    finishedText: string;
    finishedBrief: string;
    /** Only the retired walkthrough kept in `lab/legacy` still shows these. */
    modeLabel: string;
    modeWatch: string;
    modeTry: string;
    finishedTry: string;
  };

  howEyebrow: string;
  howTitle: string;
  howItems: { number: string; title: string; text: string }[];

  trustEyebrow: string;
  trustTitle: string;
  trustIntro: string;
  trustItems: { term: string; text: string }[];
  trustScope: string;
  trustLink: string;
  trustLinkHref: string;

  closingEyebrow: string;
  closingTitle: string;
  closingText: string;
  closingPrimary: string;
  closingSecondary: string;

  footer: string;
};

const REPO = "https://github.com/forge-context/goodidea-agent";

export const siteCopy: Record<Locale, SiteCopy> = {
  "zh-CN": {
    skip: "跳到正文",
    primaryNavigationLabel: "主导航",
    languageLabel: "语言",
    nav: { brief: "产出示例", demo: "Demo", how: "工作方式", github: "GitHub" },

    heroEyebrow: "给准备用 AI 写代码的人",
    heroTitle: "把一个想法，变成看得见的原型和可以交接的第一版。",
    heroIntro:
      "你已经能让 AI 写代码，缺的是第一版到底该做什么。GoodIdea 陪你把想法问清楚：为谁解决什么、原型长什么样、这一版做什么和不做什么、怎么算做对了。",
    heroBrandLine: "想法不是直线，但下一步可以很清楚。",
    heroPrimary: "看一个想法的 {seconds} 秒",
    heroPrimaryNote: "无需注册 · 固定示例，不调用真实模型",
    heroSecondary: "先看最后得到什么",
    heroSecondaryNote: "产品方向、概念原型、第一版定义与交接材料",
    mapReplay: "重看这段路线",
    mapReplayed: "路线重新开始。",

    briefEyebrow: "不用播放也能读完的产出",
    briefTitle: "一句想法，最后留下这几样东西。",
    briefIntro:
      "下面是这个固定示例走完之后留下的：产品方向、一个概念原型、第一版的定义，以及交给 coding agent 的材料。它不是已经生成的软件，也不代表这个市场已经被验证。",
    briefInputLabel: "最初的一句话",
    briefDownload: "下载这份交接包（Markdown）",
    briefScenarioNote:
      "示例场景：一位自由职业设计师，想把每次都要重新解释一遍的报价范围，变成一份客户能读、能确认的单子。页面不连接后端，原型是概念预览，交接与实现任务是示例内容。",
    briefLabels: {
      direction: "产品方向",
      prototype: "概念原型",
      scope: "第一版做什么",
      nonGoals: "第一版不做",
      done: "怎么算做对了",
      open: "还需要验证",
      handoff: "交接后的实现任务",
    },
    briefFooter:
      "下面的动画讲述这份方案如何成形：三位 Agent 各自提出，GoodIdea 综合，你来决定。这里保留完整内容，也可以下载交接包细看。",

    demoEyebrow: "AI 团队和你，一起把想法推敲清楚",
    demoTitle: "三份贡献，一项待你决定。",
    demoIntro:
      "{seconds} 秒：一位设计师的报价困扰变成一个想法；研究、UX 与工程三位 Agent 各交出一份署名贡献；GoodIdea 把共同方向和分歧整理成一项待决定。你确认之后，产品稿才改写。",
    demo: {
      startTitle: "先看一遍，还是直接试原型？",
      startText:
        "约 {seconds} 秒看完整个过程：从一句模糊的话，到一个能点的原型、一版定下来的范围，和交给 coding agent 的材料。也可以直接跳到原型自己试。",
      watch: "播放演示",
      tryIt: "直接试原型",
      play: "播放",
      pause: "暂停",
      resume: "继续",
      replay: "重播演示",
      prevStep: "上一步",
      restartSteps: "从第一步重看",
      nextStep: "下一步",
      stageLabel: "阶段",
      lengthNote: "七个阶段 · 约 {seconds} 秒",
      playing: "播放中",
      paused: "已暂停",
      finished: "演示结束",
      stepOf: "第 {current} / {total} 步",
      finishedTitle: "演示到这里结束",
      finishedText: "产品方向、概念原型、第一版范围和交接材料都已经留下来了。",
      finishedBrief: "看这一页产出",
      modeLabel: "体验方式",
      modeWatch: "观看演示",
      modeTry: "自己体验",
      finishedTry: "自己走一遍",
    },

    howEyebrow: "工作方式",
    howTitle: "一次只推进一个会影响方向的问题。",
    howItems: [
      {
        number: "01",
        title: "从一次真实经历问起",
        text: "不从功能开始，先问最近哪一段最花时间。你说过的条件会留在地图上，不用重复说第二遍。",
      },
      {
        number: "02",
        title: "尽早看到能点的原型",
        text: "把讨论变成一个可以操作的概念原型。你在里面提新要求，画面跟着变，不用等到写完代码才知道对不对。",
      },
      {
        number: "03",
        title: "定下边界，做成能交接的一份",
        text: "写清这一版做什么、不做什么、满足什么条件算完成，连同原型一起交给 coding agent。",
      },
    ],

    trustEyebrow: "你保留的控制",
    trustTitle: "它替你整理，但不替你决定。",
    trustIntro: "下面几条决定了：当它想错的时候，你还能不能把结论拉回来。",
    trustItems: [
      {
        term: "每一步都追得回去",
        text: "第一版里的每一条，都写着它是从你哪一句话来的。不同意，就能顺着那句话改回去。",
      },
      {
        term: "改动先给你看",
        text: "每次要动结论，它先摆出改了什么、加了什么、还有什么不确定，再问你要不要。",
      },
      {
        term: "模糊的「好」不算决定",
        text: "你答得含糊时，它会把具体选项再摆一次，而不是替你选一个继续往下走。",
      },
      {
        term: "没做到的事会写明",
        text: "原型是概念预览，交接材料是示例内容。哪些还没验证，会单独列出来，不混进结论里。",
      },
    ],
    trustScope:
      "现在公开的是这套固定示例和它的界面实现。真实工作台还没有开放：页面不连接后端，不会真的生成软件，也不会真的把材料发给任何 coding agent。",
    trustLink: "查看 Demo 源码",
    trustLinkHref: REPO,

    closingEyebrow: "下一步",
    closingTitle: "从一句话开始，看看第一版该长什么样。",
    closingText:
      "先看 {seconds} 秒的动画，看 AI 团队怎么提出、GoodIdea 怎么综合、决定权怎么留在你手里。想细看留下什么，回到上面的产出示例。",
    closingPrimary: "看一个想法的 {seconds} 秒",
    closingSecondary: "回到产出示例",

    footer: "公开 Demo 与共用界面实现 · English / 日本語 / 简体中文",
  },

  en: {
    skip: "Skip to content",
    primaryNavigationLabel: "Primary navigation",
    languageLabel: "Language",
    nav: { brief: "Example output", demo: "Demo", how: "How it works", github: "GitHub" },

    heroEyebrow: "For people about to build with AI",
    heroTitle: "Turn one idea into a prototype you can see and a first version you can hand over.",
    heroIntro:
      "You can already get AI to write the code. What is missing is version one: who it is for, what the thing actually looks like, what it does and does not do, and how you will know it came out right. GoodIdea works that out with you.",
    heroBrandLine: "An idea is not a straight line. The next step can still be clear.",
    heroPrimary: "An idea, in {seconds} seconds",
    heroPrimaryNote: "No sign-up · fixed example, no live model",
    heroSecondary: "See what you end up with",
    heroSecondaryNote: "Direction, concept prototype, version-one definition, handoff",
    mapReplay: "Play the route again",
    mapReplayed: "The route starts over.",

    briefEyebrow: "Output you can read without pressing play",
    briefTitle: "One sentence in. These come out.",
    briefIntro:
      "This is what the fixed example ends with: a product direction, a concept prototype, a definition of version one, and the package a coding agent would be handed. It is not generated software, and it is not evidence that the market has been validated.",
    briefInputLabel: "The first sentence",
    briefDownload: "Download the handoff package (Markdown)",
    briefScenarioNote:
      "The example: a freelance designer who wants the scope they re-explain on every quote to become one sheet a client can read and confirm. Nothing here talks to a backend; the prototype is a concept preview and the handoff tasks are sample content.",
    briefLabels: {
      direction: "Direction",
      prototype: "Concept prototype",
      scope: "Version one does",
      nonGoals: "Version one does not",
      done: "Done means",
      open: "Still unverified",
      handoff: "Work after the handoff",
    },
    briefFooter:
      "The film below shows this plan taking shape: three agents propose, GoodIdea combines, you decide. Read the full details here, or download the handoff package.",

    demoEyebrow: "You and an AI team, working one idea out",
    demoTitle: "Three contributions. One decision, and it is yours.",
    demoIntro:
      "{seconds} seconds: a designer's quoting problem becomes an idea, research, UX and engineering agents each hand in a signed contribution, and GoodIdea states where they agree and what is still a trade-off. The product draft changes only after you confirm it.",
    demo: {
      startTitle: "Watch it through, or go straight to the prototype?",
      startText:
        "About {seconds} seconds end to end: from one vague sentence to something you can click, a scope that is actually decided, and the package handed to a coding agent. Or skip ahead and try the prototype now.",
      watch: "Play the walkthrough",
      tryIt: "Go to the prototype",
      play: "Play",
      pause: "Pause",
      resume: "Resume",
      replay: "Play again",
      prevStep: "Previous step",
      restartSteps: "Watch from step one",
      nextStep: "Next step",
      stageLabel: "Chapter",
      lengthNote: "Seven chapters · about {seconds} seconds",
      playing: "Playing",
      paused: "Paused",
      finished: "Walkthrough finished",
      stepOf: "Step {current} of {total}",
      finishedTitle: "That is the end of the walkthrough",
      finishedText: "The direction, the prototype, the scope of version one and the handoff are all on the page.",
      finishedBrief: "Read the output page",
      modeLabel: "How to explore",
      modeWatch: "Watch",
      modeTry: "Try it",
      finishedTry: "Take it yourself",
    },

    howEyebrow: "How it works",
    howTitle: "One question at a time — the one that changes the direction.",
    howItems: [
      {
        number: "01",
        title: "Start from something that happened",
        text: "Not from features. What took the most time on the last real project? What you say about your own limits stays on the map, so you never say it twice.",
      },
      {
        number: "02",
        title: "Get to a prototype you can click",
        text: "The conversation turns into a concept prototype early. Ask for something inside it and the screen changes, instead of finding out after the code is written.",
      },
      {
        number: "03",
        title: "Fix the edges and hand it over",
        text: "Write down what this version does, what it will not do, and what has to be true to call it finished — then hand that, with the prototype, to the coding agent.",
      },
    ],

    trustEyebrow: "What stays yours",
    trustTitle: "It organises the idea. It does not decide it.",
    trustIntro: "Each line below answers the same question: when it gets something wrong, can you still pull the conclusion back?",
    trustItems: [
      {
        term: "Every line traces back",
        text: "Each item in version one says which sentence of yours it came from. Disagree, and you can follow it back to that sentence and change it.",
      },
      {
        term: "Changes are shown first",
        text: "Before a conclusion moves, you see what changed, what was added, and what is still open — and then you are asked.",
      },
      {
        term: "A vague yes is not a choice",
        text: "When your answer is loose, it puts the concrete options back in front of you instead of quietly picking one.",
      },
      {
        term: "What it cannot do is said plainly",
        text: "The prototype is a concept preview and the handoff is sample content. What has not been verified is listed on its own, not folded into the conclusion.",
      },
    ],
    trustScope:
      "What is public today is this fixed example and the interface it runs on. The live workspace is not open yet: nothing on this page talks to a backend, nothing is really generated, and no package is really sent to a coding agent.",
    trustLink: "View the demo source",
    trustLinkHref: REPO,

    closingEyebrow: "Next",
    closingTitle: "Start from one sentence and see what version one looks like.",
    closingText:
      "Watch the {seconds}-second film: what the agents propose, how GoodIdea combines it, and where the decision stays. For the full result, return to the example output above.",
    closingPrimary: "An idea, in {seconds} seconds",
    closingSecondary: "Back to the example output",

    footer: "Public demo and shared interface · English / 日本語 / 简体中文",
  },

  ja: {
    skip: "本文へ移動",
    primaryNavigationLabel: "メインナビゲーション",
    languageLabel: "言語",
    nav: { brief: "成果物の例", demo: "Demo", how: "進め方", github: "GitHub" },

    heroEyebrow: "AI と一緒に作り始める人へ",
    heroTitle: "アイデアを、目に見える試作と、引き渡せる初版に。",
    heroIntro:
      "コードは AI に書かせられる。決まっていないのは初版です。誰のどの困りごとを解くのか、実物はどんな形か、何をやって何をやらないのか、どうなったら正しくできたと言えるのか。GoodIdea はそこを一緒に詰めます。",
    heroBrandLine: "アイデアは直線ではない。それでも次の一歩は決められる。",
    heroPrimary: "あるアイデアの {seconds} 秒を見る",
    heroPrimaryNote: "登録不要 · 固定の例で、実モデルは呼びません",
    heroSecondary: "先に成果物を見る",
    heroSecondaryNote: "方向・コンセプト試作・初版の定義・引き渡し一式",
    mapReplay: "ルートをもう一度",
    mapReplayed: "ルートを最初から再生します。",

    briefEyebrow: "再生しなくても読める成果物",
    briefTitle: "一文のアイデアから、これだけが残ります。",
    briefIntro:
      "固定の例を最後まで進めると残るもの：製品の方向、コンセプト試作、初版の定義、そして coding agent に渡す一式です。生成済みのソフトウェアではなく、市場が検証済みだという意味でもありません。",
    briefInputLabel: "最初の一文",
    briefDownload: "引き渡し資料をダウンロード（Markdown）",
    briefScenarioNote:
      "例：フリーランスのデザイナーが、見積もりのたびに説明し直している範囲を、お客さまが読んで確認できる一枚にしたい。このページはバックエンドにつながらず、試作はコンセプトの見取り図、引き渡しの作業も例です。",
    briefLabels: {
      direction: "製品の方向",
      prototype: "コンセプト試作",
      scope: "初版でやること",
      nonGoals: "初版でやらないこと",
      done: "できたと言える条件",
      open: "まだ検証していない",
      handoff: "引き渡し後の作業",
    },
    briefFooter:
      "下の映像は、この案が形になるまでの物語です。3 名の Agent が提案し、GoodIdea がまとめ、決めるのはあなた。詳しい内容はここで読め、引き渡し資料もダウンロードできます。",

    demoEyebrow: "AI チームとあなたで、アイデアを詰める",
    demoTitle: "提案は 3 件。決めるのは、1 件のあなたの判断。",
    demoIntro:
      "{seconds} 秒。デザイナーの見積もりの困りごとがアイデアになり、調査・UX・実装の 3 名の Agent が署名つきの提案を出し、GoodIdea が共通点と判断が要る点をまとめます。製品ドラフトが変わるのは、あなたが確認したあとです。",
    demo: {
      startTitle: "通しで見ますか、試作から触りますか。",
      startText:
        "約 {seconds} 秒で全体を通します。曖昧な一文から、触れる試作、実際に決まった範囲、そして coding agent に渡す一式まで。先に試作へ飛ぶこともできます。",
      watch: "デモを再生",
      tryIt: "試作から触る",
      play: "再生",
      pause: "一時停止",
      resume: "再開",
      replay: "もう一度再生",
      prevStep: "前へ",
      restartSteps: "最初から見直す",
      nextStep: "次へ",
      stageLabel: "章",
      lengthNote: "7 章 · 約 {seconds} 秒",
      playing: "再生中",
      paused: "停止中",
      finished: "再生終了",
      stepOf: "{total} 中 {current} 番目",
      finishedTitle: "デモはここまでです",
      finishedText: "方向、試作、初版の範囲、引き渡し一式が、すべてページに残りました。",
      finishedBrief: "成果物を読む",
      modeLabel: "進め方",
      modeWatch: "見る",
      modeTry: "自分で",
      finishedTry: "自分で進める",
    },

    howEyebrow: "進め方",
    howTitle: "方向を変える問いだけを、一度に一つずつ。",
    howItems: [
      {
        number: "01",
        title: "実際にあった一件から聞く",
        text: "機能からは始めません。直近の案件でどこが一番時間を食ったか。制約として話したことは地図に残るので、二度言う必要はありません。",
      },
      {
        number: "02",
        title: "早い段階で触れる試作にする",
        text: "会話をコンセプト試作に変えます。その中で要望を言えば画面が変わる。コードを書き終えてから確かめる必要はありません。",
      },
      {
        number: "03",
        title: "境目を決めて、渡せる形にする",
        text: "この版でやること、やらないこと、何を満たせば完了かを書き出し、試作ごと coding agent に渡します。",
      },
    ],

    trustEyebrow: "あなたが握り続けるもの",
    trustTitle: "整理はする。決めはしない。",
    trustIntro: "以下はすべて「間違えたとき、結論を引き戻せるか」への答えです。",
    trustItems: [
      {
        term: "どの一行もたどれる",
        text: "初版の各項目には、あなたのどの発言から来たかが書いてあります。違うと思えば、その発言まで戻って直せます。",
      },
      {
        term: "変更は先に見せる",
        text: "結論を動かす前に、何が変わり、何が加わり、何がまだ不確かかを出してから聞きます。",
      },
      {
        term: "曖昧な「はい」は選択ではない",
        text: "答えがぼやけているときは、具体的な選択肢をもう一度出します。勝手に一つ選んで先へは進みません。",
      },
      {
        term: "できていないことは書く",
        text: "試作はコンセプトの見取り図、引き渡しは例の内容です。未検証のものは結論に混ぜず、別に並べます。",
      },
    ],
    trustScope:
      "現在公開しているのは、この固定の例とその画面実装です。実際のワークスペースはまだ公開しておらず、このページはバックエンドに接続せず、実際に何かを生成することも、coding agent に一式を送ることもありません。",
    trustLink: "Demo のソースを見る",
    trustLinkHref: REPO,

    closingEyebrow: "次にできること",
    closingTitle: "一文から始めて、初版がどうなるか見てみる。",
    closingText:
      "{seconds} 秒の映像で、Agent が何を出し、GoodIdea がどうまとめ、決定がどこに残るのかを見てください。残るものを詳しく知りたいときは、上の成果物の例へ。",
    closingPrimary: "あるアイデアの {seconds} 秒を見る",
    closingSecondary: "成果物の例に戻る",

    footer: "公開 Demo と共通 UI の実装 · English / 日本語 / 简体中文",
  },
};
