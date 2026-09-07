/* Every word of the walkthrough, in the three languages the site ships.
 *
 * One story is told here — a freelancer sorting a client's change requests — and it
 * is the only story the landing page tells. The scene order, the timings and the
 * layouts live in `storyScript.ts`; the map layout lives in `storyMap.ts`. This file
 * is language only, written in each language rather than translated line by line.
 *
 * Nothing here is generated at runtime: the prototype, the scope, the handoff and
 * the closing are fixed sample content, and the copy says so where a visitor could
 * otherwise think something real was produced.
 */

import type { NodeText } from "../../../../shared/studio/types";

export type StoryLocale = "en" | "ja" | "zh-CN";

/** The scenes, in order. The script and the copy are keyed by the same ids. */
export type SceneId =
  | "idea"
  | "experience"
  | "pain"
  | "spark"
  | "flow"
  | "protoOpen"
  | "protoTrace"
  | "protoCheck"
  | "protoClient"
  | "askScope"
  | "wantIt"
  | "directions"
  | "scope"
  | "handoff"
  | "agentTasks"
  | "outcome"
  | "receipt"
  | "possibilities"
  | "closing";

export type StoryTurn = {
  /** The visitor's line, typed into the demo field before it is sent. */
  user?: string;
  agent?: string[];
  /** The one visible change this turn paid out, shown in the thread and on the pane. */
  change?: string;
};

/** One tidied change request, with the sentence the client actually wrote. */
export type ProtoItem = {
  id: string;
  text: string;
  quote: string;
  at: string;
  /** The designer's own note. Never included in the client view. */
  note?: string;
  needsClient: boolean;
};

export type DirectionId = "explore" | "commit" | "park";

export type StoryCopy = {
  chapters: { label: string; point: string }[];
  turns: Record<SceneId, StoryTurn>;
  nodes: Record<string, NodeText>;
  proto: {
    kicker: string;
    note: string;
    project: string;
    designerView: string;
    clientView: string;
    rawLabel: string;
    rawPlaceholder: string;
    raw: string;
    splitAction: string;
    splitNote: string;
    itemsLabel: string;
    empty: string;
    quoteLabel: string;
    noteLabel: string;
    needsClient: string;
    itemText: string;
    send: string;
    sent: string;
    backToDesigner: string;
    clientLead: string;
    clientNote: string;
    confirm: string;
    reject: string;
    confirmed: string;
    rejected: string;
    needsReview: string;
    onlyPending: string;
    progress: string;
    items: ProtoItem[];
    /** The line the designer fixes while checking, in the watched run. */
    corrected: { id: string; text: string };
    exploreCta: string;
    exploreHint: string;
    exploreNote: string;
  };
  decide: {
    lead: string;
    options: { id: DirectionId; label: string; text: string }[];
    feedbackTitle: Record<DirectionId, string>;
    feedback: Record<DirectionId, string[]>;
    back: string;
    chosen: string;
  };
  scope: {
    title: string;
    lead: string;
    doing: string;
    notDoing: string;
    done: string;
    open: string;
    items: { text: string; from: string }[];
    notItems: string[];
    doneItems: string[];
    openItems: string[];
  };
  handoff: {
    title: string;
    lead: string;
    blocks: { label: string; items: string[] }[];
    download: string;
    downloadNote: string;
    agentTitle: string;
    agentNote: string;
    tasks: { text: string; from: string }[];
  };
  outcome: {
    title: string;
    lead: string;
    phoneLead: string;
    backLead: string;
    backLine: string;
    note: string;
  };
  open: {
    lead: string;
    items: { label: string; text: string }[];
    question: string;
    questionNote: string;
    replay: string;
    seeOutcome: string;
    seeBrief: string;
    repo: string;
  };
  ui: {
    mapTitle: string;
    mapWatch: string;
    mapTab: string;
    protoTab: string;
    threadTab: string;
    close: string;
    changeLead: string;
    conversationLabel: string;
    composeWatch: string;
    composeTyping: string;
    composeSending: string;
    fixedNote: string;
    exploring: string;
    exploreEnter: string;
    exploreLeave: string;
    exploreKept: string;
    earlierTurns: string;
  };
};

/* ---------------------------------- 中文 ---------------------------------- */

const zh: StoryCopy = {
  chapters: [
    { label: "说出困扰", point: "从最近一个真实项目开始" },
    { label: "想法成形", point: "散落的信息收拢成一条流程" },
    { label: "看见原型", point: "流程变成可以点的东西" },
    { label: "想用起来", point: "一句新要求，画面立刻不一样" },
    { label: "定下第一版", point: "选定方向，写清边界与验收" },
    { label: "交出去", point: "同一份材料交给 coding agent" },
    { label: "做成之后", point: "回到客户确认那一条" },
  ],
  turns: {
    idea: {
      user: "我想做一个自由职业者的工作台，把客户沟通、项目、报价这些放在一个地方。",
      agent: ["先不急着定功能。说说你最近做完的一个项目——哪一段最耗时间？"],
    },
    experience: {
      user: "上周那个品牌网站。客户的意见全在聊天里，我改完他又加一条，最后我自己也说不清改到哪了。",
      agent: [
        "先把你说的几件事放这儿：客户沟通、项目进度、报价收款。",
        "但你刚才真正花时间的，只有最上面那一件。",
      ],
      change: "记下三件事，和上周那个品牌网站",
    },
    pain: {
      user: "最烦的是他说「上次说的那个再改一下」，我得往回翻半小时。",
      agent: [
        "所以难的不是把项目管起来。",
        "是修改意见没有出处，也没有状态——哪些是新提的，哪些已经确认过。",
      ],
      change: "问题写清楚了：修改意见没有出处，也没有状态",
    },
    spark: {
      user: "如果客户能自己确认一下就好了，省得我一条条回去问。",
      agent: [
        "那就顺着这句想：把他的原话关联到每一条修改项，再给他一个只需要点确认的页面。",
        "原话留在你这边，他那边只做确认。",
      ],
      change: "产品的样子出现了：原话 → 修改项 → 客户确认",
    },
    flow: {
      agent: ["这样就是一条流程了，四步。"],
      change: "零散的想法收拢成一条可以走完的流程",
    },
    protoOpen: {
      agent: ["按这条流程，大概是这个样子。就拿上周那个品牌网站当样本。"],
      change: "流程变成了一个可以点开看的原型",
    },
    protoTrace: {
      agent: ["每一条修改项都还挂着他的原话和时间。点开就知道这条是从哪来的。"],
    },
    protoCheck: {
      agent: [
        "你先自己过一遍：写歪的直接改掉，不需要客户确认的就不发过去。",
        "「上次说的那个」这条，被对上了三月四日那次留言。",
      ],
      change: "第二条改成了具体的说法，第四条不用发给客户",
    },
    protoClient: {
      agent: ["客户那边打开是这一页：三条修改，逐条确认，不用登录你的后台。"],
      change: "同一份修改项，客户看到的是另一面",
    },
    askScope: {
      user: "客户这页再简洁一点吧，原话和时间也收起来，只看要确认的修改。",
      agent: ["改好了。三条修改一眼就能看完；原话、时间和你的备注都留在工作台。"],
      change: "客户页收起原话和时间，三条修改成为主角",
    },
    wantIt: {
      user: "这个我下个项目就想用。第一版得做多少？",
      agent: ["比你以为的少。先看你现在有哪几条路。"],
    },
    directions: {
      agent: ["三条路都成立，区别是你接下来把时间花在哪。"],
    },
    scope: {
      user: "就先做这条流程。手动贴留言就行，报价和收款以后再说。",
      agent: [
        "那就定第一版：把这一条流程完整跑通，别的都先不做。",
        "范围、不做的事和验收条件，都是从前面这些对话里来的。",
      ],
      change: "第一版的边界定下来了",
    },
    handoff: {
      user: "这个我想开始做了。把原型和这些决定一起交给 coding agent 吧。",
      agent: ["这些一起打包：要解决什么、这个原型、第一版的边界、还有怎么算做对了。"],
    },
    agentTasks: {
      agent: ["coding agent 拿到的是同一份东西，展开成几件能对回去的活。"],
      change: "每条任务都能追回到前面的某个决定",
    },
    outcome: {
      agent: ["想象下一个项目里，客户在手机上打开同一张确认单。"],
    },
    receipt: {
      agent: ["客户确认了首页主图。项目里的同一条修改，也有了回音。"],
      change: "客户确认 → 项目状态更新",
    },
    possibilities: {
      agent: ["同样的走法，换个想法也成立。"],
    },
    closing: {
      agent: ["剩下的这一段，是你的。"],
    },
  },
  nodes: {
    seed: { caption: "最初的想法", text: "一个自由职业者的工作台：客户沟通、项目、报价都在一起" },
    fragTalk: { text: "客户沟通" },
    fragProject: { text: "项目进度" },
    fragQuote: { text: "报价与收款" },
    fragTalkNow: { caption: "花时间最多的", text: "客户沟通" },
    parked: { caption: "以后再说", text: "报价、收款、完整项目管理", note: "先放到一边" },
    who: { caption: "谁", text: "一个人接单的设计师" },
    when: { caption: "什么时候", text: "项目做到一半，客户开始提修改" },
    problem: { caption: "哪里不对", text: "修改意见散在聊天里，边改边加" },
    pain: { caption: "具体的一次", text: "「上次说的那个再改一下」——往回翻半小时" },
    outcome: { caption: "想变成什么样", text: "每条修改都有出处，也有状态" },
    shape: {
      caption: "产品怎么帮助",
      text: "把客户原话关联到修改项，再给客户一个只需确认的页面",
    },
    flow1: { caption: "第一步", text: "把聊天里的留言粘进来" },
    flow2: { caption: "第二步", text: "整理成修改项，你自己校对一遍" },
    flow3: { caption: "第三步", text: "客户逐项确认" },
    flow4: { caption: "第四步", text: "回头看每条改到哪一步" },
  },
  proto: {
    kicker: "概念原型",
    note: "固定示例 · 页面不连后端，也不调用模型",
    project: "远山茶室 · 品牌网站改版",
    designerView: "我这边",
    clientView: "客户看到的",
    rawLabel: "客户留言（从聊天里粘进来）",
    rawPlaceholder: "把客户在聊天里说的话粘到这里…",
    raw: "首页那个大图能不能换一张？现在这张太暗了。\n上次说的那个字体再改一下，标题看着还是有点飘。\n另外产品页想加一个「预约到店」的按钮，位置你看着放。\n哦对，之前提的价格表先不用动了。",
    splitAction: "整理成修改项",
    splitNote: "示例里按换行和句号切分，不调用模型；真实产品里这一步才需要理解上下文。",
    itemsLabel: "修改项",
    empty: "还没有修改项。粘一段留言，再点上面那个按钮。",
    quoteLabel: "客户原话",
    noteLabel: "我的备注",
    needsClient: "需要客户确认",
    itemText: "修改项文字",
    send: "发给客户确认",
    sent: "已发出 · 客户打开的是同一份",
    backToDesigner: "回到我这边",
    clientLead: "请逐条确认下面的修改",
    clientNote: "确认后设计师才会动手，不用注册，也看不到别的项目。",
    confirm: "确认",
    reject: "还要改",
    confirmed: "已确认",
    rejected: "还要改",
    onlyPending: "精简展示：隐藏原话和时间",
    needsReview: "待确认",
    progress: "已确认 {done} / {total}",
    items: [
      {
        id: "i1",
        text: "首页主图换一张更亮的",
        quote: "首页那个大图能不能换一张？现在这张太暗了。",
        at: "周二 10:12",
        needsClient: true,
      },
      {
        id: "i2",
        text: "标题字体再改一下",
        quote: "上次说的那个字体再改一下，标题看着还是有点飘。",
        at: "周二 10:13",
        note: "「上次说的那个」= 3 月 4 日提过的标题字重",
        needsClient: true,
      },
      {
        id: "i3",
        text: "产品页加「预约到店」按钮",
        quote: "另外产品页想加一个「预约到店」的按钮，位置你看着放。",
        at: "周二 10:15",
        note: "要加工时，报价单得动",
        needsClient: true,
      },
      {
        id: "i4",
        text: "价格表这次不动",
        quote: "哦对，之前提的价格表先不用动了。",
        at: "周二 10:16",
        needsClient: false,
      },
    ],
    corrected: { id: "i2", text: "标题字重调重一档（3 月 4 日提过的那次）" },
    exploreCta: "暂停播放，自己试一下",
    exploreHint: "你在自己试。播放已经停住，改动都留着。",
    exploreNote: "这是概念原型：粘留言、整理、确认都在你自己的浏览器里，不发到任何地方。",
  },
  decide: {
    lead: "接下来",
    options: [
      { id: "explore", label: "继续探索", text: "先不定范围，再想想还能怎么做。" },
      { id: "commit", label: "确定第一版", text: "定下先做哪一条，其余的往后放。" },
      { id: "park", label: "暂时搁置", text: "这次先不做，把已经想清楚的留着。" },
    ],
    feedbackTitle: {
      explore: "那接下来要弄清楚这几件事",
      commit: "那就把第一版定下来",
      park: "先搁置。这些会留着",
    },
    feedback: {
      explore: [
        "客户愿不愿意点开一个不用登录的页面",
        "「上次说的那个」这类话，人工对上去要花多久",
        "确认之后的改动，还需不需要再走一轮",
      ],
      commit: [
        "第一版只保证一条完整流程：粘留言 → 整理校对 → 客户确认 → 回看状态。",
        "邮件同步、报价、收款、完整项目管理都不进这一版。",
      ],
      park: [
        "这个概念原型和它的四步流程",
        "上周那个项目整理出来的修改项样本",
        "已经写下来的问题：修改意见没有出处，也没有状态",
      ],
    },
    back: "回到刚才的画面",
    chosen: "已选：确定第一版",
  },
  scope: {
    title: "第一版",
    lead: "范围、不做的事和验收条件，都能在前面的对话里找到出处。",
    doing: "这一版做什么",
    notDoing: "这一版不做",
    done: "怎么算做对了",
    open: "还需要验证",
    items: [
      { text: "把聊天里的留言手动粘进来", from: "来自：意见全在聊天里" },
      { text: "整理成修改项，每条挂着原话和时间", from: "来自：「上次说的那个」" },
      { text: "自己校对一遍，改错的直接改", from: "来自：整理不一定对" },
      { text: "客户逐项确认，不用注册", from: "来自：省得一条条回去问" },
      { text: "回头能看到每条改到哪一步", from: "来自：说不清改到哪了" },
    ],
    notItems: [
      "邮件、微信自动同步",
      "报价与收款",
      "完整的项目管理",
      "多人协作与团队权限",
    ],
    doneItems: [
      "一个真实项目的留言，能从粘贴走到全部确认",
      "每条修改项都能点回它的原话和时间",
      "客户不注册也能确认，确认结果回到项目里",
    ],
    openItems: [
      "客户愿不愿意点开这样一个页面",
      "人工校对一次要花多久才算划算",
    ],
  },
  handoff: {
    title: "交接包",
    lead: "画面上的这份，就是交出去的那份。",
    blocks: [
      {
        label: "要解决什么",
        items: ["一个人接单的设计师，改到一半时说不清哪些意见是新的、哪些已经确认过。"],
      },
      {
        label: "概念原型",
        items: ["同一份修改项的两面：我这边校对，客户那边逐项确认。"],
      },
      {
        label: "第一版边界",
        items: ["只做一条完整流程；邮件同步、报价、收款、项目管理都不做。"],
      },
      {
        label: "验收条件",
        items: ["一个真实项目的留言，从粘贴走到全部确认，每条都能点回原话。"],
      },
    ],
    download: "下载这份交接包（Markdown）",
    downloadNote: "内容与画面一致，是示例产品定义，不是可运行的代码。",
    agentTitle: "coding agent 收到之后",
    agentNote: "这里是概念预览：真实的实现过程不在这个页面里发生。",
    tasks: [
      { text: "留言粘贴框与本地切分", from: "第一版：手动粘进来" },
      { text: "修改项数据结构：文字、原话、时间、状态", from: "验收：能点回原话" },
      { text: "校对界面：改文字、标记是否需要确认", from: "第一版：自己校对一遍" },
      { text: "客户确认页：免注册链接、逐项确认", from: "第一版：客户不用注册" },
      { text: "确认结果回写与状态视图", from: "验收：确认结果回到项目里" },
    ],
  },
  outcome: {
    title: "下一个项目的一个下午",
    lead: "同一张确认单，从原型走向未来的使用情境。",
    phoneLead: "客户在手机上打开链接",
    backLead: "你这边",
    backLine: "首页主图那条，客户自己确认了。",
    note: "未来使用情境 · 概念演示",
  },
  open: {
    lead: "也可以是别的",
    items: [
      { label: "自己的小工具", text: "只解决你一个人每天都会碰到的那件事" },
      { label: "新的工作方式", text: "把一段来回沟通，变成一页可以确认的东西" },
      { label: "一门小生意", text: "先给同行用，收一点钱，再看要不要做大" },
    ],
    question: "你一直想做出来的，是什么？",
    questionNote: "这个页面还不能替你开始——它只放了刚才那一整段是怎么走的。",
    replay: "从头再看一遍",
    seeOutcome: "回看成果那一段",
    seeBrief: "看这一页产出示例",
    repo: "看 Demo 源码",
  },
  ui: {
    mapTitle: "想法地图",
    mapWatch: "跟着对话长出来的产品轮廓",
    mapTab: "想法地图",
    protoTab: "原型",
    threadTab: "对话",
    close: "关闭",
    changeLead: "变化",
    conversationLabel: "与 GoodIdea 的对话",
    composeWatch: "只读演示 · 模拟输入",
    composeTyping: "模拟输入中…",
    composeSending: "准备发送",
    fixedNote: "固定示例 · 不调用真实模型",
    exploring: "自己探索中",
    exploreEnter: "自己探索",
    exploreLeave: "回到播放",
    exploreKept: "你试过的内容会留着。",
    earlierTurns: "前面的对话 · {count} 条",
  },
};

/* --------------------------------- English -------------------------------- */

const en: StoryCopy = {
  chapters: [
    { label: "The real problem", point: "Start from one project that actually happened" },
    { label: "It takes shape", point: "Scattered notes become one working flow" },
    { label: "See the prototype", point: "The flow turns into something you can click" },
    { label: "Wanting it", point: "One new request, and the screen changes" },
    { label: "Version one", point: "Pick a direction, fix the edges and the checks" },
    { label: "Hand it over", point: "The same package goes to a coding agent" },
    { label: "After it is built", point: "Back to that one confirmed change" },
  ],
  turns: {
    idea: {
      user: "I want to build a workspace for freelancers — client messages, projects and quotes in one place.",
      agent: ["Before we pick features: think of a project you just finished. Which part ate the most time?"],
    },
    experience: {
      user: "The brand site last week. Every change request was buried in chat, and he kept adding more while I worked.",
      agent: [
        "Let me put the three things you named here: client messages, project status, quotes and payment.",
        "Only the first one actually cost you time.",
      ],
      change: "Three threads noted, plus last week's brand site",
    },
    pain: {
      user: "The worst part is “change that thing we talked about last time.” I scroll back half an hour to find it.",
      agent: [
        "So the hard part is not managing the project.",
        "It is that a change request has no source and no status — which ones are new, which ones he already signed off.",
      ],
      change: "The problem is written down: no source, no status",
    },
    spark: {
      user: "It would help if the client could just confirm them himself instead of me asking one by one.",
      agent: [
        "Then follow that: attach his own words to each change, and give him a page where the only thing to do is confirm.",
        "You keep the source. He only confirms.",
      ],
      change: "A shape appears: his words → change items → client confirms",
    },
    flow: {
      agent: ["That is a flow now. Four steps."],
      change: "Loose notes collapse into one flow you can walk end to end",
    },
    protoOpen: {
      agent: ["Following that flow, it looks roughly like this — using last week's brand site as the sample."],
      change: "The flow becomes a prototype you can open",
    },
    protoTrace: {
      agent: ["Every change still carries what he wrote and when. Open one and you can see where it came from."],
    },
    protoCheck: {
      agent: [
        "You check it first: fix anything worded wrong, and leave out what the client does not need to confirm.",
        "“That thing from last time” got matched to the message from 4 March.",
      ],
      change: "The second item is now specific; the fourth is not sent to the client",
    },
    protoClient: {
      agent: ["What the client opens is this page: three changes, confirmed one at a time, no account needed."],
      change: "The same change list, seen from the client's side",
    },
    askScope: {
      user: "Can that page be simpler? Hide the source messages and times; just show the changes to confirm.",
      agent: ["Done. Three clear changes. The original messages, times and your private notes stay in your workspace."],
      change: "Source messages and times move aside; the three changes take the focus",
    },
    wantIt: {
      user: "I would use this on my next project. How much is version one?",
      agent: ["Less than you think. Here are the three roads you are actually on."],
    },
    directions: {
      agent: ["All three are real. The difference is where your next week goes."],
    },
    scope: {
      user: "Start with this flow. Pasting messages is fine. Quotes and payments can wait.",
      agent: [
        "Then version one is this: get that one flow working end to end, and nothing else.",
        "The scope, the non-goals and the checks all come out of what you just said.",
      ],
      change: "The edges of version one are fixed",
    },
    handoff: {
      user: "I want to build this. Give the prototype and these decisions to a coding agent.",
      agent: ["These go together: what it solves, this prototype, the edges of version one, and what counts as done."],
    },
    agentTasks: {
      agent: ["The coding agent gets the same package, opened out into work you can trace back."],
      change: "Every task points back at a decision you made",
    },
    outcome: {
      agent: ["Imagine your next client opening this same confirmation page on their phone."],
    },
    receipt: {
      agent: ["The client confirms the homepage image. The same change updates in your project."],
      change: "Client confirmation → project status updated",
    },
    possibilities: {
      agent: ["The same walk works on a different idea."],
    },
    closing: {
      agent: ["The rest of this one is yours."],
    },
  },
  nodes: {
    seed: { caption: "The first sentence", text: "A freelancer workspace: messages, projects and quotes together" },
    fragTalk: { text: "Client messages" },
    fragProject: { text: "Project status" },
    fragQuote: { text: "Quotes and payment" },
    fragTalkNow: { caption: "Where the time went", text: "Client messages" },
    parked: { caption: "Later", text: "Quotes, payment, full project management", note: "Parked for now" },
    who: { caption: "Who", text: "A designer taking jobs alone" },
    when: { caption: "When", text: "Mid-project, once the client starts asking for changes" },
    problem: { caption: "What is wrong", text: "Change requests live in chat and keep arriving" },
    pain: { caption: "One real instance", text: "“Change that thing from last time” — half an hour of scrolling" },
    outcome: { caption: "What it should become", text: "Every change has a source and a status" },
    shape: {
      caption: "How the product helps",
      text: "Attach the client's own words to each change, then give him a page that only asks him to confirm",
    },
    flow1: { caption: "Step one", text: "Paste the messages out of the chat" },
    flow2: { caption: "Step two", text: "Turn them into change items and check them yourself" },
    flow3: { caption: "Step three", text: "The client confirms them one by one" },
    flow4: { caption: "Step four", text: "Look back and see where each one stands" },
  },
  proto: {
    kicker: "Concept prototype",
    note: "Fixed sample · no backend, no model call",
    project: "Farhill Tea House · brand site refresh",
    designerView: "My side",
    clientView: "What the client sees",
    rawLabel: "Client messages (pasted from chat)",
    rawPlaceholder: "Paste what the client wrote in chat…",
    raw: "Can we swap the big image on the home page? The current one is too dark.\nThat font from last time needs another pass — the headings still feel loose.\nAlso, the product page should get a “book a visit” button, wherever you think it fits.\nOh, and leave the price table alone this time.",
    splitAction: "Turn into change items",
    splitNote: "In this sample the split is done locally on line breaks and full stops — no model. In the real product this is the step that has to understand context.",
    itemsLabel: "Change items",
    empty: "No change items yet. Paste a message and press the button above.",
    quoteLabel: "What the client wrote",
    noteLabel: "My note",
    needsClient: "Needs the client to confirm",
    itemText: "Change item",
    send: "Send for confirmation",
    sent: "Sent · the client opens the same list",
    backToDesigner: "Back to my side",
    clientLead: "Please confirm each change below",
    clientNote: "Nothing is worked on until you confirm. No account, and no view of other projects.",
    confirm: "Confirm",
    reject: "Not yet",
    confirmed: "Confirmed",
    rejected: "Not yet",
    onlyPending: "Compact view: hide sources and times",
    needsReview: "Needs confirmation",
    progress: "{done} of {total} confirmed",
    items: [
      {
        id: "i1",
        text: "Brighter hero image on the home page",
        quote: "Can we swap the big image on the home page? The current one is too dark.",
        at: "Tue 10:12",
        needsClient: true,
      },
      {
        id: "i2",
        text: "Another pass on the heading font",
        quote: "That font from last time needs another pass — the headings still feel loose.",
        at: "Tue 10:13",
        note: "“From last time” = the heading weight raised on 4 March",
        needsClient: true,
      },
      {
        id: "i3",
        text: "Add a “book a visit” button to the product page",
        quote: "Also, the product page should get a “book a visit” button, wherever you think it fits.",
        at: "Tue 10:15",
        note: "Extra hours — the quote has to move",
        needsClient: true,
      },
      {
        id: "i4",
        text: "Leave the price table as it is",
        quote: "Oh, and leave the price table alone this time.",
        at: "Tue 10:16",
        needsClient: false,
      },
    ],
    corrected: { id: "i2", text: "Raise the heading weight one step (the 4 March note)" },
    exploreCta: "Pause and try this prototype",
    exploreHint: "You are driving it now. Playback is stopped and your changes are kept.",
    exploreNote: "A concept prototype: pasting, sorting and confirming all happen in your own browser and are sent nowhere.",
  },
  decide: {
    lead: "What next",
    options: [
      { id: "explore", label: "Keep exploring", text: "Leave the scope open and look for other shapes." },
      { id: "commit", label: "Fix version one", text: "Decide what ships first and push the rest back." },
      { id: "park", label: "Park it for now", text: "Not this month — keep what has been worked out." },
    ],
    feedbackTitle: {
      explore: "Then these are the things to find out",
      commit: "Then version one gets written down",
      park: "Parked. This is what stays",
    },
    feedback: {
      explore: [
        "Whether a client will open a page that needs no account",
        "How long it takes a person to match “that thing from last time” by hand",
        "Whether a confirmed change needs a second round after it is done",
      ],
      commit: [
        "Version one guarantees one flow: paste, sort and check, client confirms, look back at the status.",
        "Mail sync, quotes, payment and full project management stay out.",
      ],
      park: [
        "This concept prototype and its four steps",
        "The change items sorted out of last week's project",
        "The problem already written down: no source, no status",
      ],
    },
    back: "Back to where we were",
    chosen: "Chosen: fix version one",
  },
  scope: {
    title: "Version one",
    lead: "Scope, non-goals and checks — each traceable to something said earlier.",
    doing: "This version does",
    notDoing: "This version does not",
    done: "Done means",
    open: "Still unverified",
    items: [
      { text: "Paste the chat messages in by hand", from: "From: it is all in chat" },
      { text: "Sort them into change items, each carrying the words and the time", from: "From: “that thing from last time”" },
      { text: "Check them yourself and fix what came out wrong", from: "From: sorting is not always right" },
      { text: "The client confirms each one without an account", from: "From: instead of asking one by one" },
      { text: "Look back and see where every change stands", from: "From: I could not say what had changed" },
    ],
    notItems: [
      "Automatic mail or chat sync",
      "Quotes and payment",
      "Full project management",
      "Team accounts and permissions",
    ],
    doneItems: [
      "One real project's messages go from paste to fully confirmed",
      "Every change item opens back to the words and the time it came from",
      "The client confirms without an account, and the result lands back in the project",
    ],
    openItems: [
      "Whether clients will open a page like this at all",
      "How long the manual check can take before it stops being worth it",
    ],
  },
  handoff: {
    title: "Handoff package",
    lead: "What is on screen is what gets handed over.",
    blocks: [
      {
        label: "What it solves",
        items: ["A designer working alone cannot say which change requests are new and which are already signed off."],
      },
      {
        label: "Concept prototype",
        items: ["Two sides of one change list: checked here, confirmed item by item there."],
      },
      {
        label: "Version-one edges",
        items: ["One flow only. No mail sync, no quotes, no payment, no project management."],
      },
      {
        label: "Acceptance",
        items: ["One real project's messages go from paste to fully confirmed, each item traceable to its source."],
      },
    ],
    download: "Download this package (Markdown)",
    downloadNote: "Same content as the screen: a sample product definition, not runnable code.",
    agentTitle: "What the coding agent does with it",
    agentNote: "A concept preview — the actual implementation does not happen on this page.",
    tasks: [
      { text: "Paste field and local splitting", from: "Version one: pasted by hand" },
      { text: "Change item model: text, source, time, status", from: "Acceptance: opens back to the source" },
      { text: "Review screen: edit wording, mark what needs confirming", from: "Version one: check it yourself" },
      { text: "Client page: account-free link, item-by-item confirm", from: "Version one: no account" },
      { text: "Write confirmations back and show the status", from: "Acceptance: the result lands in the project" },
    ],
  },
  outcome: {
    title: "An afternoon, two weeks later",
    lead: "The same confirmation list — this time in real use.",
    phoneLead: "The client opens the link on a phone",
    backLead: "Your side",
    backLine: "The hero image change came back confirmed.",
    note: "A fixed sample screen, not real user data.",
  },
  open: {
    lead: "It could also be",
    items: [
      { label: "A tool of your own", text: "Solving the one thing only you run into every day" },
      { label: "A different way of working", text: "Turning a week of back-and-forth into one page to confirm" },
      { label: "A small business", text: "Give it to people doing the same job, charge a little, then decide" },
    ],
    question: "What is the thing you have been meaning to build?",
    questionNote: "This page cannot start it for you yet. All it holds is how that walk went.",
    replay: "Watch it again",
    seeOutcome: "Back to the result",
    seeBrief: "See the example output",
    repo: "Read the demo source",
  },
  ui: {
    mapTitle: "Idea map",
    mapWatch: "The product shape, growing out of the conversation",
    mapTab: "Idea map",
    protoTab: "Prototype",
    threadTab: "Conversation",
    close: "Close",
    changeLead: "Changed",
    conversationLabel: "Conversation with GoodIdea",
    composeWatch: "Read-only · input simulated",
    composeTyping: "Simulated typing…",
    composeSending: "About to send",
    fixedNote: "Fixed example · no live model",
    exploring: "Exploring",
    exploreEnter: "Explore it yourself",
    exploreLeave: "Back to playback",
    exploreKept: "What you tried is kept.",
    earlierTurns: "Earlier in the conversation · {count}",
  },
};

/* --------------------------------- 日本語 --------------------------------- */

const ja: StoryCopy = {
  chapters: [
    { label: "困りごとを話す", point: "直近の実際の案件から始める" },
    { label: "形になる", point: "散らばった情報が一本の流れになる" },
    { label: "試作を見る", point: "流れが触れるものに変わる" },
    { label: "使いたくなる", point: "一言の要望で画面が変わる" },
    { label: "初版を決める", point: "方向を選び、範囲と条件を書く" },
    { label: "引き渡す", point: "同じ一式を coding agent へ" },
    { label: "できたあと", point: "あの確認の一件に戻る" },
  ],
  turns: {
    idea: {
      user: "フリーランス用の作業台を作りたいです。クライアントとのやり取り、案件、見積もりを一か所に。",
      agent: ["機能を決める前に。直近で終えた案件のうち、どこが一番時間を食いましたか。"],
    },
    experience: {
      user: "先週のブランドサイトです。修正の指示が全部チャットに埋もれていて、直している間にまた増える。",
      agent: [
        "挙げてもらった三つをここに置きます。やり取り、案件の進み、見積もりと入金。",
        "時間を取られていたのは、一番上の一つだけです。",
      ],
      change: "三つを記録。先週のブランドサイトも",
    },
    pain: {
      user: "一番きついのは「この前のあれ、もう一回直して」。三十分さかのぼって探すことになる。",
      agent: [
        "つまり難しいのは案件管理ではありません。",
        "修正の指示に出どころも状態もないことです。どれが新しくて、どれがもう確認済みなのか。",
      ],
      change: "問題が言葉になった：出どころも状態もない",
    },
    spark: {
      user: "クライアントが自分で確認してくれたら楽なんですけどね。一件ずつ聞き直さずに済む。",
      agent: [
        "その線で。相手の書いた言葉を各修正項目に紐づけて、確認するだけのページを渡す。",
        "出どころはこちらに残し、向こうは確認だけ。",
      ],
      change: "形が見えた：発言 → 修正項目 → 確認",
    },
    flow: {
      agent: ["これで一本の流れになりました。四段です。"],
      change: "ばらばらの話が、通しで歩ける流れに",
    },
    protoOpen: {
      agent: ["この流れなら、だいたいこうなります。先週のブランドサイトを見本に。"],
      change: "流れが、開いて触れる試作になった",
    },
    protoTrace: {
      agent: ["どの項目にも、相手の言葉と時刻がついたままです。開けば出どころが分かる。"],
    },
    protoCheck: {
      agent: [
        "まず自分で見直します。書き方がずれていれば直し、確認の要らないものは送らない。",
        "「この前のあれ」は、3 月 4 日のメッセージに突き合わせました。",
      ],
      change: "二件目が具体的な言い方に。四件目は送らない",
    },
    protoClient: {
      agent: ["相手が開くのはこのページです。三件を一件ずつ確認、ログインは要りません。"],
      change: "同じ修正項目を、相手の側から見ると",
    },
    askScope: {
      user: "確認ページをもっと簡潔に。原文と時刻も隠して、修正内容だけ見せたいです。",
      agent: ["直しました。三件がひと目で分かります。原文、時刻、自分用メモは仕事場に残します。"],
      change: "原文と時刻をしまい、三つの修正が主役に",
    },
    wantIt: {
      user: "これ、次の案件から使いたい。初版はどこまで作ればいいですか。",
      agent: ["思っているより少なくて済みます。まず今ある三つの道を。"],
    },
    directions: {
      agent: ["三つともあり得ます。違うのは、この先の時間をどこに使うかです。"],
    },
    scope: {
      user: "この流れから作ります。依頼は手で貼れれば十分。見積もりと決済は後で。",
      agent: [
        "では初版はこれです。この流れを通しで動かす、それだけ。",
        "範囲も、やらないことも、条件も、いま話したところから出ています。",
      ],
      change: "初版の輪郭が決まった",
    },
    handoff: {
      user: "作り始めたいです。試作品と決めた内容を coding agent に渡してください。",
      agent: ["まとめて渡します。何を解くのか、この試作、初版の境目、そして何をもって完了とするか。"],
    },
    agentTasks: {
      agent: ["coding agent が受け取るのは同じ一式で、たどれる作業に開かれます。"],
      change: "どの作業も、前のどれかの判断に戻れる",
    },
    outcome: {
      agent: ["次の案件で、お客さんが同じ確認ページをスマホで開く場面を想像してください。"],
    },
    receipt: {
      agent: ["メイン画像の修正が確認されました。案件の同じ項目にも結果が戻ります。"],
      change: "顧客の確認 → 案件の状態を更新",
    },
    possibilities: {
      agent: ["同じ歩き方は、別のアイデアでも成り立ちます。"],
    },
    closing: {
      agent: ["ここから先は、あなたのものです。"],
    },
  },
  nodes: {
    seed: { caption: "最初の一文", text: "フリーランスの作業台：やり取り、案件、見積もりを一か所に" },
    fragTalk: { text: "クライアントとのやり取り" },
    fragProject: { text: "案件の進み" },
    fragQuote: { text: "見積もりと入金" },
    fragTalkNow: { caption: "時間を取られている所", text: "クライアントとのやり取り" },
    parked: { caption: "あとで", text: "見積もり、入金、案件管理一式", note: "いったん脇に" },
    who: { caption: "誰の", text: "一人で受けているデザイナー" },
    when: { caption: "いつ", text: "案件の途中、修正が出はじめてから" },
    problem: { caption: "何が問題か", text: "修正の指示がチャットに散り、増え続ける" },
    pain: { caption: "実際にあった一件", text: "「この前のあれ」——三十分さかのぼる" },
    outcome: { caption: "どうなってほしいか", text: "どの修正にも出どころと状態がある" },
    shape: {
      caption: "製品はどう助けるか",
      text: "相手の言葉を修正項目に紐づけ、確認だけのページを渡す",
    },
    flow1: { caption: "一", text: "チャットの発言を貼り付ける" },
    flow2: { caption: "二", text: "修正項目に整理し、自分で見直す" },
    flow3: { caption: "三", text: "クライアントが一件ずつ確認する" },
    flow4: { caption: "四", text: "どこまで進んだか後から見る" },
  },
  proto: {
    kicker: "コンセプト試作",
    note: "固定の例 · バックエンドにもモデルにもつながっていません",
    project: "遠山茶寮 · ブランドサイト改修",
    designerView: "こちら側",
    clientView: "相手に見えるもの",
    rawLabel: "クライアントの発言（チャットから貼り付け）",
    rawPlaceholder: "チャットで言われたことをここに貼り付け…",
    raw: "トップの大きい画像、別のに差し替えられますか。今のは暗すぎる。\nこの前のあのフォント、もう一回直してほしい。見出しがまだ浮いて見える。\nあと製品ページに「来店予約」のボタンを足したい。位置はお任せで。\nああ、値段の表は今回そのままで。",
    splitAction: "修正項目に整理",
    splitNote: "この例では改行と句点でローカルに分けているだけで、モデルは呼びません。文脈の読み取りが要るのは、実際の製品でのこの段です。",
    itemsLabel: "修正項目",
    empty: "まだ項目がありません。発言を貼って、上のボタンを押してください。",
    quoteLabel: "相手の言葉",
    noteLabel: "自分のメモ",
    needsClient: "確認が必要",
    itemText: "修正項目",
    send: "確認を依頼する",
    sent: "送信済み · 相手も同じ一覧を開きます",
    backToDesigner: "こちら側に戻る",
    clientLead: "以下の修正を一件ずつご確認ください",
    clientNote: "確認いただくまで着手しません。登録は不要で、他の案件は見えません。",
    confirm: "確認",
    reject: "まだ直したい",
    confirmed: "確認済み",
    rejected: "まだ直したい",
    onlyPending: "原文と時刻を隠して簡潔に表示",
    needsReview: "確認待ち",
    progress: "{total} 件中 {done} 件確認済み",
    items: [
      {
        id: "i1",
        text: "トップの主画像を明るいものに差し替え",
        quote: "トップの大きい画像、別のに差し替えられますか。今のは暗すぎる。",
        at: "火 10:12",
        needsClient: true,
      },
      {
        id: "i2",
        text: "見出しフォントをもう一度調整",
        quote: "この前のあのフォント、もう一回直してほしい。見出しがまだ浮いて見える。",
        at: "火 10:13",
        note: "「この前のあれ」= 3 月 4 日に出た見出しの字送り",
        needsClient: true,
      },
      {
        id: "i3",
        text: "製品ページに「来店予約」ボタンを追加",
        quote: "あと製品ページに「来店予約」のボタンを足したい。位置はお任せで。",
        at: "火 10:15",
        note: "工数が増える。見積もりを動かす必要あり",
        needsClient: true,
      },
      {
        id: "i4",
        text: "値段の表は今回そのまま",
        quote: "ああ、値段の表は今回そのままで。",
        at: "火 10:16",
        needsClient: false,
      },
    ],
    corrected: { id: "i2", text: "見出しのウェイトを一段上げる（3 月 4 日の件）" },
    exploreCta: "再生を止めて自分で触る",
    exploreHint: "いま自分で操作しています。再生は止まり、触った内容は残ります。",
    exploreNote: "コンセプト試作です。貼り付けも整理も確認も、あなたのブラウザの中だけで、どこにも送られません。",
  },
  decide: {
    lead: "この先",
    options: [
      { id: "explore", label: "もう少し探る", text: "範囲を決めず、他の形も見てみる。" },
      { id: "commit", label: "初版を決める", text: "先に作る一本を決め、残りは後ろへ。" },
      { id: "park", label: "いったん置く", text: "今回は作らず、分かったことは残す。" },
    ],
    feedbackTitle: {
      explore: "では、確かめることはこの三つ",
      commit: "では、初版を書き出します",
      park: "保留にします。残るのはこれ",
    },
    feedback: {
      explore: [
        "登録の要らないページを、クライアントが開いてくれるか",
        "「この前のあれ」を人が突き合わせるのに、どれだけかかるか",
        "確認した修正に、もう一往復が要るかどうか",
      ],
      commit: [
        "初版が保証するのは一本の流れだけ：貼る → 整理して見直す → 相手が確認 → 状態を見返す。",
        "メール同期、見積もり、入金、案件管理一式は入れません。",
      ],
      park: [
        "このコンセプト試作と、四段の流れ",
        "先週の案件から整理した修正項目の見本",
        "すでに書き出した問題：出どころも状態もない",
      ],
    },
    back: "さっきの画面に戻る",
    chosen: "選択：初版を決める",
  },
  scope: {
    title: "初版",
    lead: "範囲もやらないことも条件も、前の会話にたどれます。",
    doing: "この版でやること",
    notDoing: "この版でやらないこと",
    done: "できたと言える条件",
    open: "まだ検証していない",
    items: [
      { text: "チャットの発言を手で貼り付ける", from: "由来：全部チャットにある" },
      { text: "修正項目に整理し、各項目に言葉と時刻を残す", from: "由来：「この前のあれ」" },
      { text: "自分で見直し、ずれていれば直す", from: "由来：整理が正しいとは限らない" },
      { text: "クライアントが登録なしで一件ずつ確認する", from: "由来：一件ずつ聞き直さずに" },
      { text: "各修正がどこまで進んだか後から見る", from: "由来：何を直したか言えない" },
    ],
    notItems: [
      "メールやチャットの自動同期",
      "見積もりと入金",
      "案件管理一式",
      "複数人での共同作業と権限",
    ],
    doneItems: [
      "実際の案件の発言が、貼り付けから全件確認まで通る",
      "どの修正項目からも、元の言葉と時刻に戻れる",
      "登録なしで確認でき、その結果が案件に返る",
    ],
    openItems: [
      "そもそもクライアントがこのページを開くかどうか",
      "手で見直す時間が、どこまでなら見合うか",
    ],
  },
  handoff: {
    title: "引き渡し一式",
    lead: "画面にあるものが、そのまま渡すものです。",
    blocks: [
      {
        label: "何を解くか",
        items: ["一人で受けているデザイナーが、どの指示が新しくどれが確認済みかを言えない。"],
      },
      {
        label: "コンセプト試作",
        items: ["同じ修正一覧の両面：こちらで見直し、相手が一件ずつ確認する。"],
      },
      {
        label: "初版の境目",
        items: ["流れ一本だけ。メール同期、見積もり、入金、案件管理は入れない。"],
      },
      {
        label: "完了条件",
        items: ["実際の案件の発言が貼り付けから全件確認まで通り、各項目が出どころに戻れる。"],
      },
    ],
    download: "この一式をダウンロード（Markdown）",
    downloadNote: "画面と同じ内容です。製品定義の例であって、動くコードではありません。",
    agentTitle: "coding agent が受け取ったあと",
    agentNote: "ここはコンセプトの見取り図です。実装そのものはこのページでは起きません。",
    tasks: [
      { text: "貼り付け欄とローカルの分割", from: "初版：手で貼り付ける" },
      { text: "修正項目のデータ：本文・出どころ・時刻・状態", from: "条件：出どころに戻れる" },
      { text: "見直し画面：文言の修正、確認要否の指定", from: "初版：自分で見直す" },
      { text: "確認ページ：登録不要のリンク、一件ずつ確認", from: "初版：登録は不要" },
      { text: "確認結果の書き戻しと状態表示", from: "条件：結果が案件に返る" },
    ],
  },
  outcome: {
    title: "二週間後の午後",
    lead: "同じ確認一覧が、今度は実際に使われています。",
    phoneLead: "クライアントがスマホでリンクを開く",
    backLead: "こちら側",
    backLine: "トップ画像の一件、相手が自分で確認しました。",
    note: "固定の例の画面で、実データではありません。",
  },
  open: {
    lead: "別のものでもいい",
    items: [
      { label: "自分用の道具", text: "自分だけが毎日ぶつかる一つを解く" },
      { label: "新しい進め方", text: "何往復かのやり取りを、確認できる一枚に" },
      { label: "小さな商い", text: "同業に使ってもらい、少し受け取り、それから考える" },
    ],
    question: "ずっと作りたかったものは、何ですか。",
    questionNote: "このページはまだ、あなたの分を始められません。置いてあるのは、いまの一本の歩き方だけです。",
    replay: "もう一度最初から見る",
    seeOutcome: "できたあとを見返す",
    seeBrief: "成果物の例を見る",
    repo: "Demo のソースを見る",
  },
  ui: {
    mapTitle: "アイデアの地図",
    mapWatch: "会話から育っていく製品の輪郭",
    mapTab: "地図",
    protoTab: "試作",
    threadTab: "会話",
    close: "閉じる",
    changeLead: "変化",
    conversationLabel: "GoodIdea との会話",
    composeWatch: "読み取り専用 · 入力は再現",
    composeTyping: "入力を再現中…",
    composeSending: "送信直前",
    fixedNote: "固定の例 · 実モデルは呼びません",
    exploring: "自分で操作中",
    exploreEnter: "自分で触る",
    exploreLeave: "再生に戻る",
    exploreKept: "触った内容は残ります。",
    earlierTurns: "これまでの会話 · {count} 件",
  },
};

export const storyCopy: Record<StoryLocale, StoryCopy> = { "zh-CN": zh, en, ja };
