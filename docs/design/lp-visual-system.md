# GoodIdea LP visual system and rationale

[English](lp-visual-system.md) | [日本語](lp-visual-system.ja.md) | [中文](lp-visual-system.zh.md)

This record explains the current LP design decisions. It does not claim that a color has a universal psychological meaning. It defines a consistent interface language for the product behavior: divergent idea, grounded evidence, converged boundary, and action.

## Decisions

| Decision | Implementation | Reason |
| --- | --- | --- |
| Brand character | Warm violet, coral, and teal replace Forge's cool engineering blue | GoodIdea receives incomplete ideas before it constrains them. The visual tone should invite a start while still signaling honest boundaries. |
| Primary color | Warm grape violet `#7A3F9F` | The previous blue-violet read as blue on a cool surface and across large controls. The warmer violet still means exploration/current action while feeling less like a generic SaaS tool. White text has about 6.91:1 contrast. |
| Semantic colors | Teal `#087B66` for supported/completed states; coral `#BC4637` for boundaries and caution | Evidence and risk should not collapse into one brand color. Text and symbols always accompany color. |
| Foundation colors | `#FFFAF7` background and `#241936` text | The warm surface reduces the blue cast and feels less like an audit console while keeping approximately 15.99:1 body contrast and 6.30:1 muted-text contrast. |
| Hero composition | A clear promise on the left and a generative idea field on the right | The first side explains the outcome; the second makes “rough idea → clear direction” emotionally visible before the visitor reads the product demo. The stage path remains inside the demo where it has functional meaning. |
| Headline gradient | A restrained violet-to-coral gradient on one large line | It compresses the transition from exploration to action into one visual cue. It is not used for body copy or controls. |
| Brand mark | An open G-shaped path with a coral spark replaces the letter inside a rounded square | The open path represents an idea that can still be explored; the spark marks the moment it becomes a clear next step. A custom vector mark feels intentional at header, demo, and footer sizes. |
| Action icons | Matching 16px rounded-stroke SVG icons for scrolling and opening implementation | Font arrow glyphs change weight and geometry across platforms. A shared stroke system keeps the two first-view actions visually related. |
| Shape system | Layered 12–26px radii | Softer shapes reduce the distance of an engineering console. Different radii distinguish controls, content cards, and the product demo. |
| Demo priority | The demo remains the page's largest object; a semantic top rail changes with state | Product behavior is more persuasive than a feature list. The rail shows research, proposal, and handoff changes without rearranging content. |
| Agent answer structure | Feasibility is one continuous chat turn: a first-sentence verdict, inline evidence, and compact choices at the end of the same message | Separate answer, explanation, next-step, and decision cards scatter attention. A conversational turn lets the user judge feasibility first and respond without changing visual context. |
| Evidence interaction | Evidence is attached to key claims; hover or keyboard focus reveals the source and click opens the original | Users do not need to expand a separate evidence drawer and manually map sources back to conclusions. The claim and provenance share one reading position. |
| Information density | Reality, decision, and boundary appear progressively | Progressive disclosure reduces the amount a user must process and matches the “one valuable question at a time” product principle. |
| CTA hierarchy | One filled primary action per view; secondary actions are outlined or textual | This keeps the next step unambiguous and prevents the demo, GitHub, approval, and revision actions from competing equally. |
| Motion | Masked headline reveal plus a pointer-reactive particle field that assembles into the open G mark | The first view should feel like a creative experience, not an animated workflow tutorial. The branded transformation carries the product metaphor, while later motion remains functional and restrained. |
| Reduced motion | Animations, transitions, and smooth scrolling stop under `prefers-reduced-motion: reduce` | The interface remains complete without motion and respects the user's system preference. |
| Responsive structure | Desktop two-column, tablet horizontal stage strip, mobile single-column | Each size preserves reading order and core action instead of merely shrinking the desktop page. |
| Typography | Locale-specific system stacks, real 600-weight display headings across all locales, and monospace only where the content is actually technical metadata | The LP has no undeclared webfont dependency. Chinese labels keep CJK metrics, avoid Latin-only uppercase/spacing rules, and use semantic break opportunities instead of splitting words such as “开始”. |
| Imagery | No generic photography or decorative illustration yet | The interactive product behavior is the strongest current proof. Original brand imagery can be added when real cases exist. |

## Accessibility baseline

- Normal text combinations are checked against the WCAG 2.2 minimum contrast ratio of 4.5:1.
- State is communicated with text and symbols as well as color.
- Keyboard focus remains visible and a skip link is available.
- Motion respects the operating system's reduced-motion preference.

References: [W3C Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), and [W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html).
