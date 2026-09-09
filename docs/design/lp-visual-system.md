# GoodIdea LP visual system and rationale

[English](lp-visual-system.md) | [日本語](lp-visual-system.ja.md) | [中文](lp-visual-system.zh.md)

This record explains the current LP design decisions. It does not claim that a color has a universal psychological meaning. It defines a consistent interface language for the product behavior: divergent idea, grounded evidence, converged boundary, and action.

The detailed walkthrough and live workspace share tokens, Studio styles and the map renderer in `shared/studio/`. The public concept film lives separately in `web/src/studio/paper/`, under its own `gip-` class and custom-property prefix, and does not change the shared product interface.

## 2026-09-09 (further): one typeface, one scale, one bright mark

The page had four opinions about type and was reading as four voices. Navigation, the
eyebrows, the step numbers and the film's clock were monospace; the phrases on the
illustration and a third of the film were a Chinese brush face falling back through a
Japanese serif to Georgia; everything else was whatever sans the operating system
happened to offer, which is not the same shape on a Mac, a Windows machine and an
Android phone. There is now one family per language and nothing else.

- **Noto Sans, self-hosted, one file per language.** Noto Sans for English, Noto Sans
  SC for Simplified Chinese, Noto Sans JP for Japanese. Each is a variable font
  carrying the weight axis, so 400 / 500 / 600 / 700 come out of a single request.
  `web/src/fonts.css` declares the faces and the roles; `--font-sans` is set per
  `html[lang]`, and `--sans` and `--mono` — the names `shared/studio/` and the film
  both read — are pointed at it there, on the same `html[lang]` selectors the shared
  file uses, which is the only place a `:root` rule would lose to it. `--font-code`
  exists for genuine code and nothing on the landing page uses it.
- **The subsets are cut from this site's own copy.** `web/scripts/build-fonts.mjs`
  bundles `siteCopy.ts`, `paperCopy.ts` and `paperBrief.ts`, walks them per locale and
  cuts exactly those characters, plus full ASCII and the punctuation the layout can
  produce without any of it being written down. 37 kB Latin, 128 kB Chinese, 136 kB
  Japanese. The upstream variable fonts come from `google/fonts` into a gitignored
  `.fontcache/` and are not committed; the OFL licence for each family is written next
  to the subset it covers in `web/public/fonts/`.
- **Only the language being read is downloaded.** A face nothing on the page is set in
  is never fetched, and each locale's HTML preloads its own file. Verified cold, per
  page: English pulls the Latin file, Japanese the Japanese one, Chinese the Chinese
  one — and nothing else. The one shared extra is `noto-sans-cjk-bits.woff2`, 7 kB: the
  footer of every page lists "English / 日本語 / 简体中文" and the language switch says
  中文, so the English and Japanese pages need CJK their own faces do not have. The
  script asks each built subset what it is missing rather than guessing, and cuts that
  from the simplified face.
- **One scale, named once.** `--fs-hero` and `--fs-h2` are fluid because a headline is
  measured against the window it fills; everything at reading size and below is fixed,
  because a 16px paragraph does not become more readable on a wider monitor. Reading
  text moved up to 16px wherever it had been set at 14 — the outcome lists, the three
  steps, the principles, the scope note — and 14px went back to being the floor for
  labels rather than a size for prose. Weights are roles: 700 headline, 600 headings
  and controls, 500 labels, 400 body. A short laptop (under 820px tall) steps the
  headline down; nothing else moves.
- **One bright mark, once per screen.** The palette keeps the warm ground — now
  `#faf8f2`, sampled from the illustration itself, so the picture and the page are one
  surface — and takes the text to a deep ink green, the secondary to a green-grey that
  reads at 6:1, and the primary to `#31543a`, dark and full enough to carry a solid
  button. `--accent` (`#d4e86c`) appears in exactly one place: a hand-drawn rule under
  the words in the headline that say you can start — 可以开工, start building,
  開発に進める形. A second bright thing on a screen would make neither of them
  emphasis.
- **The illustration keeps one phrase.** The three overlaid phrases became one, inside
  the green ring: 把想法，推敲成形。 The title above the top rule and the note above
  the bottom one are gone — three phrases on a drawing beside a three-line headline is
  two arguments at once, and the drawing's blank paper is not a gap to fill. What is
  left is set in the page's own face, below the weight of the intro beside it, and
  hidden below 720px where the ring is 80px across.
- **The demo says what it shows.** "Three contributions, one decision" described the
  mechanism before the visitor had seen it. It now says 看一个报价工具的想法，如何变得
  具体 — watch one quoting-tool idea get specific — and the paragraph under it lost the
  sentence that repeated the case the film opens with. The English hero lost two lines;
  the Japanese one is built around 開発に進める形 rather than translated clause by
  clause. Nothing claims a capability that is not there: the closing still states, in
  full, that this is one fixed case with no backend behind it.
- **Contrast and focus.** Every text colour on all three pages clears 4.5:1 (3:1 for
  large text), measured with translucent layers composited rather than read as solid —
  four labels inside the film were failing and were taken deeper in their own hues. The
  focus ring is `3px solid var(--primary)` at full strength, offset clear of the
  control; the half-transparent one it replaces disappeared over anything but plain
  paper.

Checked at 1366×768, 1440×900, 1920×1080 and 390 / 360 wide, in all three languages:
no horizontal overflow, the hero still ends exactly where the demo begins on every
desktop size, and one font family resolves for every text node on each page. The film
was stepped through at ten marks per locale after the type change — nothing is occluded
or pushed off its sheet — and play, pause, scrub and replay were exercised again.

## 2026-09-09 (later): the hero fills the window, and says so at its foot

The header is sticky but still holds its place in normal flow, so the hero has exactly
one thing to subtract: `--header-h`, 72px on a desktop and 64px below 720px. The
section is `min-height: calc(100svh - var(--header-h))`, with a `100vh` line in front
of it for anything that lacks the small-viewport unit. `svh` and not `dvh`, because a
hint pinned to the bottom of a `dvh` box slides under a mobile toolbar the moment it
reappears; `min-height` and never `height`, because a short laptop, a zoomed page or a
phone that stacks the two halves has to grow the section rather than crop it.

The copy and the drawing are now one block — `.hero-lead` — centred in what is left
after the hint has taken its own row, with 8px of padding above and 34px below so the
pair reads a little above the middle of the screen rather than exactly on it. Nothing
was scaled up to fill the height: the columns, the illustration and the three phrases
on it are unchanged.

The hint is an ordinary link to the same place the button goes. It gets its own row at
the foot of the section, so it can never sit over the drawing, and it scrolls away with
the hero instead of following the page down — a hint that stays is a control, and this
is not one. Its visible part clears the bottom of the window by 28px plus whatever a
phone's home indicator needs. The arrow makes one slow 5px move and returns, gated on
an `IntersectionObserver` so it stops the moment the hint leaves the screen, and
`prefers-reduced-motion` removes the animation and leaves smooth scrolling already
turned off by the page's existing reset.

Anchors now carry `scroll-margin-top: calc(var(--header-h) + 10px)`. Every in-page
link on the page had been landing underneath the sticky header; this fixes the two
hero actions as well as the new hint.

On a phone the two halves stack and the hero is taller than the window on its own, so
the hint sits at the end of the section rather than at the bottom of the first screen.
That is the trade the brief asks for: readable content first, and no compression to
force one screen.

## 2026-09-09: the hero is one illustration, with three phrases written on it

The hero used to build its right half out of parts: the film's paper texture, a pose
lifted from the film's character sheet, a hand-rolled SVG wireframe, a plant, and five
handwritten annotations positioned against a rotated box. It never held together. The
person could only ever show half a torso, because the sheet had to hide where the
sprite ended; the wireframe was ruled and regular next to hand-drawn paper; and the
annotations sat close enough to the torn edges to read as separate floating layers.

It is now one supplied illustration — `web/public/hero/goodidea-hero-illustration.webp`,
1374×1145, 104 KB — that already contains both people, the draft, the spare sheets, the
note, the plant, the wireframes, the crossed-out version and the green marks. Nothing
in CSS or SVG redraws any of it, and nothing pretends the file has layers it does not
have.

**The file is not transparent, and it does not need to be.** Its ground is `#faf8f2`;
the page's `--paper` is `#fbf8f2`. Sampled across all four edges of a rendered
1440×900 screenshot, the largest difference is one step in the red channel — there is
no rectangle to hide, so there is no mask and no blend mode. Blend modes were the
tempting fix and they are the wrong one: they would shift the skin and paper colours
to hide an edge nobody can see.

**The words are DOM, because the picture serves three languages.** The artwork ships
without lettering on purpose. Three phrases are laid over it, each positioned as a
percentage of the image and turned to the angle of the paper under it, measured off
the artwork itself: the long rule near the top runs from (31.3%, 25.6%) to
(69.1%, 31.2%), so the title above it turns +7°; the ring is centred at (70.8%, 53.8%)
with radii 13.1% and 10.25%, and the phrase inside it barely turns at all; the short
rule at the foot runs at -3°. One rotation for all three would put at least two of
them at a visible angle to the line they belong to.

**The ring's line breaks are in the copy.** An ellipse is only wide across its middle,
so a block of text set to a width will always push its first and last lines out
through the curve. The three languages carry their own breaks, and each block's
corner distance is checked against the ellipse: 0.77, 0.61 and 0.66 of the way to it.

**45 / 55, and a headline that can carry its half.** The drawing is the wider element
and the headline is the heavier one; a large drawing beside small type reads as
decoration with a caption. The headline cap went from 42px to 53px, and the Chinese
and Japanese headlines now carry one clause per line in the copy itself, because
`word-break: auto-phrase` is Chrome-only and does not segment Chinese — it had been
splitting 可以 and 着手できる down the middle. English stays one sentence and wraps
where the column ends.

**The movement is 16px, and it is one object.** The image and the three phrases sit in
the same transformed element, so they cannot drift apart; there is no rotation,
because turning a rectangular picture on a flat ground is exactly what would show its
edges. Scrolling writes one custom property and CSS does the rest, so no component
state changes while scrolling; it stops entirely off screen, on phones, and under
`prefers-reduced-motion`. On a phone only the title stays: the other two phrases would
land under the page's own reading floor at that width.

## 2026-09-08 (later): one page language, and the demo first

The page was carrying three visual systems at once — a purple-and-coral marketing
skin, a sage-and-paper film inside it, and a dark closing band — and the order asked a
visitor to read seven output cards before reaching the thing that explains them. Both
are now one.

- **One palette, defined in `web/`.** Warm white ground, graphite text, and a sage
  green dark enough to be a real primary at text size. Light sage carries selection,
  proposals and quiet emphasis; the three professional identities (research ochre, UX
  blue-grey, engineering brown) stay identities rather than a colour per section. The
  outer purple glows, the purple explanation box and the dark purple closing gradient
  are gone. The semantic tokens are re-pointed in `web/src/styles.css`, not in
  `shared/studio/`, which the private product also consumes.
- **One mark.** The site's G path is now drawn in the page header, the footer, the
  workspace bar inside the film, GoodIdea's own card and the closing frame. The film's
  italic lowercase `g` is gone. One shape, one colour, three sizes.
- **One typeface for the interface.** Body, navigation, status, the decision card and
  every control are the system sans. The handwritten face is left to the idea in the
  creator's own words, real annotations and ink.
- **Order: position → demo → output → who decides → close.** The film is the argument,
  so nothing stands between the hero and it. The hero carries a short live panel
  instead: three signed contributions arriving, GoodIdea combining them, one decision
  that is the visitor's, and a draft filling in behind it — the product's shape, not
  the case. The case belongs to the demo and to the output section under it; in the
  hero its title and its prices made the page read as the website of a quoting tool.
  The panel runs once and rests; it is not the old route map and it never loops.
- **The output is a draft and two groups.** One sheet carrying the first sentence, the
  direction and the sketch; beside it what version one does and does not do; and, in a
  disclosure, acceptance, unverified assumptions and implementation tasks. No boundary
  is hidden behind a summary.
- **How it works and what stays yours are one section.** Three steps of the actual
  behaviour, then three principles. The product's own goals — editing on the map,
  asking for changes inside a running prototype — are stated as goals, because the
  public film does not have those interactions.
- **The boundary is stated once, in full, at the end.** A short "concept film, fixed
  example" stays beside the player and the unverified items keep their own marks, but
  the paragraph is not repeated per section.

### The decision, and the pointer that presses it

The button had drifted away from the card that asks the question: it hung at the
bottom edge of the sheet, separated from the proposal by a band of nothing, and the
simulated pointer was aimed at a coordinate written down separately from it — so the
arrow's point landed several pixels above the control it was pressing, and pressing it
moved the control further away.

- The control is now the last thing inside the decision card, in ordinary flow, after
  what is being asked, the proposal, what it says, what it gives up this round and who
  it came from. It finishes inside the sheet with room to spare in every language.
- The pointer no longer carries a coordinate. The timeline says which control it is
  going to and how far along it is; the stage resolves both from the box it has
  actually laid out and carries that through the sheet's own transform. The arrow's
  point (4, 2 of its 24-unit sprite) is the one hotspot: the sprite is placed by it,
  the press scales around it, and the ripple is centred on it.
- Every mark drawn on a sentence — the strike through the first description, the
  underline on a finding, the circle around an open question — is generated from the
  box that sentence occupies, so a longer translation moves the words and the ink
  together. The strike used to cross one of the two lines it was cancelling, and the
  underline stopped two thirds of the way through the English line.
- The approach finishes a frame before the beat it is named for, so the frame at
  "arrive" is already settled on the control rather than still reaching for it.

### The phone reads one block at a time

Shrinking a 760-unit stage and calling the result readable was the previous answer.
Sizes are now chosen from the pixels a 390px screen actually shows: sentences at 15–16
px, secondary lines and labels at 12–13. A sheet shrunk to the edge of the desk may be
smaller, because it is a trace of a contribution rather than something to read.

- The draft gets a taller sheet in the narrow composition rather than smaller type,
  and comes forward to 1.2 for the decision and the client's view — a close-up, so the
  question, the trade-off and the control are all at reading size in one shot.
- From the moment GoodIdea starts combining, the phone shows exactly one block: the
  fusion card, then the decision, then the client's view. The team's sheets, the status
  strip and the creator's own line stand aside for all three and come back together at
  the end. The decision card names all three contributors itself.
- Four labelled stages do not fit a phone's top bar at reading size, so only the stage
  the film is in is named; the rest keep their number.
- CJK headings take back the negative tracking, break by phrase where the browser can
  segment, and balance — so a two-clause sentence breaks at its own comma instead of
  through the middle of a word.

### The end of the film

The clock runs in raw seconds and the picture is sampled from quantised ones, and the
two disagree by less than a frame at the end. Asking "is it finished?" in raw seconds
left the transport offering "play" at a film that had stopped, and the read-out one
second short of the length the page states. Both now ask in frames.

## 2026-09-08: the AI team made visible

The landing page's demo is now a paper stop-motion film of about 70 seconds, in
`web/src/studio/paper/`. A freelance designer's quoting problem becomes an idea; three
specialist agents contribute; GoodIdea combines those contributions into one decision;
the product draft changes only after the creator confirms it; the client's view answers
the three questions the film opened with. The length is derived from the script
(`PAPER_SECONDS`), so the page can never promise a number the film does not run.

- **Agents have an identity, not an avatar.** Research · Mira, UX · Luca and
  Engineering · Kai. The role leads and the name follows, because what a viewer needs
  is the kind of work. Each is one mark colour — ochre, slate blue, brown — held away
  from GoodIdea's own sage so the system and its team never read as one voice. A sheet
  carries its signature in print at reading size; once it has shrunk to the edge of the
  desk, a small marker takes over. No ring of faces was added.
- **A contribution can answer an earlier one, and it says so.** UX opens by quoting the
  research it picked up. Engineering quotes UX's open question, circles that line on
  UX's own sheet, and proposes a lighter first version instead. The rail marks both
  with the initial of the agent being answered. Nothing became a chat log.
- **The team rail is support, not a third panel.** 238 of the project space's 1348
  units — under a fifth. Each agent shows at most two lines: what it is doing now, and
  what it has handed in. A status changes only when the film has actually shown that
  contribution, so nothing spins or blinks; the bottom line is GoodIdea's own count,
  from “waiting to start” to “3 contributions → 1 decision for you”.
- **The synthesis is shown, not asserted.** Three signed contributions arrive in a
  fusion panel, where they agree gets stated, what is still a trade-off gets stated,
  and only then does one decision reach the draft. This is the ~2 seconds the film grew
  by; no other beat was sped up to pay for it.
- **The phone gets the same story, not a squeezed desk.** A compact team strip under
  the top bar, the full signature on whichever sheet is being read, and a summary card
  that takes the upper half while it is open — the strip and the creator's line step
  aside for it and come back before the decision. The client preview puts collaboration
  away entirely; the ending keeps the three sheets, the designer, the result and the
  brand.
- **Opening frame and reduced motion.** The film does not autoplay. Its poster is the
  moment the story is about — the designer, the quote, the three questions — rather
  than an empty desk. Under `prefers-reduced-motion` there is no timeline: ten settled
  stills the visitor steps through, plus a written version of every scene.
- **No web font was shipped with the film** — until 2026-09-09, when the page began
  shipping one per language and the film joined it. The hand role is kept as a name so
  the sheets still say which text is a mark on paper, but it no longer swaps the family
  to say it: the paper texture, the pencil, the pinned note and the green rules are the
  handwriting. What the earlier note got right is why it was never solved locally — a
  Chinese-only subset would have left English and Japanese half-rendered; the answer
  was three subsets cut from the site's own copy, not one.
- **Assets.** `web/public/paper-film/` holds the four textures as WebP (456 KB in total,
  down from 7.2 MB of PNG). The character sheet stays near-lossless because its
  transparency is derived at composite time from its own colours — see
  `designer-source.md` next to it before touching that filter.

The film's `<footer>` and `<header>` became plain elements after the page's global
`footer` rule reached inside it and set a 150px minimum height and a monospace face.
Nothing inside the film uses a bare element the page styles.

## 2026-09-06: a one-minute concept film

The main demo now tells a 60-second story: frustration → a clear flow → prototype → a new idea → version one → coding-agent handoff → imagined use, then a stable invitation to explore. The earlier conversation, map and transport specifications below remain design history for the detailed walkthrough at `/lab/?view=story`.

Each shot emphasizes one visible change. The same client message, change sheet and confirmed first item connect the beginning to the outcome. A dark violet stage, soft light, moving connections and paper prototype replace unexplained simulated clicks. Three short typed lines carry the person's growing desire to build. Implementation after the handoff is explicitly abstract; the final use scene is a future scenario.

The independent local prototype opens outside the film and pauses playback. Replay and seeking preserve edits. Static output and the downloadable Markdown still read the full canonical `storyCopy` data. One animation-frame clock drives continuous motion, freezes on pause/backgrounding, and gives way to manual scenes under reduced motion. An expandable written script offers scene navigation. Headings, art and captions have separate areas; natural CJK line breaks prevent headings from intruding on the hero map. Real visitor comprehension and conversion remain unmeasured.

## Decisions

| Decision | Implementation | Reason |
| --- | --- | --- |
| Brand character | Warm violet, coral, and teal replace Forge's cool engineering blue | GoodIdea receives incomplete ideas before it constrains them. The visual tone should invite a start while still signaling honest boundaries. |
| Primary color | Warm grape violet `#7A3F9F` | The previous blue-violet read as blue on a cool surface and across large controls. The warmer violet still means exploration/current action while feeling less like a generic SaaS tool. White text has about 6.91:1 contrast. |
| Semantic colors | Teal `#087B66` for supported/completed states; coral `#BC4637` for boundaries and caution | Evidence and risk should not collapse into one brand color. Text and symbols always accompany color. |
| Foundation colors | `#FFFAF7` background and `#241936` text | The warm surface reduces the blue cast and feels less like an audit console while keeping approximately 15.99:1 body contrast and 6.30:1 muted-text contrast. |
| Page order | Purpose and audience, then a readable output example, then the demo, then how it works, then what the visitor keeps control of, then a way back in | A visitor who only scrolls has to be able to answer four questions: what this is, when it is for me, what I end up holding, and how to try it now. The output example comes before the demo because it is the only one of those four that used to require several clicks. |
| Hero composition | A promise on the left and an explored map on the right | The map argues rather than decorates: it shows an idea refusing tempting shortcuts before it becomes something buildable. A decorative field looked good and said nothing about the product. |
| Hero language | The headline names the job — turning an idea into a first-version plan a coding AI can pick up — and the map's landmarks name real steps rather than abstractions | “Evidence / decision / boundary” told a visitor the shape of a process without telling them what they would get. The brand line about an idea not being a straight line still exists, one level quieter. |
| Output example | A static page of what the walkthrough leaves behind — direction, concept prototype, version one, handoff — assembled in `studio/story/handoffPackage.ts` from the walkthrough's own copy | Value that only appears after a hundred seconds of playback is value most visitors never see. Building it from `storyCopy` rather than restating it means the page, the demo and the downloadable package cannot drift apart, in any of the three languages. |
| Headline treatment | The headline is one complete sentence, no longer split across two lines or carrying a gradient | The gradient served the metaphor of exploration becoming action. The headline now states a concrete job, and splitting it breaks in a different place in each of the three languages, which works against reading it in one go. |
| Brand mark | An open G-shaped path with a coral spark replaces the letter inside a rounded square | The open path represents an idea that can still be explored; the spark marks the moment it becomes a clear next step. A custom vector mark feels intentional at header, demo, and footer sizes. |
| Action icons | Matching 16px rounded-stroke SVG icons for scrolling and opening implementation | Font arrow glyphs change weight and geometry across platforms. A shared stroke system keeps the two first-view actions visually related. |
| Shape system | Layered 12–26px radii | Softer shapes reduce the distance of an engineering console. Different radii distinguish controls, content cards, and the product demo. |
| Demo priority | The demo remains the page's largest object, and it changes shape: conversation beside the idea map, then the prototype taking the room, then one question on its own | Product behaviour is more persuasive than a feature list, and the behaviour worth showing is an idea becoming something you can click. Keeping the whole story inside one three-column frame would have made the prototype the smallest thing on screen. |
| Watch or explore | The demo opens on a readable first turn with two ways in, and a transport bar that keeps one position and one height across every state | Requiring a visitor to click their way to the point is the same mistake as hiding the output. Playback and exploring are separate states: touching the prototype pauses the story, and nothing the visitor does there is ever cleared by a replay. |
| Closing band | The dark panel now carries the way back into the demo rather than a statement of principles | The heaviest object on the lower page should be the next step, not a belief. The principles it used to hold are now four plainly worded lines about what the visitor keeps control of. |
| Conversation rhythm | The agent replies short and moves one question at a time; there are two natural answers and a free-text field that really sends | A visitor should recognise a conversation, not a form. No agent role labels, avatars, or status badges: the words are the interface, and the fixed options exist to make the walkthrough playable, not to interview anyone. |
| Concept state | Fragment, candidate, confirmed, unverified and superseded are carried by border style, opacity and one plain line of text | Badges would turn the map into a dashboard. Evidence and assumption are properties of a concept, not columns of their own, so the agent can never dress a passing remark as a settled conclusion. |
| Information density | The map starts as a single node and grows one visible change per turn; ten background concepts appear only once they have been said out loud | Ten empty slots would be a form to fill in. The method stays behind the interface: what the visitor reads is “a real situation is taking shape”, never “use case unlocked”. |
| CTA hierarchy | One filled primary action per view; secondary actions are outlined or textual | This keeps the next step unambiguous and prevents the demo, GitHub, approval, and revision actions from competing equally. |
| Motion | The map runs once, in under five seconds, stays on the finished state, and offers a replay | Most visitors decide within three seconds, so no beat may be load-bearing on its own, and nothing a visitor needs may sit behind a wait. Nothing already lit ever goes dark: an interrupted frame still reads. |
| Reduced motion | Animations, transitions, and smooth scrolling stop under `prefers-reduced-motion: reduce`; the hero route opens finished and the walkthrough becomes steps the visitor moves through | The same scenes in the same order, with the timer removed rather than the content. Nothing is only available to someone who can watch it move. |
| Responsive structure | Three columns on desktop; below 1080px the signposts fold into a strip and the conversation keeps the map beside it; on a phone the conversation is the page and the two side panels become real panels | Each size preserves reading order and core action instead of merely shrinking the desktop page. The map is never shrunk below a readable size: it scrolls instead. |
| Phone reading order | The hero route runs top to bottom in two columns, keeps the line that says what each landmark means, and drops two of the three refused shortcuts | The earlier compact route climbed upward, so scrolling down met the result before the work that earned it, and it saved height by deleting the explanations rather than the decoration. Meaning is the last thing to compress. |
| Content column | `--shell` holds at 1180px through laptop widths, then grows with the viewport to a 1360px cap; every section shares that one edge | A fixed 1180px left a 1920px monitor as roughly 40% margin. The cap is set by the demo: past 1360px the chat turn has already reached its reading measure, so more width would only stretch the idea field and the primary action. |
| Typography | One self-hosted family per language — Noto Sans, Noto Sans SC, Noto Sans JP — as variable fonts cut from the site's own copy, with weights used as roles (700 headline, 600 headings and controls, 500 labels, 400 body) | The page reads as one voice on every operating system instead of four, and no monospace or brush face is asked to mean something a weight already means. Only the language being read is downloaded. Chinese and Japanese labels still drop Latin-only uppercase and tracking, and use semantic break opportunities instead of splitting words such as “开始”. |
| Type scale | One scale, declared once: fluid `--fs-hero` and `--fs-h2`, then fixed 17px leads, 16px body, a 14px floor for anything that is a word or a sentence, and 12–13px reserved for all-caps labels | A headline is measured against its window; a paragraph is not, and does not become more readable on a wider monitor. The page previously ran on 8–13px for almost everything, which is below every mainstream baseline. |
| Imagery | No generic photography or decorative illustration yet | The interactive product behavior is the strongest current proof. Original brand imagery can be added when real cases exist. |

## The first view: the idea map

The map is the argument the page makes before anything is read. An idea travels a
route, is tempted by faster-looking shortcuts, refuses each one, and arrives at a
first-version plan. These notes exist so the next change does not accidentally undo
the reasons.

The route is generated from the layout rather than hand-timed: a desktop shows three
refused shortcuts and a phone shows one, and a hand-written beat table can only ever
be right for one of them. The whole run lands in under five seconds, so nothing a
visitor needs is behind a wait, and a replay control sits on the drawing for a second
look.

**The refusal is the point, so it takes three separate beats.** The idea holds still
and leans toward the wrong road, the sign is crossed out while that road is still
bright, and only then does it fade and the right one light up. Collapsing these into
one beat makes the decision invisible, which removes the only thing separating this
from a flowchart. For the same reason the wrong signs stay on the finished map at
reduced opacity — and on a narrow screen two of the three are dropped entirely rather
than dropping the line that says what a landmark means. A phone reader who is given
“boundary” without “what this version will not do” has been given a word, not a step.

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

## The demo: one story, in the shape each chapter needs

The demo is a fixed storyboard with no agent behind it. It tells one story — a
freelancer trying to keep track of a client's change requests — and the landing page
tells no other, so the example on the page, the example in the walkthrough and the
example in the downloadable package are the same one.

**The layout is not fixed for the whole run.** The first two chapters are the
conversation beside the idea map; from the moment the prototype exists it takes the
room and the conversation moves to a column; the last screen is one question on its
own. Three layouts, one height: the demo window is the same size in all of them, so
nothing below it moves under a visitor who is reading it.

**The map narrows rather than only growing.** Four arrangements and then the flow:
the sentence, the pile of things mentioned, the finding, the shape it suggests — and
then the loose findings are redrawn as the four steps of a route. Node text is
measured at runtime, because the same node is one line in English and two in
Japanese, and anything that would sit on top of a node above it is pushed clear.

**The prototype is a real thing, not a screenshot.** One change list with two sides:
the designer checks it, the client confirms it item by item. Pasted chat is cut into
change items locally, on line breaks and sentence enders, and each item keeps the
sentence it came from — the page says so, because understanding what "that thing from
last time" refers to is the part that needs a model, and this page has none.

**Every turn that earns one pays out a visible change**, and the change is a line in
the transcript rather than only a movement in the pane: on a phone the pane is a tap
away, and the change still has to land.

## Watching it, and exploring it

The demo has three states: the first turn with two ways in, playback, and exploring.
Two rules hold them apart.

**Playback is derived, not replayed.** `studio/story/storyScript.ts` builds eighteen
scenes, and each one carries the whole screen — layout, pane, map and prototype —
rather than a change to it. The conversation at any scene is the scenes so far,
concatenated. That is what lets a chapter chip jump straight to the handoff without a
turn arriving twice, and what keeps the pane and the text from falling out of step. A
scene's hold is derived from the text on screen, with a longer dwell on the beats that
have something to read, and the whole run lands between one hundred and five and one
hundred and ten seconds in all three languages. The page never carries a written
length: it is filled in from the run.

**One timer, owned by an effect.** `studio/autoDemo.ts` is a plain reducer with no
timers in it; the component arms a single `setTimeout` and clears it whenever anything
changes. A timeout that survives a pause is ignored by the reducer as well, so pausing
stops the typing, the conversation and the pane together. Playback is held, not
cancelled, while the tab is in the background.

**Exploring stops the story rather than racing it.** While the walkthrough plays, the
prototype is a picture with no controls in the tab order, and one button on top of it
pauses playback and hands it over. From then on the visitor drives their own copy of
the prototype state, which the script never writes into and never clears: replaying or
jumping chapters leaves what they typed exactly where it was, and the fixed
walkthrough goes on showing its own screen. The three directions work the same way —
pressing one pauses, answers with something specific, and comes back to the same
screen.

Under `prefers-reduced-motion: reduce` nothing advances on a timer. The same eighteen
scenes stay, with previous/next controls and the chapter chips, so the content and the
order are unchanged and only the automatic motion is gone.

## The type scale

The page is built on five sizes, declared as `--fs-tag` through `--fs-lead` in
`web/src/styles.css`, and nothing else may invent a sixth.

| Token | Size | Used for |
| --- | --- | --- |
| `--fs-lead` | 17px | The hero intro, the closing band's paragraph, and what the agent says in the demo |
| `--fs-body` | 16px | Default prose: every paragraph, list, and the idea field |
| `--fs-small` | 14px | Captions, notes, signposts, answers, and every word on the idea map |
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
markers, not sentences. Nothing smaller than 12px is left on the page except a few
decorative `aria-hidden` symbols.

**Leading came down as size went up.** Body prose is 1.7 and small text 1.6–1.75,
which stays above the 1.5 that WCAG 2.2 Text Spacing expects of a paragraph while
avoiding the loose 1.85 that 11px text needed.

Two layouts had been tuned around the old sizes and had to move with them: the two
first-view actions stack instead of sharing a row, and the idea map takes the full
page width from 1120px down rather than 980px.

## Accessibility baseline

- Normal text combinations are checked against the WCAG 2.2 minimum contrast ratio of 4.5:1.
- State is communicated with text and symbols as well as color.
- Keyboard focus remains visible and a skip link is available. Every playback control —
  play/pause, replay, and the four stage chips — is a real button in tab order, so the
  walkthrough is fully operable without a pointer.
- Motion respects the operating system's reduced-motion preference, and the hero route
  finishes in under five seconds with a replay control rather than running long enough
  to need one.

References: [W3C Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [W3C Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [W3C Technique C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html), [W3C Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [Material 3 type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens), [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/), and [Apple HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography).
