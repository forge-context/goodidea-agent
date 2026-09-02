/* Every word the demo says, in the three languages the landing page ships.
 *
 * The storyboard structure lives in `ideaStudioFlow.ts`; this file only carries
 * language. The same product story is told three times, written in each language
 * rather than translated word for word, because a canvas node that reads as a
 * literal translation reads as a machine, which is exactly what this demo is not
 * trying to look like.
 */

import type { HintId, NodeStatus, StudioLocale } from "./ideaStudioFlow";

export type NodeCopy = {
  caption?: string;
  text: string;
  detail?: string[];
  note?: string;
};

export type PreviewCopy = { changed: string; added: string; open: string };

export type StudioCopy = {
  /** The sentence the visitor starts from. */
  idea: string;
  opening: string[];
  /** Said when the visitor keeps typing after the walkthrough is done. */
  closing: string[];
  ui: {
    railTitle: string;
    canvasTitle: string;
    fixedNote: string;
    restart: string;
    restarted: string;
    back: string;
    branchLead: string;
    placeholder: string;
    send: string;
    openNode: string;
    selectNode: string;
    selectedNode: string;
    canvasGuide: string;
    continueDiscuss: string;
    discussUser: string;
    discussReply: string[];
    editNode: string;
    saveEdit: string;
    cancelEdit: string;
    status: Record<NodeStatus, string>;
    exploreTab: string;
    mapTab: string;
    close: string;
    previewLead: string;
    previewChanged: string;
    previewAdded: string;
    previewOpen: string;
    merge: string;
    keepCandidate: string;
    discard: string;
    merged: string;
    candidateKept: string;
    discarded: string;
    optionsLabel: string;
    conversationLabel: string;
    canvasLabel: string;
    statusLabel: string;
  };
  stages: { id: string; label: string; hint: string }[];
  hints: Record<HintId, string>;
  nodes: Record<string, NodeCopy>;
  options: Record<string, string>;
  replies: Record<string, string[]>;
  branches: Record<
    string,
    {
      crumbs: string[];
      opening: string[];
      merged: string[];
      candidate: string[];
      discarded: string[];
      /** Said when the visitor keeps typing after this piece is settled. */
      more: string[];
      back: string[];
      backCandidate: string[];
      backKept: string[];
    }
  >;
  previews: Record<string, PreviewCopy>;
};

const zh: StudioCopy = {
  idea: "我想做一个自动帮普通投资者执行美股交易策略的 Agent。",
  opening: ["先不急着说怎么做。你最先想到的是，谁会需要它？"],
  closing: ["记下了。这段固定体验到这里就走完了，可以从头再走一次。"],
  ui: {
    railTitle: "探索",
    canvasTitle: "想法地图",
    fixedNote: "固定体验 · 不调用真实 Agent",
    restart: "重新开始",
    restarted: "回到最初的想法，可以重新走一遍。",
    back: "返回整体",
    branchLead: "现在只看这一块",
    placeholder: "也可以直接说你的想法…",
    send: "发送",
    openNode: "深入讨论",
    selectNode: "查看这张卡片",
    selectedNode: "已选中的想法",
    canvasGuide: "点一下查看；↗ 表示可以单独深入",
    continueDiscuss: "继续聊",
    discussUser: "我想继续聊聊「{node}」。",
    discussReply: ["可以。关于「{node}」，你想补充、改变，还是质疑哪一点？"],
    editNode: "改一下",
    saveEdit: "保存",
    cancelEdit: "取消",
    status: {
      fragment: "刚记下的片段",
      candidate: "候选，还没定",
      confirmed: "当前共识",
      unverified: "等待验证",
      changed: "暂时放下",
    },
    exploreTab: "探索",
    mapTab: "想法地图",
    close: "关闭",
    previewLead: "这一段聊完，想法会有这些变化",
    previewChanged: "改了",
    previewAdded: "加了",
    previewOpen: "还不确定",
    merge: "合入想法",
    keepCandidate: "保留为候选",
    discard: "这次不保留",
    merged: "已合入想法。",
    candidateKept: "已保留为候选，尚未改变当前结论。",
    discarded: "这次没有保留。",
    optionsLabel: "可以这样回答",
    conversationLabel: "与 GoodIdea 的对话",
    canvasLabel: "想法地图：跟着对话长出来的产品轮廓",
    statusLabel: "对话进展",
  },
  stages: [
    { id: "01", label: "理解想法", hint: "先把想法说清楚" },
    { id: "02", label: "找到用户", hint: "看看是谁、在什么时候遇到问题" },
    { id: "03", label: "明确价值", hint: "确认它到底改变了什么" },
    { id: "04", label: "形成产品", hint: "把产品的样子拼出来" },
    { id: "05", label: "确定第一版", hint: "决定第一步先做什么" },
  ],
  hints: {
    scene: "一个使用场景正在成形",
    shape: "产品的样子清楚了一些",
    updated: "想法已经更新",
    candidate: "新方向作为候选留在地图上",
    edited: "卡片已经更新",
  },
  nodes: {
    seed: { caption: "最初的想法", text: "一个自动帮普通投资者执行美股交易策略的 Agent" },
    whoHub: { text: "可能会用的人", note: "还只是猜测" },
    whoHubMerged: { text: "目标用户", note: "已经收敛到一类人" },
    fragA: { text: "有策略但不会写代码" },
    fragAAside: { text: "有策略但不会写代码", note: "先放到一边" },
    fragB: { text: "白天上班没法盯盘" },
    fragC: { text: "已经在用 TradingView" },
    earlyUserA: { caption: "最早期用户", text: "已经用 TradingView、写得出规则的人" },
    earlyUserB: { caption: "最早期用户", text: "有固定纪律、但完全不写代码的人" },
    who: { caption: "谁", text: "有明确策略的上班族" },
    when: { caption: "什么时候", text: "美股交易时段" },
    problem: { caption: "哪里不对", text: "条件到了没人执行，事后才发现" },
    scene: { text: "一个使用场景" },
    outcome: { caption: "想变成什么样", text: "不盯盘也能稳定执行已经定好的规则" },
    help: {
      caption: "产品怎么帮助",
      text: "替我守着规则，并且让我看得懂",
      detail: ["读懂已有规则", "解释每一次动作", "先模拟执行", "随时可以暂停"],
    },
    helpA: {
      caption: "产品怎么帮助",
      text: "替我守着规则，并且让我看得懂",
      detail: ["执行前先解释要做什么", "读懂已有规则", "先模拟执行", "随时可以暂停"],
      note: "第一版先保证第一条",
    },
    helpB: {
      caption: "产品怎么帮助",
      text: "替我守着规则，并且让我看得懂",
      detail: ["随时能停，并说明停在哪一步", "读懂已有规则", "解释每一次动作", "先模拟执行"],
      note: "第一版先保证第一条",
    },
    helpCandidateA: { caption: "候选优先级", text: "执行前先解释要做什么", note: "尚未合入产品定义" },
    helpCandidateB: { caption: "候选优先级", text: "随时能停，并说明停在哪里", note: "尚未合入产品定义" },
    feasible: { caption: "如何成立", text: "券商权限与模拟执行是否够用", note: "待验证" },
    feasibleA: { caption: "如何成立", text: "解释到什么程度算讲清楚", note: "待验证" },
    feasibleB: { caption: "如何成立", text: "停下来之后的状态怎么显示", note: "待验证" },
    firstStep: { caption: "第一步做什么", text: "让一个人把自己的规则完整跑完一次模拟执行" },
  },
  options: {
    s0a: "我想到几种人：有策略但不会写代码的、白天上班没法盯盘的、还有已经在用 TradingView 的。",
    s0b: "说实话我只想到「散户」，还没分得更细。",
    s1a: "白天要上班、没时间盯盘，但已经有明确策略的那种。",
    s1b: "会写一点代码、只是想省事的那种。",
    s2a: "开盘的时候我在开会，条件到了也没人执行，事后才发现。",
    s2b: "规则我记得住，但执行不稳定，情绪一上来就改了。",
    s3a: "不是帮我找更赚钱的策略，而是把我已经定好的规则可靠地执行掉。",
    s3b: "帮我盯着，条件到了先问我一句，别自己乱动。",
    s4a: "读懂我的规则、解释它要做什么、先模拟执行，我随时能停。",
    s4b: "先只做提醒，别自己下单。",
    s5a: "先聊聊到底谁会用。",
    s5b: "先说第一步做什么。",
    bp0a: "已经在用 TradingView、规则写得出来的那批人。",
    bp0b: "完全不写代码，但有固定纪律的人。",
    bh0a: "最重要的是执行之前先解释清楚，我要看得懂它在干什么。",
    bh0b: "最重要的是我随时能按停，并且知道停在哪一步。",
  },
  replies: {
    s0a: ["先都放在这儿。谁的情况，你说得最具体？"],
    s0b: ["那我先把你提过的几种场合摆出来，都还只是猜测。", "哪一类的情况，你说得最具体？"],
    s1a: ["那到了美股开盘的时候，通常是哪里不对？"],
    s1b: ["这类人自己也能写脚本，先放着。", "先按「有策略但盯不了盘」往下问：开盘的时候通常是哪里不对？"],
    s2a: ["那如果这件事真的被解决了，你希望变成什么样？"],
    s2b: ["那如果这件事真的被解决了，你希望变成什么样？"],
    s3a: ["那它具体要替你做哪几件事？"],
    s3b: ["那它具体要替你做哪几件事？"],
    s4a: ["现在整体有形状了。", "不过「可能会用的人」还是三个猜测。可以在地图里选中它，再决定要不要深入；也可以先说第一步。"],
    s4b: ["那模拟执行先留着，等你放心再打开。", "「可能会用的人」还是三个猜测。可以在地图里选中它，再决定要不要深入；也可以先说第一步。"],
    s5b: ["那就先让一个人把自己的规则完整跑完一次模拟执行，其余的都可以等。"],
  },
  branches: {
    people: {
      crumbs: ["产品整体", "目标用户", "最早期用户"],
      opening: ["只看这一块。三类人里，谁会最早真的用起来？"],
      merged: ["已经合到想法里了。回到整体看看？"],
      candidate: ["先作为候选留在地图上，不改变现在的目标用户。"],
      discarded: ["好，这次不保留，想法保持原样。"],
      more: ["这一块先聊到这里。回到整体，还可以继续往下走。"],
      back: ["回到整体。目标用户已经更新了。"],
      backCandidate: ["回到整体。新方向还只是候选，原来的结论没有变。"],
      backKept: ["回到整体。这次没有改动。"],
    },
    help: {
      crumbs: ["产品整体", "产品怎么帮助"],
      opening: ["只看这一块。它替你做的这几件事里，第一版最不能少的是哪一件？"],
      merged: ["已经合到想法里了。回到整体看看？"],
      candidate: ["先作为候选留在地图上，不改变现在的产品定义。"],
      discarded: ["好，这次不保留，想法保持原样。"],
      more: ["这一块先聊到这里。回到整体，还可以继续往下走。"],
      back: ["回到整体。产品要做的事已经排过序了。"],
      backCandidate: ["回到整体。新优先级还是候选，产品定义没有变。"],
      backKept: ["回到整体。这次没有改动。"],
    },
  },
  previews: {
    bp0a: {
      changed: "「可能会用的人」从三个猜测收敛成一类最早期用户。",
      added: "最早期用户：已经用 TradingView、写得出规则的人。",
      open: "他们是否愿意把写好的规则交给别的东西执行。",
    },
    bp0b: {
      changed: "「可能会用的人」从三个猜测收敛成一类最早期用户。",
      added: "最早期用户：有固定纪律、但完全不写代码的人。",
      open: "不写代码的人要怎么把规则说清楚，还没有答案。",
    },
    bh0a: {
      changed: "「产品怎么帮助」里，解释被排到了第一位。",
      added: "第一版先保证：执行之前先讲清楚要做什么。",
      open: "解释到什么程度算讲清楚，还没有人验证过。",
    },
    bh0b: {
      changed: "「产品怎么帮助」里，可中断被排到了第一位。",
      added: "第一版先保证：任何时候都能停，并且知道停在哪一步。",
      open: "停下来之后的状态怎么显示，还没有人验证过。",
    },
  },
};

const en: StudioCopy = {
  idea: "I want to build an agent that runs US-stock trading strategies for ordinary investors.",
  opening: ["Let's not jump to how it works yet. Who came to mind first — who would need this?"],
  closing: ["Noted. That is as far as this fixed walkthrough goes; you can start it over any time."],
  ui: {
    railTitle: "Where we are",
    canvasTitle: "Idea map",
    fixedNote: "Fixed walkthrough · no live agent",
    restart: "Start over",
    restarted: "Back to the first idea. Take it again from the top.",
    back: "Back to the whole idea",
    branchLead: "Looking at this one piece",
    placeholder: "Or just say it in your own words…",
    send: "Send",
    openNode: "Explore in depth",
    selectNode: "Inspect this card",
    selectedNode: "Selected idea",
    canvasGuide: "Select a card to act on it; ↗ can open a focused thread",
    continueDiscuss: "Keep talking",
    discussUser: "I want to keep talking about “{node}.”",
    discussReply: ["Sure. What about “{node}” do you want to add to, change, or challenge?"],
    editNode: "Edit",
    saveEdit: "Save",
    cancelEdit: "Cancel",
    status: {
      fragment: "Fresh fragment",
      candidate: "Candidate, not decided",
      confirmed: "Current decision",
      unverified: "Needs validation",
      changed: "Parked for now",
    },
    exploreTab: "Steps",
    mapTab: "Idea map",
    close: "Close",
    previewLead: "Finishing here would change the idea like this",
    previewChanged: "Changed",
    previewAdded: "Added",
    previewOpen: "Still open",
    merge: "Merge into the idea",
    keepCandidate: "Keep as a candidate",
    discard: "Do not keep this",
    merged: "Merged into the idea.",
    candidateKept: "Kept as a candidate; the current decision is unchanged.",
    discarded: "Not kept this time.",
    optionsLabel: "Ways to answer",
    conversationLabel: "Conversation with GoodIdea",
    canvasLabel: "Idea map: the product shape growing out of the conversation",
    statusLabel: "Conversation progress",
  },
  stages: [
    { id: "01", label: "Understand the idea", hint: "say the idea out loud first" },
    { id: "02", label: "Find the user", hint: "who hits this, and when" },
    { id: "03", label: "Name the value", hint: "what actually changes for them" },
    { id: "04", label: "Shape the product", hint: "put the pieces together" },
    { id: "05", label: "Decide version one", hint: "settle what comes first" },
  ],
  hints: {
    scene: "A real situation is taking shape",
    shape: "The product is getting clearer",
    updated: "The idea has been updated",
    candidate: "A new direction is staying on the map as a candidate",
    edited: "The card has been updated",
  },
  nodes: {
    seed: { caption: "The first idea", text: "An agent that runs US-stock strategies for ordinary investors" },
    whoHub: { text: "People who might use it", note: "still only a guess" },
    whoHubMerged: { text: "The user we mean", note: "narrowed to one kind" },
    fragA: { text: "has a strategy, can't code" },
    fragAAside: { text: "has a strategy, can't code", note: "parked for now" },
    fragB: { text: "at work all day, can't watch" },
    fragC: { text: "already on TradingView" },
    earlyUserA: { caption: "Earliest user", text: "People writing rules in TradingView" },
    earlyUserB: { caption: "Earliest user", text: "Disciplined traders who never touch code" },
    who: { caption: "Who", text: "A working person with a clear rule" },
    when: { caption: "When", text: "US market hours" },
    problem: { caption: "What goes wrong", text: "The condition hits and nobody acts" },
    scene: { text: "One real situation" },
    outcome: { caption: "What it should become", text: "It runs without me watching" },
    help: {
      caption: "How the product helps",
      text: "Hold the rule for me, and stay readable",
      detail: ["Read the rule I have", "Explain each action", "Simulate it first", "Stop when I say"],
    },
    helpA: {
      caption: "How the product helps",
      text: "Hold the rule for me, and stay readable",
      detail: ["Explain before acting", "Read the rule I have", "Simulate it first", "Stop when I say"],
      note: "version one guarantees the first line",
    },
    helpB: {
      caption: "How the product helps",
      text: "Hold the rule for me, and stay readable",
      detail: ["Stop anytime, show where", "Read the rule I have", "Explain each action", "Simulate it first"],
      note: "version one guarantees the first line",
    },
    helpCandidateA: {
      caption: "Candidate priority",
      text: "Explain what will happen before acting",
      note: "not merged into the product definition",
    },
    helpCandidateB: {
      caption: "Candidate priority",
      text: "Stop anytime and show exactly where",
      note: "not merged into the product definition",
    },
    feasible: { caption: "What has to hold", text: "Is broker access plus simulation enough", note: "unverified" },
    feasibleA: { caption: "What has to hold", text: "How much explaining is clear enough", note: "unverified" },
    feasibleB: { caption: "What has to hold", text: "What the screen shows after a stop", note: "unverified" },
    firstStep: { caption: "First step", text: "One person runs their own rule through a simulation" },
  },
  options: {
    s0a: "A few kinds of people: ones with a strategy but no code, ones stuck at work all day, ones already on TradingView.",
    s0b: "Honestly, just “retail investors”. I haven't split it up yet.",
    s1a: "The ones with a day job — no time to watch the market, but they already have a clear rule.",
    s1b: "The ones who can code a little and just want to save the trouble.",
    s2a: "I'm in a meeting at the open. The condition is met, nobody acts, and I find out afterwards.",
    s2b: "I remember the rule fine, but I don't follow it — emotion takes over.",
    s3a: "Not finding me a better strategy. Reliably running the rule I already decided on.",
    s3b: "Watch it for me, and ask me first when the condition hits. Don't act on its own.",
    s4a: "Read my rule, explain what it's about to do, run it in simulation, and let me stop it anytime.",
    s4b: "Just alert me for now. Don't place orders on its own.",
    s5a: "Let's talk about who would actually use it.",
    s5b: "Let's talk about the first step.",
    bp0a: "The ones already writing their rules in TradingView.",
    bp0b: "People with real discipline who never touch code.",
    bh0a: "Explaining first matters most — I have to see what it is about to do.",
    bh0b: "Being able to stop it matters most, and seeing where it stopped.",
  },
  replies: {
    s0a: ["Let's leave all three here. Whose situation can you describe most concretely?"],
    s0b: ["Then I'll put out the situations you have mentioned. All of them are still guesses.", "Which one can you describe most concretely?"],
    s1a: ["So when the market opens, what actually goes wrong?"],
    s1b: ["Those people can already write the script themselves, so let's park them.", "Staying with “has a rule but can't watch”: at the open, what goes wrong?"],
    s2a: ["If that were really solved, what would it look like instead?"],
    s2b: ["If that were really solved, what would it look like instead?"],
    s3a: ["So what exactly should it do for you?"],
    s3b: ["So what exactly should it do for you?"],
    s4a: ["The whole thing has a shape now.", "“People who might use it” is still three guesses. Select it on the map, then decide whether to go deeper — or name the first step."],
    s4b: ["Then simulated execution stays parked until you want it.", "“People who might use it” is still three guesses. Select it on the map, then decide whether to go deeper — or name the first step."],
    s5b: ["Then start with one person running their own rule through a full simulation. The rest can wait."],
  },
  branches: {
    people: {
      crumbs: ["The whole idea", "The user we mean", "Earliest user"],
      opening: ["Just this piece, then. Of the three, who would actually pick it up first?"],
      merged: ["Merged into the idea. Want to go back to the whole thing?"],
      candidate: ["We'll keep it on the map as a candidate without changing the current user."],
      discarded: ["Okay. We won't keep this one; the idea stays as it was."],
      more: ["That is this piece covered. Head back to the whole idea to keep going."],
      back: ["Back to the whole idea. The user we mean has been updated."],
      backCandidate: ["Back to the whole idea. The new direction is still a candidate."],
      backKept: ["Back to the whole idea. Nothing changed."],
    },
    help: {
      crumbs: ["The whole idea", "How the product helps"],
      opening: ["Just this piece. Of the things it does for you, which one can version one not do without?"],
      merged: ["Merged into the idea. Want to go back to the whole thing?"],
      candidate: ["We'll keep it on the map as a candidate without changing the product definition."],
      discarded: ["Okay. We won't keep this one; the idea stays as it was."],
      more: ["That is this piece covered. Head back to the whole idea to keep going."],
      back: ["Back to the whole idea. What the product does has been reordered."],
      backCandidate: ["Back to the whole idea. The new priority is still only a candidate."],
      backKept: ["Back to the whole idea. Nothing changed."],
    },
  },
  previews: {
    bp0a: {
      changed: "“People who might use it” narrows from three guesses to one earliest user.",
      added: "Earliest user: people already writing their rules in TradingView.",
      open: "Whether they would hand a rule they wrote to something else to run.",
    },
    bp0b: {
      changed: "“People who might use it” narrows from three guesses to one earliest user.",
      added: "Earliest user: disciplined traders who never touch code.",
      open: "How someone who doesn't code would state the rule at all.",
    },
    bh0a: {
      changed: "Under “how the product helps”, explaining moves to the front.",
      added: "Version one guarantees: say what it is about to do before doing it.",
      open: "How much explaining counts as clear — nobody has checked.",
    },
    bh0b: {
      changed: "Under “how the product helps”, stopping moves to the front.",
      added: "Version one guarantees: stop at any moment, and say where it stopped.",
      open: "What the screen shows after a stop — nobody has checked.",
    },
  },
};

const ja: StudioCopy = {
  idea: "普通の個人投資家の代わりに、米国株の売買ルールを自動で執行する Agent を作りたい。",
  opening: ["作り方はまだ後で大丈夫です。最初に思い浮かんだのは、誰がこれを必要とするか、でしょうか。"],
  closing: ["メモしました。この固定シナリオはここまでです。最初からやり直すこともできます。"],
  ui: {
    railTitle: "探索",
    canvasTitle: "アイデアマップ",
    fixedNote: "固定シナリオ · 実 Agent なし",
    restart: "最初から",
    restarted: "最初のアイデアに戻りました。もう一度たどれます。",
    back: "全体に戻る",
    branchLead: "いまはこの部分だけ",
    placeholder: "自分の言葉で続けても大丈夫です…",
    send: "送信",
    openNode: "深く話す",
    selectNode: "このカードを見る",
    selectedNode: "選んだアイデア",
    canvasGuide: "カードを選ぶと操作できます。↗ は個別に深掘りできます",
    continueDiscuss: "続きを話す",
    discussUser: "「{node}」について、もう少し話したいです。",
    discussReply: ["いいですね。「{node}」の何を足す、変える、または疑ってみたいですか？"],
    editNode: "少し直す",
    saveEdit: "保存",
    cancelEdit: "キャンセル",
    status: {
      fragment: "出てきた断片",
      candidate: "候補・未決定",
      confirmed: "現在の合意",
      unverified: "要検証",
      changed: "いったん保留",
    },
    exploreTab: "探索",
    mapTab: "アイデアマップ",
    close: "閉じる",
    previewLead: "ここまでの話で、アイデアはこう変わります",
    previewChanged: "変わったこと",
    previewAdded: "増えたこと",
    previewOpen: "まだ不確か",
    merge: "アイデアに反映",
    keepCandidate: "候補として残す",
    discard: "今回は残さない",
    merged: "アイデアに反映しました。",
    candidateKept: "候補として残しました。現在の結論は変わりません。",
    discarded: "今回は残しませんでした。",
    optionsLabel: "こう答えられます",
    conversationLabel: "GoodIdea との対話",
    canvasLabel: "アイデアマップ：対話から育っていく Product の輪郭",
    statusLabel: "対話の進み方",
  },
  stages: [
    { id: "01", label: "アイデアを掴む", hint: "まず言葉にしてみる" },
    { id: "02", label: "ユーザーを見つける", hint: "誰が、いつ困るのか" },
    { id: "03", label: "価値を決める", hint: "何が変わるのかを確かめる" },
    { id: "04", label: "Product の形にする", hint: "全体の形を組み立てる" },
    { id: "05", label: "初版を決める", hint: "最初の一歩を選ぶ" },
  ],
  hints: {
    scene: "ひとつの利用場面ができつつあります",
    shape: "Product の輪郭が少し見えてきました",
    updated: "アイデアを更新しました",
    candidate: "新しい方向を候補としてマップに残しました",
    edited: "カードを更新しました",
  },
  nodes: {
    seed: { caption: "最初のアイデア", text: "個人投資家の代わりに米国株の戦略を執行する Agent" },
    whoHub: { text: "使いそうな人", note: "まだ推測" },
    whoHubMerged: { text: "対象ユーザー", note: "一種類に絞れた" },
    fragA: { text: "戦略はあるがコードは書けない" },
    fragAAside: { text: "戦略はあるがコードは書けない", note: "いったん脇に置く" },
    fragB: { text: "日中は仕事で相場を見られない" },
    fragC: { text: "すでに TradingView を使っている" },
    earlyUserA: { caption: "最初のユーザー", text: "TradingView でルールを書けている人" },
    earlyUserB: { caption: "最初のユーザー", text: "規律はあるがコードは書かない人" },
    who: { caption: "誰が", text: "ルールが明確な会社員" },
    when: { caption: "いつ", text: "米国株の取引時間" },
    problem: { caption: "どこが問題か", text: "条件が来ても誰も執行せず、後で気づく" },
    scene: { text: "ひとつの利用場面" },
    outcome: { caption: "どうなってほしいか", text: "相場を見なくても決めたルールが淡々と動く" },
    help: {
      caption: "Product の役割",
      text: "ルールを預かり、何をするか見せる",
      detail: ["すでにあるルールを読む", "動作の理由を説明する", "まず模擬実行で動かす", "いつでも止められる"],
    },
    helpA: {
      caption: "Product の役割",
      text: "ルールを預かり、何をするか見せる",
      detail: ["実行の前に何をするか説明する", "すでにあるルールを読む", "まず模擬実行で動かす", "いつでも止められる"],
      note: "初版はここだけは守る",
    },
    helpB: {
      caption: "Product の役割",
      text: "ルールを預かり、何をするか見せる",
      detail: ["いつでも止まり、どこで止まったか示す", "すでにあるルールを読む", "動作の理由を説明する", "まず模擬実行で動かす"],
      note: "初版はここだけは守る",
    },
    helpCandidateA: {
      caption: "優先候補",
      text: "実行前に何をするか説明する",
      note: "Product 定義にはまだ反映していない",
    },
    helpCandidateB: {
      caption: "優先候補",
      text: "いつでも止まり、どこで止まったか示す",
      note: "Product 定義にはまだ反映していない",
    },
    feasible: { caption: "成立条件", text: "証券会社の権限と模擬実行で足りるか", note: "未検証" },
    feasibleA: { caption: "成立条件", text: "どこまで説明すれば伝わるか", note: "未検証" },
    feasibleB: { caption: "成立条件", text: "止めた後の状態をどう見せるか", note: "未検証" },
    firstStep: { caption: "最初の一歩", text: "一人が自分のルールを最後まで模擬実行する" },
  },
  options: {
    s0a: "何種類か浮かびます。戦略はあるがコードは書けない人、日中は仕事で相場を見られない人、すでに TradingView を使っている人。",
    s0b: "正直まだ「個人投資家」としか考えていません。",
    s1a: "日中は仕事で相場を見られないけれど、ルールははっきりしている人です。",
    s1b: "少しコードが書けて、手間を減らしたいだけの人です。",
    s2a: "寄り付きのときは会議中で、条件が来ても誰も執行せず、後から気づきます。",
    s2b: "ルールは覚えているのに執行がぶれます。感情が入ると変えてしまう。",
    s3a: "もっと儲かる戦略を探すのではなく、決めたルールを確実に執行してほしい。",
    s3b: "見張っておいて、条件が来たら先に一声かけてほしい。勝手には動かないで。",
    s4a: "ルールを読んで、何をするか説明して、まず模擬実行。いつでも止められること。",
    s4b: "まずは通知だけで十分です。自分で発注はしないでほしい。",
    s5a: "まず、誰が使うのかを話したい。",
    s5b: "まず、最初の一歩を決めたい。",
    bp0a: "すでに TradingView でルールを書けている人たち。",
    bp0b: "コードは書かないけれど、規律がはっきりしている人。",
    bh0a: "実行の前に説明してくれることが一番大事です。何をするのか見えないと困る。",
    bh0b: "いつでも止められて、どこで止まったか分かることが一番大事です。",
  },
  replies: {
    s0a: ["まずは三つとも置いておきます。どの人の状況が、一番具体的に話せますか？"],
    s0b: ["では、これまで出てきた場面を並べておきます。どれもまだ推測です。", "どの状況が、一番具体的に話せますか？"],
    s1a: ["その人は、米国株が開くころ、たいてい何がうまくいかないのでしょう？"],
    s1b: ["その人たちは自分でスクリプトを書けるので、いったん置きます。", "「ルールはあるが見ていられない」の方で続けます。寄り付きのころ、何がうまくいかない？"],
    s2a: ["それが本当に解決したら、どうなっていてほしいですか？"],
    s2b: ["それが本当に解決したら、どうなっていてほしいですか？"],
    s3a: ["では、具体的に何を代わりにやってほしいですか？"],
    s3b: ["では、具体的に何を代わりにやってほしいですか？"],
    s4a: ["全体の形が見えてきました。", "ただ「使いそうな人」はまだ三つの推測です。マップで選び、深掘りするか決めてもいいし、先に最初の一歩でも構いません。"],
    s4b: ["では模擬実行は置いておいて、安心できたら開けましょう。", "「使いそうな人」はまだ三つの推測です。マップで選んでから深掘りするか、先に最初の一歩か、選べます。"],
    s5b: ["では、まず一人が自分のルールを最後まで模擬実行するところから。ほかは待てます。"],
  },
  branches: {
    people: {
      crumbs: ["Product 全体", "対象ユーザー", "最初のユーザー"],
      opening: ["ここだけ見ます。三つのうち、実際に最初に使い始めるのは誰でしょう？"],
      merged: ["アイデアに反映しました。全体に戻って見てみますか？"],
      candidate: ["今の対象ユーザーは変えず、候補としてマップに残します。"],
      discarded: ["分かりました。今回は残さず、アイデアはこのままです。"],
      more: ["この部分はここまでです。全体に戻ると、続きを進められます。"],
      back: ["全体に戻りました。対象ユーザーが更新されています。"],
      backCandidate: ["全体に戻りました。新しい方向はまだ候補です。"],
      backKept: ["全体に戻りました。今回は変更ありません。"],
    },
    help: {
      crumbs: ["Product 全体", "Product の役割"],
      opening: ["ここだけ見ます。代わりにやることのうち、初版で外せないのはどれですか？"],
      merged: ["アイデアに反映しました。全体に戻って見てみますか？"],
      candidate: ["今の Product 定義は変えず、候補としてマップに残します。"],
      discarded: ["分かりました。今回は残さず、アイデアはこのままです。"],
      more: ["この部分はここまでです。全体に戻ると、続きを進められます。"],
      back: ["全体に戻りました。Product の役割の順番が変わっています。"],
      backCandidate: ["全体に戻りました。新しい優先順位はまだ候補です。"],
      backKept: ["全体に戻りました。今回は変更ありません。"],
    },
  },
  previews: {
    bp0a: {
      changed: "「使いそうな人」が三つの推測から、最初のユーザー一種類に絞られます。",
      added: "最初のユーザー：すでに TradingView でルールを書けている人。",
      open: "自分で書いたルールを、他のものに執行させる気になるかどうか。",
    },
    bp0b: {
      changed: "「使いそうな人」が三つの推測から、最初のユーザー一種類に絞られます。",
      added: "最初のユーザー：コードは書かないが、規律がはっきりしている人。",
      open: "コードを書かない人が、ルールをどう言葉にするか。",
    },
    bh0a: {
      changed: "「Product の役割」で、説明することが先頭に来ます。",
      added: "初版で守ること：実行の前に、何をするか先に伝える。",
      open: "どこまで説明すれば伝わるのか、まだ誰も確かめていません。",
    },
    bh0b: {
      changed: "「Product の役割」で、止められることが先頭に来ます。",
      added: "初版で守ること：いつでも止まり、どこで止まったかを示す。",
      open: "止めた後の状態をどう見せるか、まだ誰も確かめていません。",
    },
  },
};

export const studioCopy: Record<StudioLocale, StudioCopy> = { en, ja, "zh-CN": zh };
