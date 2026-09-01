import { IdeaMapHero } from "./IdeaMap";
import { IdeaStudioDemo } from "./studio/IdeaStudioDemo";

type Locale = "en" | "ja" | "zh-CN";

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
  demoEyebrow: string;
  demoTitle: string;
  demoIntro: string;
  howEyebrow: string;
  howTitle: string;
  howItems: { number: string; title: string; text: string }[];
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
    demoEyebrow: "Interactive product example",
    demoTitle: "Watch a vague idea grow into a product.",
    demoIntro:
      "A fixed walkthrough that never calls a live agent. Take a few turns and watch a scattered idea get understood, connected, and narrowed down.",
    howEyebrow: "The agent loop",
    howTitle: "Enough structure to move forward. Not enough ceremony to stop.",
    howItems: [
      { number: "01", title: "Ground the idea", text: "Search only what the next product decision needs, and attach every claim to a source you can open." },
      { number: "02", title: "Reduce one uncertainty", text: "Explain why one question matters and pause for you. What you said about your own limits is remembered, so you never say it twice." },
      { number: "03", title: "Freeze the boundary", text: "Write down what this version will not do, and hand anything over only after you approve that exact proposal." },
    ],
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
    demoEyebrow: "Interactive Product Example",
    demoTitle: "曖昧なアイデアが、少しずつ Product になっていく。",
    demoIntro: "固定のシナリオで動く体験で、実 Agent は呼びません。何度か会話を進めると、散らばったアイデアが理解され、つながり、絞られていきます。",
    howEyebrow: "Agent Loop",
    howTitle: "前進に必要な構造だけ。動けなくなるほどの形式は持ち込まない。",
    howItems: [
      { number: "01", title: "アイデアを根拠へつなぐ", text: "次の Product 判断に必要な範囲だけを調べ、主張には開ける出典を必ず付けます。" },
      { number: "02", title: "不確実性を一つ減らす", text: "質問の理由を説明し、あなたの答えを待ちます。ご自身の制約として話したことは記憶され、二度言う必要はありません。" },
      { number: "03", title: "境界を固定する", text: "この版でやらないことを書き出し、その提案をあなたが承認した後だけ引き渡します。" },
    ],
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
    demoEyebrow: "可交互的产品示例",
    demoTitle: "看着一个模糊想法，\u200B慢慢长成产品。",
    demoIntro: "这是一段固定体验，不会调用真实 Agent。跟着对话走几步，看看想法如何被理解、连接和收敛。",
    howEyebrow: "Agent 工作闭环",
    howTitle: "提供足够前进的结构，\u200B但不制造\u200B阻止行动的形式。",
    howItems: [
      { number: "01", title: "用证据落地想法", text: "只调查下一个产品决定真正需要的内容，每条结论都挂着能点开的出处。" },
      { number: "02", title: "一次减少一个未知", text: "解释一个问题为什么重要，然后停下来等你决定。你说过的条件会被记住，不用说第二遍。" },
      { number: "03", title: "固定 MVP 边界", text: "先写清这一版不做什么，等你批准眼前这份提案，才交出去。" },
    ],
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
  },
};

function App() {
  const documentLocale = document.documentElement.dataset.locale;
  const locale: Locale =
    documentLocale === "ja" || documentLocale === "zh-CN" ? documentLocale : "en";
  const t = copies[locale];

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

            <div className="demo-window">
              <IdeaStudioDemo locale={locale} />
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

export default App;
