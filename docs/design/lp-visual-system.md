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
| Hero composition | A promise on the left and an explored map on the right | The map argues rather than decorates: it shows an idea refusing three tempting shortcuts before it becomes something buildable. A decorative field looked good and said nothing about the product. |
| Headline gradient | A restrained violet-to-coral gradient on one large line | It compresses the transition from exploration to action into one visual cue. It is not used for body copy or controls. |
| Brand mark | An open G-shaped path with a coral spark replaces the letter inside a rounded square | The open path represents an idea that can still be explored; the spark marks the moment it becomes a clear next step. A custom vector mark feels intentional at header, demo, and footer sizes. |
| Action icons | Matching 16px rounded-stroke SVG icons for scrolling and opening implementation | Font arrow glyphs change weight and geometry across platforms. A shared stroke system keeps the two first-view actions visually related. |
| Shape system | Layered 12–26px radii | Softer shapes reduce the distance of an engineering console. Different radii distinguish controls, content cards, and the product demo. |
| Demo priority | The demo remains the page's largest object; a semantic top rail changes with state | Product behavior is more persuasive than a feature list. The rail shows research, proposal, and handoff changes without rearranging content. |
| Agent answer structure | Feasibility is one continuous chat turn: a first-sentence verdict, inline evidence, and compact choices at the end of the same message | Separate answer, explanation, next-step, and decision cards scatter attention. A conversational turn lets the user judge feasibility first and respond without changing visual context. |
| Evidence interaction | Evidence is attached to key claims; hover or keyboard focus reveals the source and click opens the original | Users do not need to expand a separate evidence drawer and manually map sources back to conclusions. The claim and provenance share one reading position. |
| Information density | Reality, decision, and boundary appear progressively | Progressive disclosure reduces the amount a user must process and matches the “one valuable question at a time” product principle. |
| CTA hierarchy | One filled primary action per view; secondary actions are outlined or textual | This keeps the next step unambiguous and prevents the demo, GitHub, approval, and revision actions from competing equally. |
| Motion | The map runs once, in about six and a half seconds, and stays on the finished state | Most visitors decide within three seconds, so no beat may be load-bearing on its own. Nothing already lit ever goes dark: an interrupted frame still reads. |
| Reduced motion | Animations, transitions, and smooth scrolling stop under `prefers-reduced-motion: reduce` | The interface remains complete without motion and respects the user's system preference. |
| Responsive structure | Desktop two-column, tablet horizontal stage strip, mobile single-column | Each size preserves reading order and core action instead of merely shrinking the desktop page. |
| Content column | `--shell` holds at 1180px through laptop widths, then grows with the viewport to a 1360px cap; every section shares that one edge | A fixed 1180px left a 1920px monitor as roughly 40% margin. The cap is set by the demo: past 1360px the chat turn has already reached its reading measure, so more width would only stretch the idea field and the primary action. |
| Typography | Locale-specific system stacks, real 600-weight display headings across all locales, and monospace only where the content is actually technical metadata | The LP has no undeclared webfont dependency. Chinese labels keep CJK metrics, avoid Latin-only uppercase/spacing rules, and use semantic break opportunities instead of splitting words such as “开始”. |
| Type scale | One scale of six sizes: 16px body, 17px leads, 14px floor for anything that is a word or a sentence, and 12–13px reserved for all-caps monospace metadata | The page previously ran on 8–13px for almost everything, which is below every mainstream baseline. |
| Imagery | No generic photography or decorative illustration yet | The interactive product behavior is the strongest current proof. Original brand imagery can be added when real cases exist. |

## The first view: the idea map

The map is the argument the page makes before anything is read. An idea travels a
route, is tempted three times by a faster-looking shortcut, refuses each one, and
arrives somewhere buildable. These notes exist so the next change does not
accidentally undo the reasons.

**The refusal is the point, so it takes three separate beats.** The idea holds still
and leans toward the wrong road, the sign is crossed out while that road is still
bright, and only then does it fade and the right one light up. Collapsing these into
one beat makes the decision invisible, which removes the only thing separating this
from a flowchart. For the same reason the three wrong signs stay on the finished map
at reduced opacity, and on a narrow screen the stage questions are dropped before the
detour notes are.

**The shell is carried, not parked.** An earlier version made the egg a large
destination; it read as an object pasted onto a drawing made of thin lines. It is now
the travelling token: whole at the start, cracked by each answered question, open by
the handoff. The hatching metaphor was a deliberate decision from the beginning and is
preserved this way rather than by keeping a decorative shape.

**No ambient particles.** A pointer-reactive particle field was removed from this hero
on purpose. Re-adding drifting specks under another name is the same decoration with a
new label; faint, irregular contour lines carry the terrain instead. They are
deliberately open and off-centre, because concentric rings read as radar.

**Two layers per stretch of route.** A wide, soft band lights the ground first and a
crisp line commits to the direction after. A single line, whatever its colour, reads
as a chart.

## What constrains the layout

The drawing lives in a fixed 1000×600 space that is stretched to whatever box the
page gives it, while the labels are real DOM at a fixed type size. So the pixel gaps
between landmarks shrink on a short screen while the cards do not. Two consequences
that are easy to forget:

- Positions are spaced for the **shortest** box the map is allowed to take and for the
  **tallest** language, which is Japanese or English rather than Chinese.
- The map bleeds left behind the headline, but only the fog and contours may go there.
  A labelled landmark over the copy puts readable text on readable text.

The map height is bounded by the viewport height as well as its width, so that on a
laptop screen the demo section below still shows its top edge. That edge is the only
cue that the page continues.

## The type scale

The page is built on six sizes, declared as `--fs-tag` through `--fs-title` in
`web/src/styles.css`, and nothing else may invent a seventh.

| Token | Size | Used for |
| --- | --- | --- |
| `--fs-title` | 19px | The agent's answer lead and the decision heading inside the demo |
| `--fs-lead` | 17px | The hero intro and the principle titles |
| `--fs-body` | 16px | Default prose: every paragraph, list, and the idea field |
| `--fs-small` | 14px | Captions, notes, milestone labels, sandbox log and code |
| `--fs-label` | 13px | All-caps monospace section labels, eyebrows, and terms |
| `--fs-tag` | 12px | All-caps monospace metadata chips and status pills |

**16px is the body default and 14px is the floor.** Material 3 puts body-large at
16sp and body-medium at 14sp and stops its readable range there; the GOV.UK scale
bottoms out at 16px and deliberately no longer shrinks on small screens; Apple's iOS
body is 17pt. Interactive labels follow the same rule, so buttons and navigation are
14–15px rather than the 10px monospace they were.

**12–13px is allowed for all-caps monospace metadata only.** Every glyph in an
all-caps run is cap height, so a 12px label carries roughly the cap height of 16px
lowercase text and none of its reading load: these are one- to four-word status
markers, not sentences. Nothing smaller than 12px is left on the page except a
superscript evidence marker and a few decorative `aria-hidden` symbols.

**Leading came down as size went up.** Body prose is 1.7 and small text 1.6–1.75,
which stays above the 1.5 that WCAG 2.2 Text Spacing expects of a paragraph while
avoiding the loose 1.85 that 11px text needed.

Three layouts had been tuned around the old sizes and had to move with them: the two
first-view actions stack instead of sharing a row, the milestone strip puts its
labels under the circles on a narrow screen instead of beside them, and the idea map
takes the full page width from 1120px down rather than 980px.

## Accessibility baseline

- Normal text combinations are checked against the WCAG 2.2 minimum contrast ratio of 4.5:1.
- State is communicated with text and symbols as well as color.
- Keyboard focus remains visible and a skip link is available.
- Motion respects the operating system's reduced-motion preference.

References: [W3C Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html), [W3C Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [Material 3 type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens), [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/), and [Apple HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography).
