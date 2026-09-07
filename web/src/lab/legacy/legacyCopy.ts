/* The chapter labels and closing turn of the retired trading walkthrough.
 *
 * They used to live in `siteCopy`, where the landing page could still see them. The
 * site now tells one story only, so this experiment carries its own words and the
 * two cannot drift into each other.
 */

import type { Locale } from "../../siteCopy";

export type LegacyCopy = {
  chapters: { label: string; point: string }[];
  closingLines: string[];
};

export const legacyCopy: Record<Locale, LegacyCopy> = {
  "zh-CN": {
    chapters: [
      { label: "说出想法", point: "一句模糊的话就可以开始" },
      { label: "找到用户和问题", point: "先确定为谁解决什么，再谈功能" },
      { label: "收敛第一版", point: "写清这一版做什么、不做什么" },
      { label: "方案与交接", point: "留下带验收条件的一页方案" },
    ],
    closingLines: [
      "这就是一页可以交接的第一版方案：为谁解决什么、这一版做什么和不做什么、怎么算做对了，还有哪些还需要验证。",
      "换成你自己的想法，问的还是这几件事。",
    ],
  },
  en: {
    chapters: [
      { label: "Say the idea", point: "One vague sentence is enough to start" },
      { label: "Find the user and the problem", point: "Settle who and what before features" },
      { label: "Narrow version one", point: "Write down what it does and does not do" },
      { label: "Plan and handoff", point: "End with one page, acceptance included" },
    ],
    closingLines: [
      "That is a first-version plan you can hand over: who it is for, what this version does and does not do, what counts as done, and what still needs checking.",
      "Swap in your own idea and the questions are the same ones.",
    ],
  },
  ja: {
    chapters: [
      { label: "アイデアを出す", point: "曖昧な一文で始められます" },
      { label: "ユーザーと問題を絞る", point: "機能の前に、誰の何を解くかを決める" },
      { label: "初版に絞り込む", point: "やること・やらないことを書き出す" },
      { label: "計画と引き渡し", point: "完了条件つきの一枚を残す" },
    ],
    closingLines: [
      "これが引き渡せる初版の計画です。誰のためか、この版で何をやり何をやらないか、何をもって完了とするか、まだ検証が要るのは何か。",
      "自分のアイデアに置き換えても、問われることは同じです。",
    ],
  },
};
