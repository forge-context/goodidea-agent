import type { StoryLocale } from "../story/storyCopy";

type FilmCopy = {
  label: string; concept: string; play: string; pause: string; replay: string;
  next: string; previous: string; progress: string; reduced: string;
  chapters: { name: string; title: string; caption: string; voice?: string }[];
  flow: string[]; sheet: string; source: string; client: string; private: string;
  included: string; later: string; extras: string[]; package: string[];
  ready: string; building: string; returned: string; outcomeNote: string;
  question: string; possibilities: string[]; explore: string; close: string;
  download: string; exploreIntro: string;
};

export const filmCopy: Record<StoryLocale, FilmCopy> = {
  "zh-CN": {
    label: "一个想法的 60 秒", concept: "概念动画 · 固定示例，非实时生成", play: "播放", pause: "暂停", replay: "重播",
    next: "下一幕", previous: "上一幕", progress: "播放进度", reduced: "减少动效已开启：逐幕查看",
    chapters: [
      { name: "一个困扰", title: "一个想法，常常从这里开始。", caption: "一个人接单的设计师，每次改稿都在翻聊天记录。", voice: "客户到底要改什么，我总怕漏掉。" },
      { name: "想法成形", title: "散乱的想法，开始有了形状。", caption: "聊清真正要解决的事：每条修改有出处，也有结果。" },
      { name: "看见原型", title: "等等，这已经像个产品了。", caption: "同一条客户原话，变成能校对、能确认的修改项。" },
      { name: "再向前一步", title: "越看得见，越想再往前一步。", caption: "原型跟着想法改变：内部信息退后，客户只看确认单。", voice: "客户只看要确认的部分，就好了。" },
      { name: "定下第一版", title: "现在，知道第一版要做什么了。", caption: "核心流程留下；更多想法留待以后，也可以继续探索或暂存。", voice: "就从这一版开始，我想用起来了。" },
      { name: "交给 coding agent", title: "把期待，变成可以开始的任务。", caption: "目的、原型、边界与验收一起交接。实现过程在这里抽象呈现。" },
      { name: "做成之后", title: "最初那个困扰，有了新的答案。", caption: "客户确认了一条修改，设计师看到状态更新。" },
      { name: "轮到你的想法", title: "下一个，会是你的什么想法？", caption: "从“好像可以”，到“我想把它做出来”。" },
    ],
    flow: ["保留原话", "整理修改", "逐项确认"], sheet: "客户修改确认单", source: "来自客户原话", client: "客户视图", private: "原话与内部备注 · 仅自己可见",
    included: "第一版 · 核心流程", later: "留待以后", extras: ["报价与收款", "完整项目管理", "自动同步聊天"], package: ["产品目的", "概念原型", "MVP 边界", "验收条件"],
    ready: "可以开始了", building: "构建下一步", returned: "项目状态已更新", outcomeNote: "未来使用情境 · 非已上线产品",
    question: "你的想法，也可以从这里开始。", possibilities: ["一个人的工具", "团队的新流程", "下一份事业"], explore: "亲手试试原型", close: "收起原型", download: "看看这份交接包", exploreIntro: "这是独立的本地概念原型。可以修改样例、预览客户确认，再回来重看故事；播放不会覆盖你的编辑。",
  },
  en: {
    label: "An idea, in 60 seconds", concept: "Concept film · scripted, not live generation", play: "Play", pause: "Pause", replay: "Replay",
    next: "Next scene", previous: "Previous scene", progress: "Playback progress", reduced: "Reduced motion: advance one scene at a time",
    chapters: [
      { name: "A frustration", title: "An idea often starts here.", caption: "A freelance designer, searching through chats before every revision.", voice: "I keep worrying I've missed a client's change." },
      { name: "Taking shape", title: "Loose thoughts find their shape.", caption: "Find the job that matters: every change has a source and a result." },
      { name: "A first prototype", title: "Wait. This feels like a product.", caption: "The same client message becomes a change you can review and confirm." },
      { name: "One step further", title: "Now you can see what comes next.", caption: "The prototype responds: internal details fade, the client's list stays.", voice: "Clients only need to see what they're confirming." },
      { name: "Version one", title: "You know where to begin.", caption: "Keep the core flow. Save the rest for later—or keep exploring, or pause.", voice: "Let's start here. I want to use this." },
      { name: "To a coding agent", title: "Give that excitement a starting point.", caption: "Purpose, prototype, scope and acceptance travel together. Implementation is abstracted here." },
      { name: "After it's built", title: "An answer to the thing that started it.", caption: "A client confirms a change. The designer sees the status update." },
      { name: "Your idea next", title: "What would you want to make?", caption: "From “this could work” to “I want to build this.”" },
    ],
    flow: ["Keep the source", "Organize changes", "Confirm each one"], sheet: "Client change sheet", source: "From the client's message", client: "Client view", private: "Sources & internal notes · only for you",
    included: "Version one · the core flow", later: "For later", extras: ["Quotes & payments", "Project management", "Chat integrations"], package: ["Purpose", "Prototype", "MVP scope", "Acceptance"],
    ready: "Ready to begin", building: "Building what comes next", returned: "Project status updated", outcomeNote: "Future use scenario · not a shipped product",
    question: "Your idea could start here, too.", possibilities: ["A tool for yourself", "A new team workflow", "Your next venture"], explore: "Try the prototype", close: "Close prototype", download: "See the handoff package", exploreIntro: "An independent, local concept prototype. Edit the sample, preview client confirmation, then return to the film. Playback keeps your edits intact.",
  },
  ja: {
    label: "あるアイデアの60秒", concept: "コンセプト映像 · 固定の例、リアルタイム生成ではありません", play: "再生", pause: "一時停止", replay: "もう一度",
    next: "次のシーン", previous: "前のシーン", progress: "再生位置", reduced: "視差効果を減らす設定：一場面ずつ見る",
    chapters: [
      { name: "小さな困りごと", title: "アイデアは、こんな瞬間から。", caption: "一人で受注するデザイナー。修正のたび、チャットをさかのぼる。", voice: "お客さんの修正、また見落としていないかな。" },
      { name: "形が見えてくる", title: "ばらばらの考えが、つながる。", caption: "本当に必要なことを整理する。修正の一つひとつに、出典と結果を。" },
      { name: "試作が見える", title: "これ、もう使ってみたい。", caption: "同じお客さんの言葉が、確認できる修正項目へと変わる。" },
      { name: "もう一歩先へ", title: "見えてくると、次が浮かぶ。", caption: "考えに合わせて試作も変わる。内部の情報は退き、確認リストが残る。", voice: "お客さんには、確認する項目だけ見せたい。" },
      { name: "初版を決める", title: "まず作るものが、はっきりする。", caption: "核となる流れを残す。他の案は後へ。探索を続けても、保留してもいい。", voice: "まずはこれを作ろう。自分で使いたい。" },
      { name: "Coding agent へ", title: "期待が、着手できる形になる。", caption: "目的・試作・範囲・受け入れ条件を一緒に渡す。実装は抽象表現です。" },
      { name: "できあがった先", title: "最初の困りごとに、新しい答え。", caption: "お客さんが修正を承認すると、デザイナー側の状態も更新される。" },
      { name: "次はあなたの番", title: "あなたは、何を作りたい？", caption: "「できるかも」から「作ってみたい」へ。" },
    ],
    flow: ["原文を残す", "修正を整理", "項目ごとに確認"], sheet: "お客さま修正確認リスト", source: "お客さまの原文から", client: "お客さま画面", private: "原文と内部メモ · 自分だけに表示",
    included: "初版 · 核となる流れ", later: "あとで考える", extras: ["見積もり・決済", "プロジェクト管理", "チャット自動同期"], package: ["製品の目的", "試作", "MVP の範囲", "受け入れ条件"],
    ready: "ここから始められる", building: "次の一歩をつくる", returned: "プロジェクトの状態を更新", outcomeNote: "将来の利用イメージ · 実装済み製品ではありません",
    question: "あなたのアイデアも、ここから。", possibilities: ["自分のための道具", "チームの新しい流れ", "次の事業"], explore: "試作を触ってみる", close: "試作を閉じる", download: "引き渡し資料を見る", exploreIntro: "独立したローカルのコンセプト試作です。例を編集し、お客さまの確認画面を試せます。映像の再生で編集内容は変わりません。",
  },
};
