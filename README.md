# GoodIdea

[English](README.md) | [日本語](README.ja.md) | [中文](README.zh.md)

**Turn a vague idea into an evidence-backed, testable MVP—one decision at a time.**

GoodIdea is a product guidance agent for people who are ready to build with AI but
have not yet defined what should be built. It helps users investigate the market,
surface the most important uncertainty, test feasibility, narrow the MVP, and
prepare a clear handoff for a coding agent.

> GoodIdea encourages action without pretending that an untested idea is guaranteed
> to succeed.

## Why GoodIdea

Coding agents can produce screens and code before the user, problem, constraints,
and product boundary are clear. The result may be technically functional while
still being the wrong product.

GoodIdea delays implementation only as much as necessary to answer the next
high-impact question. Progress means reducing critical uncertainty—not completing
more documents.

## Intended experience

```text
Vague idea
  -> evidence-backed market research
  -> feasibility and resource check
  -> optional sandbox demo
  -> product shape and MVP boundary
  -> human confirmation
  -> coding-agent handoff
```

The path is dynamic. GoodIdea can move backward when new evidence invalidates an
assumption, and it asks one useful question at a time instead of presenting a long
questionnaire.

Each stage shows:

- what has been established;
- what remains uncertain;
- why the next question matters;
- whether the idea is ready to move forward.

## Example

Given a vague request such as “Build an automatic stock-trading product that makes
money,” GoodIdea should not promise returns or begin designing screens. It first
checks the existing market and technical reality, separates automatic execution
from profitable strategy discovery, and proposes a lower-risk validation loop such
as paper trading before real-money integration.

The first deterministic offline demo runs without an LLM or live search:

```bash
PYTHONPATH=src python -m goodidea_agent.demo --locale en
PYTHONPATH=src python -m goodidea_agent.demo --locale en \
  --database goodidea.db --session demo-1
```

Run the same offline workflow through the local API:

```bash
PYTHONPATH=src GOODIDEA_DATABASE=goodidea.db \
  uvicorn goodidea_agent.api.app:app --reload
```

The local API exposes the complete offline flow:

- `POST /api/v1/sessions/{id}/research`
- `POST /api/v1/sessions/{id}/answers`
- `POST /api/v1/sessions/{id}/proposal`
- `POST /api/v1/sessions/{id}/approval`
- `GET /api/v1/sessions/{id}/sandbox-preview`
- `GET /api/v1/sessions/{id}`

FastAPI serves the local OpenAPI UI at `/docs`.

Run the three-language static landing page and fixed interactive demo:

```bash
cd web
npm install
npm run dev
```

The production build uses `npm run build`, and `npm run deploy` builds and uploads
it with Wrangler. The command flow and the `SITE_URL` variable that writes the
absolute URLs are documented in
[Deploy the landing page to Cloudflare Pages](docs/deployment/cloudflare-pages.md).
The color, hierarchy, motion, and accessibility decisions are recorded in the
[LP visual system and rationale](docs/design/lp-visual-system.md). What the agent is
made of, and where each capability's boundary is, is recorded in
[Agent capabilities](docs/design/agent-capabilities.md).

Run the deterministic Agent evaluation suite:

```bash
PYTHONPATH=src python -m goodidea_agent.evaluation.offline
```

Model configuration is optional. Without it the workflow stays fully deterministic;
with it, a model assesses the idea instead of a keyword match. Copy `.env.example`
to `.env`, set the `GOODIDEA_MODEL_*` values, then record real answers as fixtures
so model-dependent tests survive an expired key:

```bash
set -a && source .env && set +a
PYTHONPATH=src python -m goodidea_agent.model.record
```

## MVP scope

The first vertical slice will support this flow:

1. Accept one vague product idea.
2. Use web search to produce a short, cited “market reality card.”
3. Identify the largest unresolved product assumption.
4. Explain and ask one high-value follow-up question.
5. Update visible stage progress.
6. Produce an initial, testable MVP definition.

Detailed contract: [Vertical Slice 01 — vague idea to market reality card](docs/acceptance/vertical-slice-01.md).

The public landing page contains a deterministic, clearly labeled example demo. It
does not call the live agent. The real agent implementation runs locally during the
first MVP phase.

## Languages

Repository documentation is maintained in English, Japanese, and Simplified
Chinese. The product UI will target the same three languages when it is
implemented. Locale-specific presentation must not change product-stage decisions
or evidence rules.

## Proposed architecture

```text
React + TypeScript + Vite
          | REST / SSE
          v
FastAPI + Pydantic
          |
          v
LangGraph workflow
  |-- model adapter
  |-- web-search adapter
  |-- structured memory
  |-- sandbox adapter
  `-- coding-agent adapter
```

Initial technology choices:

- **Frontend:** React, TypeScript, and Vite; static deployment on Cloudflare.
- **API:** Python, FastAPI, and Pydantic.
- **Workflow:** LangGraph for explicit state, interruption, resumption, and routing.
- **Model:** any OpenAI-compatible Chat Completions endpoint behind `ModelAdapter`;
  structured output is validated locally with Pydantic instead of a provider-specific
  schema feature, so replacing the provider cannot weaken the contract.
- **Web search:** Tavily behind `WebSearchAdapter`; deterministic tests use a fake adapter.
- **Memory:** SQLite with structured records for decisions, evidence, resources,
  and unresolved questions.
- **Sandbox:** a mock-data HTML preview for review, and container execution with no
  network, a read-only filesystem and dropped capabilities for the one check that
  settles a named uncertainty. Without a container runtime the run is refused.
- **Evaluation:** deterministic state-transition tests plus scenario-based agent
  quality evaluation.

## Agent and harness decisions

GoodIdea uses LangGraph to keep product-stage transitions explicit and testable.
The model may choose tools inside an authorized stage, but it does not decide that
a product is validated or silently advance the user to implementation.

The adapter boundaries borrow the composability idea of agent harnesses such as
DeepSeek Harness without depending on its developer-preview runtime.

Deep Agents is intentionally not a V1 dependency. The initial research task should
use the minimum sufficient evidence. If evaluation later shows that research needs
long-horizon planning, context offloading, or subagents, a Deep Agents implementation
can be added behind the research-agent interface.

## Product principles

- Praise concrete progress, not hypothetical commercial success.
- Separate evidence, assumptions, and user decisions.
- Never turn repeated “yes” answers into product certainty.
- Prefer one meaningful question over a long checklist.
- Use a demo to resolve a named uncertainty, not to disguise unfinished discovery.
- Keep consequential decisions and external side effects under human control.

## Status

GoodIdea now has a deterministic offline LangGraph workflow for the first automatic-
trading scenario. It uses curated fake search results, produces a cited market
reality card, updates milestone state, and pauses at one explained user decision.
The offline workflow now runs from research through human decision, constrained
feasibility, MVP proposal, approval, and coding-agent handoff. Vague agreement does
not choose a path, and an unapproved proposal cannot create a handoff. SQLite keeps
validated snapshots, evidence, open questions, product decisions, and approvals. A
no-script, no-network sandbox adapter renders a reviewable mock preview, and the
offline evaluation checks grounding, user authority, language parity, proposal
identity, and side-effect safety.

The React/Vite landing page is implemented in English, Japanese, and Simplified
Chinese. Its interactive demo uses fixed browser data and is ready for a static
Cloudflare Pages build.

The model boundary is implemented: `ModelAdapter`, an OpenAI-compatible adapter, a
scripted fake, and recorded fixtures that replay by prompt rather than by provider.
Structured replies are validated against Pydantic schemas and repaired once, so no
provider-specific schema feature is required. A configured model assesses the idea. Adding a
Tavily key makes the whole research step real: the model writes the search queries,
Tavily answers them, and the market reality card is written from what came back.
Trust in a source is decided from its URL rather than by the model, pages that
cannot carry attribution are never cited, and a reply citing a source that was not
retrieved is sent back for correction before it can be used. The MVP boundary is written the same way: the
feasibility path, what the first version includes and excludes, its acceptance
criteria and build order are composed for this session's own decision and evidence,
and a boundary listing the same item as both included and excluded is rejected
before the user sees it. Generating a proposal still approves nothing. The user's answer is read the same way: a reply in
their own words is understood rather than matched, and it is said back to them in
those words. Agreement without a choice never reaches the model, so "yes" cannot
become a product path, and an answer the model cannot settle asks again in terms of
what the user actually said. Without configuration the workflow stays keyword-driven
and deterministic. Brokerage integration and a public agent service remain
disabled.

Acceptance contract: [Vertical Slice 02 — human decision to coding handoff](docs/acceptance/vertical-slice-02.md).
