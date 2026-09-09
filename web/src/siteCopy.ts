/* Every word the landing page says outside the film, in the three languages it ships.
 *
 * The page is ordered so that scrolling alone answers four questions, in this order:
 * what this is and what it leaves you with, how one idea actually gets there, what
 * the finished thing contains, and who decides. Each locale is written in its own
 * language rather than translated line for line, but those four answers have to
 * survive in all three.
 *
 * One case runs through the whole page — a freelance designer turning a quote's scope
 * into something a client can read and confirm — and every section refers to that same
 * one. The words the film itself says live in `studio/paper/paperCopy.ts`; the outcome
 * preview and the download are assembled from them in `studio/paper/paperBrief.ts`, so
 * the page, the demo and the file cannot drift apart.
 *
 * Some keys below are read only by the retired walkthroughs kept in `lab/`. They are
 * marked, and the landing page does not show them.
 */

export type Locale = "en" | "ja" | "zh-CN";

/* How long the film actually runs is derived from the script, never typed into the
 * copy: any line that mentions the length carries `{seconds}` and is filled in at
 * render, so trimming a turn cannot leave the page promising the old number. */
export function withSeconds(text: string, seconds: number): string {
  return text.replace("{seconds}", String(seconds));
}

export type SiteCopy = {
  skip: string;
  primaryNavigationLabel: string;
  languageLabel: string;
  nav: { demo: string; brief: string; how: string; github: string };

  heroEyebrow: string;
  /** The headline, one clause per line.
   *
   *  Chinese and Japanese may break between any two characters, and at headline size
   *  that regularly splits a two-character word down the middle — `auto-phrase` is
   *  Chrome-only and does not segment Chinese. So the copy carries its own lines:
   *  each part is a block, and a language whose clause is wider than the column (in
   *  practice English) still wraps inside its own part. */
  heroTitle: string[];
  /** The words inside `heroTitle` that carry the promise — "you can start building",
   *  and its equivalent in each language. They are marked on the page with the one
   *  bright accent the palette allows, drawn as the same hand rule the illustration
   *  uses. It has to be a substring of exactly one of the title's lines: a mark that
   *  wrapped would draw two rules, and a mark that matched twice would draw none. */
  heroTitleMark: string;
  /** Two short lines: what the team does, and what stays the visitor's to decide.
   *  Kept as two strings so each language breaks where its own clause ends. */
  heroIntro: [string, string];
  heroPrimary: string;
  /** The quiet label under the actions; carries the derived length. */
  heroPrimaryNote: string;
  heroSecondary: string;
  /** The quiet way out of a hero that fills the window: it says which direction the
   *  page goes, and it is a link to the demo like the button above it. */
  heroScrollCue: string;

  /* The one phrase laid over the drawing beside the headline. The artwork ships
     without words on purpose, because the same picture serves three languages and a
     slab of one of them is not an illustration to the other two.
     One phrase, not three: the headline beside it already carries the promise, and a
     drawing that has to be read line by line stops being scenery and starts
     competing with the words it was meant to support. */
  scene: {
    /** The whole picture, said once, for anyone who is not looking at it. */
    alt: string;
    /** Inside the ring on the right. A ring is only wide across its middle, so the
     *  breaks are written into the copy: two or three short lines fit, a paragraph
     *  does not. */
    circled: string;
  };

  demoEyebrow: string;
  demoTitle: string;
  demoIntro: string;

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
  /** The three groups the outcome is read in, before any detail is opened. */
  briefGroups: { direction: string; scope: string; handoff: string };
  briefDetails: string;
  briefFooter: string;

  workEyebrow: string;
  workTitle: string;
  workIntro: string;
  workSteps: { number: string; title: string; text: string }[];
  workPrinciples: { term: string; text: string }[];
  /** Where the product is going, said as a goal rather than as something on screen. */
  workVision: string;

  /** The one full statement of what is and is not open. Said once, in the closing. */
  trustScope: string;
  trustLink: string;
  trustLinkHref: string;

  closingEyebrow: string;
  closingTitle: string;
  closingText: string;
  closingPrimary: string;
  closingSecondary: string;

  footer: string;

  /* ---- read only by the retired walkthroughs in `lab/` ------------------- */
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
    modeLabel: string;
    modeWatch: string;
    modeTry: string;
    finishedTry: string;
  };
};

const REPO = "https://github.com/forge-context/goodidea-agent";

export const siteCopy: Record<Locale, SiteCopy> = {
  "zh-CN": {
    skip: "跳到正文",
    primaryNavigationLabel: "主导航",
    languageLabel: "语言",
    nav: { demo: "Demo", brief: "成果", how: "协作机制", github: "GitHub" },

    heroEyebrow: "给准备用 AI 写代码的人",
    heroTitle: ["和 AI 团队一起，", "把想法推敲成", "可以开工的产品。"],
    heroTitleMark: "可以开工",
    heroIntro: [
      "研究、设计与工程给出专业判断和方向。",
      "由你拍板，交出能直接开工的第一版。",
    ],
    heroPrimary: "看一个想法如何成形",
    heroPrimaryNote: "{seconds} 秒 · 无需注册",
    heroSecondary: "看看最终成果",
    heroScrollCue: "向下探索",

    scene: {
      alt: "一张摊开的手绘产品草稿：纸上有界面线框、被划掉的一版和更简单的下一版、圈出的一句话和几道绿线；一位女性拿着铅笔靠在纸的上边思考，一个人站在纸前看着它。",
      circled: "把想法，\n推敲成形。",
    },

    demoEyebrow: "主 Demo",
    demoTitle: "看一个报价工具的想法，如何变得具体。",
    demoIntro:
      "研究、UX 与工程三位 Agent 各交出一份署名贡献，GoodIdea 写出共同方向和一处需要拍板的取舍。你确认之后，产品稿才改写。",

    briefEyebrow: "成果",
    briefTitle: "同一个案例，最终留下什么。",
    briefIntro:
      "上面这段动画走完，留下的就是下面这些：一份产品稿、第一版的范围，以及交给 coding agent 的材料。",
    briefInputLabel: "最初的一句话",
    briefDownload: "下载交接包（Markdown）",
    briefScenarioNote:
      "案例：一位自由职业设计师，想把每次都要重新解释的报价范围，变成一份客户能读、能确认的单子。",
    briefLabels: {
      direction: "产品方向",
      prototype: "概念草图",
      scope: "第一版做什么",
      nonGoals: "第一版不做",
      done: "怎么算做对了",
      open: "还需要验证",
      handoff: "交接后的实现任务",
    },
    briefGroups: { direction: "产品方向与草图", scope: "第一版范围", handoff: "开发交接" },
    briefDetails: "展开：验收条件、待验证假设与实现任务",
    briefFooter: "页面上的内容和下载的交接包同源，改一处就一起改。",

    workEyebrow: "协作机制",
    workTitle: "AI 团队提出，GoodIdea 综合，你来决定。",
    workIntro: "三步之后是三条原则。它们决定了：当它想错的时候，你还能不能把结论拉回来。",
    workSteps: [
      {
        number: "01",
        title: "专业 Agent 从不同角度提出",
        text: "研究看客户反复问的是什么，UX 把边界画成草图，工程算实现代价。每份贡献都署名，也都说清是假设、探索还是建议。",
      },
      {
        number: "02",
        title: "GoodIdea 对齐方向与待取舍项",
        text: "三份贡献收在一起，写出它们共同指向的方向，以及一处需要有人拍板的取舍——不替你把分歧抹平。",
      },
      {
        number: "03",
        title: "你确认之后，才写入产品稿",
        text: "提案停在那里等你。确认之后旧描述被划掉、新方向写上、版本号变化，你看得出这次决定改了什么。",
      },
    ],
    workPrinciples: [
      { term: "贡献有来源", text: "产品稿上的每一条，都写着它来自哪位 Agent 的哪份贡献。" },
      { term: "提案与已采用分开", text: "没被确认的提案有自己的边框，不会悄悄变成产品内容。" },
      { term: "未验证的会标出来", text: "研究提出的是待验证假设，草图是尚未采用的探索，都单独标记。" },
    ],
    workVision:
      "在地图里直接修改、在原型里点着提新要求，是 GoodIdea 的产品目标，当前公开的动画还没有这些交互。",

    trustScope:
      "现在公开的是这一个固定案例和它的界面实现。真实工作台还没有开放：页面不连接后端，不会真的生成软件，也不会真的把材料发给任何 coding agent。",
    trustLink: "查看 Demo 源码",
    trustLinkHref: REPO,

    closingEyebrow: "下一步",
    closingTitle: "从一句话开始，看看第一版该长什么样。",
    closingText: "{seconds} 秒看完整个过程，或者直接读这一页留下的成果。",
    closingPrimary: "看一个想法如何成形",
    closingSecondary: "查看 / 下载成果",

    footer: "公开 Demo 与共用界面实现 · English / 日本語 / 简体中文",

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
  },

  en: {
    skip: "Skip to content",
    primaryNavigationLabel: "Primary navigation",
    languageLabel: "Language",
    nav: { demo: "Demo", brief: "Output", how: "How it works", github: "GitHub" },

    heroEyebrow: "For people about to build with AI",
    /* Three clauses, like the other two languages, rather than one long sentence
       left to wrap wherever the column runs out. A clause wider than the column
       still wraps inside its own line, so nothing overflows. */
    heroTitle: ["Work your idea out", "with an AI team, until", "you can start building."],
    heroTitleMark: "start building",
    heroIntro: [
      "Research, design and engineering settle the direction.",
      "You make the call, and the result is ready to build.",
    ],
    heroPrimary: "Watch an idea take shape",
    heroPrimaryNote: "{seconds} seconds · no sign-up",
    heroSecondary: "See the finished outcome",
    heroScrollCue: "Explore below",

    scene: {
      alt: "A large hand-drawn product draft spread out on a desk: an interface sketch, one version crossed out beside a simpler one, a circled note and a few green rules; a woman leans on the top edge with a pencil, and someone stands in front of the paper looking at it.",
      circled: "Work the idea\ninto a shape\nyou can build.",
    },

    demoEyebrow: "The demo",
    demoTitle: "Watch one quoting-tool idea get specific.",
    demoIntro:
      "Research, UX and engineering agents each hand in a signed contribution, and GoodIdea states where they agree and the one trade-off that still needs a person. The product draft changes only after you confirm it.",

    briefEyebrow: "Output",
    briefTitle: "The same case. This is what is left.",
    briefIntro:
      "When the film above finishes, this is what remains: a product draft, the scope of version one, and the package a coding agent would be handed.",
    briefInputLabel: "The first sentence",
    briefDownload: "Download the handoff package (Markdown)",
    briefScenarioNote:
      "The case: a freelance designer who wants the scope they re-explain on every quote to become one sheet a client can read and confirm.",
    briefLabels: {
      direction: "Direction",
      prototype: "Concept sketch",
      scope: "Version one does",
      nonGoals: "Version one does not",
      done: "Done means",
      open: "Still unverified",
      handoff: "Work after the handoff",
    },
    briefGroups: { direction: "Direction and sketch", scope: "Version-one scope", handoff: "Handoff to development" },
    briefDetails: "Open: acceptance, unverified assumptions and implementation tasks",
    briefFooter: "The page and the downloaded package are built from the same source, so they cannot disagree.",

    workEyebrow: "How it works",
    workTitle: "The agents propose. GoodIdea combines. You decide.",
    workIntro: "Three steps, then three principles — and the principles all answer one question: when it gets something wrong, can you pull the conclusion back?",
    workSteps: [
      {
        number: "01",
        title: "Specialists propose, from different angles",
        text: "Research reads what the client keeps asking. UX sketches where the edges are. Engineering prices the build. Each contribution is signed, and says whether it is an assumption, an exploration or a suggestion.",
      },
      {
        number: "02",
        title: "GoodIdea states the direction and the trade-off",
        text: "The three contributions come together into what they agree on, plus the one choice that needs a person to make it. Disagreement is put on the table, not smoothed away.",
      },
      {
        number: "03",
        title: "Nothing reaches the draft until you confirm it",
        text: "The proposal waits. After you confirm, the old description is struck out, the new direction is written in and the version moves — so you can see what your decision changed.",
      },
    ],
    workPrinciples: [
      { term: "Contributions are attributed", text: "Every line on the draft says which agent's contribution it came from." },
      { term: "Proposed and adopted stay apart", text: "An unconfirmed proposal keeps its own dashed edge; it never quietly becomes product content." },
      { term: "What is unverified is marked", text: "Research proposes an assumption to test; a sketch is an exploration, not an adopted design. Both say so." },
    ],
    workVision:
      "Editing on the map itself, and asking for changes inside a running prototype, are where GoodIdea is going. The public film does not have those interactions yet.",

    trustScope:
      "What is public today is this one fixed case and the interface it runs on. The live workspace is not open yet: nothing on this page talks to a backend, nothing is really generated, and no package is really sent to a coding agent.",
    trustLink: "View the demo source",
    trustLinkHref: REPO,

    closingEyebrow: "Next",
    closingTitle: "Start from one sentence, and see what version one looks like.",
    closingText: "Watch the whole thing in {seconds} seconds, or just read what it leaves behind.",
    closingPrimary: "Watch an idea take shape",
    closingSecondary: "Read or download the output",

    footer: "Public demo and shared interface · English / 日本語 / 简体中文",

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
  },

  ja: {
    skip: "本文へ移動",
    primaryNavigationLabel: "メインナビゲーション",
    languageLabel: "言語",
    nav: { demo: "Demo", brief: "成果物", how: "進め方", github: "GitHub" },

    heroEyebrow: "AI と一緒に作り始める人へ",
    heroTitle: ["AI チームと一緒に、", "アイデアを", "開発に進める形へ。"],
    heroTitleMark: "開発に進める形",
    heroIntro: [
      "調査・デザイン・エンジニアリングが、方向をはっきりさせる。",
      "決めるのはあなた。残るのは、開発に進める初版です。",
    ],
    heroPrimary: "アイデアが形になる過程を見る",
    heroPrimaryNote: "{seconds} 秒 · 登録不要",
    heroSecondary: "最終的な成果を見る",
    heroScrollCue: "下へ進む",

    scene: {
      alt: "机に広げた大きな手描きの製品ドラフト。画面のラフ、線を引いて外した案とより簡単な次の案、丸で囲んだ一文と数本の緑の線が描かれ、鉛筆を持った女性が紙の上端にもたれ、もう一人が紙の前に立って眺めている。",
      circled: "アイデアを、\n進める形に。",
    },

    demoEyebrow: "デモ",
    demoTitle: "見積もりツールのアイデアが、具体になるまで。",
    demoIntro:
      "調査・UX・実装の 3 名の Agent が署名つきの提案を出し、GoodIdea が共通する方向と、人が決めるべき 1 つの取捨をまとめる。製品ドラフトが変わるのは、あなたが確認したあとです。",

    briefEyebrow: "成果物",
    briefTitle: "同じ事例から、最後に残るもの。",
    briefIntro:
      "上の映像を最後まで見ると残るのが、これです。製品ドラフト、初版の範囲、そして coding agent に渡す一式。",
    briefInputLabel: "最初の一文",
    briefDownload: "引き渡し資料をダウンロード（Markdown）",
    briefScenarioNote:
      "事例：フリーランスのデザイナーが、見積もりのたびに説明し直している範囲を、お客さまが読んで確認できる一枚にしたい。",
    briefLabels: {
      direction: "製品の方向",
      prototype: "コンセプトスケッチ",
      scope: "初版でやること",
      nonGoals: "初版でやらないこと",
      done: "できたと言える条件",
      open: "まだ検証していない",
      handoff: "引き渡し後の作業",
    },
    briefGroups: { direction: "方向とスケッチ", scope: "初版の範囲", handoff: "開発への引き渡し" },
    briefDetails: "開く：完了条件・未検証の仮説・実装の作業",
    briefFooter: "ページの内容とダウンロードする資料は同じ元から作られるので、食い違いません。",

    workEyebrow: "進め方",
    workTitle: "Agent が提案し、GoodIdea がまとめ、あなたが決める。",
    workIntro: "3 つの手順のあとに 3 つの原則。原則はすべて「間違えたとき、結論を引き戻せるか」への答えです。",
    workSteps: [
      {
        number: "01",
        title: "専門の Agent が、別の角度から出す",
        text: "調査はお客さまが繰り返し聞くことを読み、UX は境界をスケッチし、実装はコストを見ます。提案には署名があり、仮説か・探索か・提案かも書かれます。",
      },
      {
        number: "02",
        title: "GoodIdea が方向と判断どころをまとめる",
        text: "3 件をまとめて、共通する方向と、人が決めるべき 1 つの取捨を書き出します。食い違いは、消さずに並べます。",
      },
      {
        number: "03",
        title: "確認するまで、ドラフトは変わらない",
        text: "提案はそこで待ちます。確認のあと、古い説明に線が引かれ、新しい方向が書かれ、版が上がる。何が変わったかが見えます。",
      },
    ],
    workPrinciples: [
      { term: "提案には出どころがある", text: "ドラフトの各行に、どの Agent のどの提案から来たかが書かれています。" },
      { term: "提案と採用は分けて見せる", text: "確認前の提案は破線の枠のまま。黙って製品の内容に変わることはありません。" },
      { term: "未検証には印をつける", text: "調査が出すのは検証前の仮説、スケッチは未採用の探索。どちらもそう書いてあります。" },
    ],
    workVision:
      "地図の上で直接直す、試作の中で新しい要望を言う——それは GoodIdea が目指す形です。いま公開している映像には、その操作はまだありません。",

    trustScope:
      "現在公開しているのは、この固定の事例とその画面実装です。実際のワークスペースはまだ公開しておらず、このページはバックエンドに接続せず、実際に何かを生成することも、coding agent に一式を送ることもありません。",
    trustLink: "Demo のソースを見る",
    trustLinkHref: REPO,

    closingEyebrow: "次にできること",
    closingTitle: "一文から始めて、初版がどうなるか見てみる。",
    closingText: "{seconds} 秒で全体を見るか、残ったものだけ読むか。",
    closingPrimary: "アイデアが形になる過程を見る",
    closingSecondary: "成果物を読む / ダウンロード",

    footer: "公開 Demo と共通 UI の実装 · English / 日本語 / 简体中文",

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
  },
};
