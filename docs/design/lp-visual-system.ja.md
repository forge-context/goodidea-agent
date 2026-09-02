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
| Demo の優先度 | Demo を Page 最大の Object のままにする。中央は会話、右は会話から育つアイデアマップ、左は静かな道標 | Feature List より Product Behavior の方が強い証明になる。ここで見せる価値があるのは「アイデアが理解されていく」ことで、Report が出てくることではない。重さは中央、右、左の順。 |
| 会話のリズム | Agent の返答は短く、一度に一つの問いだけ進める。自然な選択肢を二つ置き、実際に送信できる自由入力も残す | 訪問者には Form ではなく会話だと分かってほしい。役割名、Avatar、Status Badge は置かない。言葉そのものが Interface で、固定選択肢はこの体験を最後まで歩けるようにするためだけにある。 |
| Concept の状態 | 断片、候補、確定、未検証、置き換え済みを、枠線・不透明度・ごく軽い一行で表す | Badge を並べると Map が Dashboard になる。根拠と仮説は Concept の属性であって独立した欄ではないので、何気なく言ったことが確定した結論に化けない。 |
| 情報量 | Map は一つの Node から始まり、1 ターンにつき目に見える変化は最大一つ。背後の十個の Concept は口に出されて初めて現れる | 空の欄が十個並べば、それは埋めるべき Form になる。方法論は裏に置き、画面に出るのは「ひとつの利用場面ができつつあります」で、「Use Case Unlocked」ではない。 |
| CTA 階層 | 1 View に塗りつぶし Primary Action は一つ | Demo、GitHub、承認、修正が同じ強さで競合しないようにし、次の行動を明確にする。 |
| Motion | Map は一度だけ、約 6.5 秒で走り、最終状態に留まる | 多くの訪問者は三秒で判断するため、どの一拍も単独で意味を背負わせない。点いたものは二度と消えないので、途中で止まった一枚でも読める。 |
| Reduced Motion | `prefers-reduced-motion: reduce` で Animation、Transition、Smooth Scroll を停止 | Motion がなくても同じ情報を得られ、OS の利用者設定を尊重できる。 |
| Responsive | Desktop は 3 Column。1080px 以下では道標が上部の Strip に畳まれ、会話と Map の 2 Column を保つ。Mobile では会話が Page そのもので、両側は本物の Panel になる | Desktop を縮小するだけでなく、各画面で読む順序と Core Action を保つ。Map は読めなくなるほど縮めず、代わりに Scroll する。 |
| Content Column | `--shell` は Laptop 幅までは 1180px を保ち、そこから Viewport に合わせて 1360px を上限に伸びる。全 Section が同じ端に揃う | 1180px 固定だと 1920px の Monitor では約 4 割が余白になる。上限は Demo が決めている。1360px を超えると Chat Turn は既に読める行長に達しており、増えた幅は Idea 欄と Primary Action を伸ばすだけになる。 |
| Typography | Locale 別の System Font Stack、全 Locale 共通の実在する 600 Weight の Display Heading、技術的な Metadata だけに Monospace を使う | 未宣言の Webfont 依存を持たない。中国語 Label には CJK の Metrics を使い、Latin 専用の大文字・字間規則を外し、「开始」のような語を途中で分けない Break Point を置く。 |
| Type Scale | 5 段階の一つの Scale: 本文 16px、Lead 17px、語や文である限り 14px を下限とし、12〜13px は全て大文字の Monospace Metadata だけに残す | それまでほぼ全てが 8〜13px で組まれており、主要な設計基準のどれよりも小さかった。 |
| 画像 | 現時点では汎用写真や装飾 Illustration を追加しない | いま最も説得力のある Visual は Interactive Product Behavior。実例が揃ってから Original Visual を検討する。 |

## First View：Idea Map

Map は、何かが読まれる前にこの Page が行う主張です。アイデアが道を進み、速そうな近道に三度誘われ、三度断り、作れる場所に着きます。以下は、次の変更がその理由を偶然に消してしまわないための記録です。

**断ることこそが主題なので、三拍に分けます。** アイデアが止まって誤った方へ傾き、その道がまだ明るいうちに標識へ × が付き、そのあとで暗くなり正しい道が点きます。一拍にまとめると判断が見えなくなり、これを Flowchart から隔てている唯一のものが失われます。同じ理由で、三つの誤った標識は透明度を下げて最終画面に残し、狭い画面では Detour の一言より先に各段階の問いを落とします。

**殻は運ばれるもので、置かれるものではありません。** 初期版は卵を大きな終点にしましたが、細い線でできた図に貼り付けた立体物のように見えました。今は移動する Token です。始めは無傷、問いに答えるたびにひびが入り、引き渡しで孵ります。孵化の Metaphor は最初からの決定であり、装飾的な形を残すのではなくこの形で保っています。

**環境 Particle は加えません。** この First View の Particle Field は意図して外したものです。名前を変えて漂う粒を戻すのは、同じ装飾に別の Label を付けるだけです。地形はごく淡い不規則な等高線が担います。同心円は Radar に見えるため、意図的に開いていて中心をずらしてあります。

**道の一区間ごとに二層。** 広く柔らかい帯が先に地面を照らし、鮮明な線が後から方向を確定します。単層の線は色が何であれ Chart に見えます。

## Layout を縛るもの

描画は固定の 1000×600 空間にあり、Page が与えた箱に引き伸ばされます。一方 Label は文字サイズの決まった実 DOM です。したがって画面が低いと Landmark 間の Pixel 間隔だけが縮み、Card は縮みません。忘れやすい帰結が二つあります。

- 座標は、Map が取りうる**最も低い**箱と、**最も背の高い**言語に合わせて配置します。後者は中国語ではなく日本語か英語です。
- Map は見出しの背後へ左に滲み出しますが、そこへ行ってよいのは霧と等高線だけです。Label のある Landmark が本文に重なると、読めるものの上に読めるものを置くことになります。

Map の高さは幅だけでなく Viewport の高さにも縛られます。Laptop の画面でも下の Demo Section の上端が見えるようにするためで、その端だけが Page の続きを示す手がかりです。

## Demo：育っていくアイデアマップ

Demo は固定シナリオで、裏に Agent はいません。次の変更で守るべきなのは、この Map の
振る舞いであって、中の文章ではありません。

**Map 全体を窓の中に収める。** Storyboard の各状態は専用の配置を持ち、アイデアが育つ
たびに Agent が White Board を整え直します。Canvas を縦に伸ばすのではなく、Node を上へ、
互いに近づけます。Node の高さは実行時に測ります。同じ Node が英語では 1 行、日本語では
2 行になるからで、上の Node に重なるものは下へ押し出されます。完成した Map がそれでも
Panel より高いときは、切り落とさず、訪問者が自分で見つける長い Scroll にもせず、全体を
わずかに縮小します。Mobile では Map が独立した Panel なので、ほぼ原寸のまま Scroll し、
そのターンで変わった箇所を表示範囲に入れます。

**意味を持つ Node はすべて選べるが、`↗` は Branch に入れる印だけを表す。** Node を選ぶと
その周辺を強調し、Canvas の下に「続きを話す」「少し直す」を出しますが、それだけで新しい
会話は作りません。`↗` のある Node だけが明示的な深掘りを提供し、結果は反映、候補として
保持、または破棄できます。

## Type Scale

Page は 5 つの Size だけで組む。`web/src/styles.css` に `--fs-tag` から `--fs-lead`
として宣言してあり、6 つ目を勝手に増やさない。

| Token | Size | 用途 |
| --- | --- | --- |
| `--fs-lead` | 17px | Hero の導入文、Principle の見出し、Demo で Agent が話す言葉 |
| `--fs-body` | 16px | 既定の本文。段落、List、Idea 入力欄 |
| `--fs-small` | 14px | Caption、注記、左の道標、選択肢、アイデアマップ上の全ての語 |
| `--fs-label` | 13px | 大文字 Monospace の Section Label、Eyebrow、用語 |
| `--fs-tag` | 12px | 大文字 Monospace の Metadata Chip と Status Pill |

**本文は 16px、下限は 14px。** Material 3 は body-large を 16sp、body-medium を 14sp
と定め、読ませる Text をそこで止める。GOV.UK の Scale は 16px を下限とし、小さい画面
でも縮めない方針に変わった。Apple iOS の Body は 17pt。操作 Label も同じ規則に従い、
Button と Navigation は 10px の Monospace ではなく 14〜15px になった。

**12〜13px は全て大文字の Monospace Metadata に限る。** 全て大文字の並びはどの字も
Cap Height なので、12px の Label は 16px の小文字とほぼ同じ Cap Height を持ち、読む
負荷は持たない。これらは 1〜4 語の状態表示であって文ではない。12px 未満で残っている
のは `aria-hidden` の装飾記号だけ。

**Size を上げた分、行間は下げた。** 本文は 1.7、小さい Text は 1.6〜1.75 で、WCAG 2.2
Text Spacing が段落に求める 1.5 を上回りつつ、11px の Text に必要だった 1.85 の緩さを
避けている。

古い Size に合わせて調整されていた 2 箇所は一緒に動かした。First View の 2 つの操作は
横並びをやめて縦に積み、Idea Map は 980px ではなく 1120px から Page 幅いっぱいを取る。

## Accessibility Baseline

- 通常 Text の組合せは WCAG 2.2 の最低 Contrast 4.5:1 に照らして確認する。
- 状態は色だけでなく、文言・番号・Check・境界記号でも示す。
- Keyboard Focus を見えるままにし、Skip Link を保持する。
- Motion は OS の Reduced Motion 設定を尊重する。

根拠: [W3C Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)、[W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)、[W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html)、[W3C Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)、[Material 3 Type Scale Tokens](https://m3.material.io/styles/typography/type-scale-tokens)、[GOV.UK Type Scale](https://design-system.service.gov.uk/styles/type-scale/)、[Apple HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)。
