# GoodIdea LP Visual System と設計理由

[English](lp-visual-system.md) | [日本語](lp-visual-system.ja.md) | [中文](lp-visual-system.zh.md)

この記録は、現在の LP における Design 判断と理由を説明する。色に普遍的な心理効果があるとは決めず、「発散した Idea → 現実の根拠 → 収束した境界 → 行動」という Product Behavior に一貫した Interface Language を定める。

## Design 判断

| 判断 | 実装 | 理由 |
| --- | --- | --- |
| Brand の性格 | Forge の冷たい Engineering Blue から、温かい Violet、Coral、Teal へ変更 | GoodIdea は未完成の Idea を受け止めてから制約する。始めやすさと正直な境界を同時に感じられる必要がある。 |
| Primary Color | 温かい Grape Violet `#7A3F9F` | 以前の Blue Violet は冷たい Surface と大きな Control の上で Blue に見えた。探索/現在の行動という意味を保ちつつ、汎用 SaaS より創造的な印象にする。白文字との Contrast は約 6.91:1。 |
| Semantic Color | Teal `#087B66` は根拠あり/完了、Coral `#BC4637` は境界/注意 | Evidence と Risk を一つの Brand Color に畳まない。色には必ず文言や記号を併記する。 |
| 基礎色 | 背景 `#FFFAF7` と本文 `#241936` | 温かい Surface で Blue の見え方と Audit Console 感を弱めながら、本文約 15.99:1、補助本文約 6.30:1 の Contrast を保つ。 |
| Hero 構成 | 左に明確な約束、右に Generative Idea Field | 左が結果を説明し、右が「粗い Idea → 明確な方向」を Product Demo を読む前に感覚で伝える。Stage Path は意味を持つ Demo 内へ残す。 |
| 見出し Gradient | 大見出し 1 行だけを Violet から Coral へ | 探索から行動への変化を一つの Visual Cue に圧縮する。本文や Control には使わない。 |
| Brand Mark | 角丸 Square の文字 G を、開いた G 型 Path と Coral の Spark に置き換える | 開いた Path は探索の余地がある Idea、Spark は明確な次の一歩へ収束する瞬間を表す。Header、Demo、Footer で同じ Custom Vector を使う。 |
| Action Icon | Scroll と実装を開く操作に、16px の同じ Rounded Stroke の SVG Icon を使う | Font の矢印 Glyph は OS ごとに太さと形が変わる。同じ Stroke System で First View の二つの Action を揃える。 |
| Shape | 12–26px の段階的な角丸 | Engineering Console の距離感を弱め、Control、Content Card、Product Demo の階層を半径で区別する。 |
| Demo の優先度 | Demo を最大の Object にし、状態に応じて上辺の色を変える | Feature List より Product Behavior の方が強い証明になる。配置を動かさず Stage 変化を伝える。 |
| Agent 回答の構造 | 実現可能性を一つの Chat Turn にまとめ、最初の一文で結論を示し、本文中の根拠と Message 末尾の小さな選択肢を続ける | 回答、説明、次の一歩、判断を別 Card にすると注意が分散する。同じ会話 Context の中で実現可能性を判断し、そのまま返答できるようにする。 |
| Evidence Interaction | 根拠を回答内の重要な主張に結び、Hover または Keyboard Focus で出典を表示し、Click で原文を開く | 別の Evidence Drawer を開いて結論と手作業で対応させる必要をなくす。主張と Provenance を同じ Reading Position に置く。 |
| 情報量 | Reality、Decision、Boundary を段階的に表示 | 一度に処理する量を減らし、「一度に一つの価値ある質問」という Product Principle と揃える。 |
| CTA 階層 | 1 View に塗りつぶし Primary Action は一つ | Demo、GitHub、承認、修正が同じ強さで競合しないようにし、次の行動を明確にする。 |
| Motion | Headline の Mask Reveal と、Pointer に反応しながら開いた G Mark へ集まる Particle Field | First View を Workflow の説明 Animation ではなく Creative Experience にする。Brand の変形で Product Metaphor を示し、以降の Motion は機能的に抑える。 |
| Reduced Motion | `prefers-reduced-motion: reduce` で Animation、Transition、Smooth Scroll を停止 | Motion がなくても同じ情報を得られ、OS の利用者設定を尊重できる。 |
| Responsive | Desktop は 2 Column、Tablet は横 Stage、Mobile は 1 Column | Desktop を縮小するだけでなく、各画面で読む順序と Core Action を保つ。 |
| Typography | Locale 別の System Font Stack、全 Locale 共通の実在する 600 Weight の Display Heading、技術的な Metadata だけに Monospace を使う | 未宣言の Webfont 依存を持たない。中国語 Label には CJK の Metrics を使い、Latin 専用の大文字・字間規則を外し、「开始」のような語を途中で分けない Break Point を置く。 |
| 画像 | 現時点では汎用写真や装飾 Illustration を追加しない | いま最も説得力のある Visual は Interactive Product Behavior。実例が揃ってから Original Visual を検討する。 |

## Accessibility Baseline

- 通常 Text の組合せは WCAG 2.2 の最低 Contrast 4.5:1 に照らして確認する。
- 状態は色だけでなく、文言・番号・Check・境界記号でも示す。
- Keyboard Focus を見えるままにし、Skip Link を保持する。
- Motion は OS の Reduced Motion 設定を尊重する。

根拠: [W3C Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)、[W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html)。
