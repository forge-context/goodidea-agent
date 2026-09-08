/* What the film leaves behind, written out.
 *
 * A visitor who never presses play still has to be able to say what they would walk
 * away holding, and the page, the film and the downloaded file must not be able to
 * disagree about it. So the static output section and the download are both built
 * from this one description of the same case: the designer's quoting tool the film
 * works out on screen.
 *
 * Everything here is the same concept demo the film is. It says so where it matters:
 * the research line is an assumption an agent proposed, not a finding from real
 * interviews, and the implementation tasks are an example of what a handoff would
 * contain, not scheduled work.
 */

import { siteCopy, type Locale } from "../../siteCopy";
import { paperCopy } from "./paperCopy";

export type BriefBlock = {
  label: string;
  items: string[];
  note?: string;
  /** Boundary blocks read as a limit, not as another feature list. */
  tone?: "limit" | "open";
};

export type PaperBrief = { input: string; blocks: BriefBlock[] };

type BriefContent = {
  direction: string[];
  prototype: string[];
  prototypeNote: string;
  scope: string[];
  nonGoals: string[];
  done: string[];
  open: string[];
  handoff: string[];
  handoffNote: string;
};

const CONTENT: Record<Locale, BriefContent> = {
  "zh-CN": {
    direction: [
      "为谁：一个人接单的自由职业设计师",
      "问题：每份报价都要重新整理一遍交付范围，再向客户解释一遍",
      "结果：开工前客户就看清范围与价格，少掉一轮来回确认",
    ],
    prototype: [
      "一份只读的范围确认单：交付内容、修改次数、包含与追加项，连同价格",
      "客户打开链接，读完后确认；设计师这边看到确认状态",
    ],
    prototypeNote: "原型是概念预览，不是已经实现的软件。",
    scope: [
      "从模板生成一份报价范围单",
      "写清交付内容、修改次数、包含与追加项",
      "生成客户可读的只读链接",
      "客户确认后，设计师看到状态更新",
    ],
    nonGoals: [
      "客户在线调整范围",
      "按范围自动计价",
      "收款与发票",
      "完整的项目管理",
    ],
    done: [
      "客户不再反复问「包含什么、能改几次、加一项怎么算」",
      "创建一份报价范围单，明显快过每次从头整理",
      "同一条确认状态，设计师与客户看到的一致",
    ],
    open: [
      "「客户最在意的是范围」目前是研究 Agent 提出的假设，还没有真实用户验证",
      "是否值得支持调整范围与自动计价，要看真实使用之后再定",
      "同一套范围结构，是否适用于品牌以外的设计类型",
    ],
    handoff: [
      "范围确认单的数据结构与可复用模板",
      "只读分享链接，以及确认状态的回写",
      "客户确认后的通知与记录",
    ],
    handoffNote: "实现任务是示例内容，不代表已经排期的开发。",
  },

  en: {
    direction: [
      "Who: a freelance designer working alone",
      "Problem: every quote means sorting out the scope again, then explaining it again",
      "Outcome: the client sees scope and price before work starts, and one round of back-and-forth disappears",
    ],
    prototype: [
      "A read-only scope sheet: deliverables, revisions, what is included and what is extra, with the price",
      "The client opens a link, reads it and confirms; the designer sees that confirmation",
    ],
    prototypeNote: "The prototype is a concept preview, not software that has been built.",
    scope: [
      "Build a quote's scope sheet from a template",
      "State the deliverables, the revisions, and what is included versus extra",
      "Produce a read-only link the client can open",
      "Show the designer the status once the client confirms",
    ],
    nonGoals: [
      "Letting the client adjust the scope online",
      "Pricing a changed scope automatically",
      "Payments and invoices",
      "Full project management",
    ],
    done: [
      "The client stops asking what is included, how many revisions, and what an extra costs",
      "Producing a scope sheet is clearly faster than writing it out each time",
      "Designer and client see the same confirmation status",
    ],
    open: [
      "“Scope is what the client cares about” is an assumption a research agent proposed — no real user has confirmed it",
      "Whether adjustable scope and automatic pricing are worth building depends on real use",
      "Whether one scope structure fits design work beyond brand projects",
    ],
    handoff: [
      "The data structure and reusable template behind the scope sheet",
      "The read-only share link, and writing the confirmation back",
      "Notifying and recording the client's confirmation",
    ],
    handoffNote: "The implementation tasks are example content, not scheduled work.",
  },

  ja: {
    direction: [
      "誰のため：一人で受けているフリーランスのデザイナー",
      "困りごと：見積もりのたびに範囲を整理し直し、そのたびに説明し直している",
      "結果：着手前にお客さまが範囲と価格を把握でき、やり取りが一往復減る",
    ],
    prototype: [
      "読むだけの範囲確認シート：納品物・修正回数・含むものと追加分、そして価格",
      "お客さまはリンクを開いて読み、確認する。デザイナー側には確認済みが表示される",
    ],
    prototypeNote: "試作はコンセプトの見取り図で、実装済みのソフトウェアではありません。",
    scope: [
      "テンプレートから見積もりの範囲シートを作る",
      "納品物・修正回数・含むものと追加分を書き出す",
      "お客さまが開ける読み取り専用リンクを発行する",
      "お客さまの確認後、デザイナー側の状態を更新する",
    ],
    nonGoals: [
      "お客さまが画面上で範囲を変更する",
      "変更した範囲から自動で価格を出す",
      "決済と請求書",
      "本格的なプロジェクト管理",
    ],
    done: [
      "「どこまで含む？何回まで直せる？追加はいくら？」を繰り返し聞かれなくなる",
      "範囲シートを作るほうが、毎回書き起こすより明らかに速い",
      "同じ確認状態を、デザイナーとお客さまが同じように見られる",
    ],
    open: [
      "「お客さまが気にしているのは範囲」は、リサーチ Agent が出した仮説です。実際の利用者による検証はまだありません",
      "範囲の調整と自動見積もりを作る価値があるかは、実際に使われてから判断します",
      "同じ範囲の型が、ブランド以外のデザイン案件にも合うかどうか",
    ],
    handoff: [
      "範囲シートのデータ構造と、再利用できるテンプレート",
      "読み取り専用の共有リンクと、確認状態の書き戻し",
      "お客さまの確認の通知と記録",
    ],
    handoffNote: "実装の作業は例であり、予定された開発ではありません。",
  },
};

export function buildPaperBrief(locale: Locale): PaperBrief {
  const label = siteCopy[locale].briefLabels;
  const film = paperCopy[locale];
  const c = CONTENT[locale];
  return {
    /* The draft prints that sentence on two lines because the sheet is that wide.
     * Read back as one sentence it needs whatever joins words in this language, which
     * in English is a space and in Chinese and Japanese is nothing. */
    input: film.product.original.join(locale === "en" ? " " : ""),
    blocks: [
      { label: label.direction, items: c.direction },
      { label: label.prototype, items: c.prototype, note: c.prototypeNote },
      { label: label.scope, items: c.scope },
      { label: label.nonGoals, items: c.nonGoals, tone: "limit" },
      { label: label.done, items: c.done },
      { label: label.open, items: c.open, tone: "open" },
      { label: label.handoff, items: c.handoff, note: c.handoffNote },
    ],
  };
}

/** The downloadable package: the same content, written as the note a coding agent
 *  would actually be handed. */
export function paperHandoffMarkdown(locale: Locale): string {
  const site = siteCopy[locale];
  const film = paperCopy[locale];
  const brief = buildPaperBrief(locale);
  return [
    `# ${film.product.title}`,
    "",
    `> ${brief.input}`,
    "",
    ...brief.blocks.flatMap((block) => [
      `## ${block.label}`,
      ...block.items.map((item) => `- ${item}`),
      ...(block.note ? ["", `_${block.note}_`] : []),
      "",
    ]),
    "---",
    "",
    film.ui.concept,
    site.trustScope,
    "",
  ].join("\n");
}
