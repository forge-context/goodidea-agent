# Agent capabilities: where each one lives and where its boundary is

[English](agent-capabilities.md) | [日本語](agent-capabilities.ja.md) | [中文](agent-capabilities.zh.md)

This is the map of what GoodIdea's agent is made of. Each row names a capability, the
code that implements it, the boundary that keeps it from doing more than it should,
and how far it is built. A new capability gets a new row.

The theme running through the table: **the model does the language work, and the
code keeps the authority.** Every boundary below is an answer to "what happens when
the model is wrong?"

## Capabilities

| Capability | Where | Boundary | State |
| --- | --- | --- | --- |
| Model calls | [`model/adapter.py`](../../src/goodidea_agent/model/adapter.py), [`openai_compatible.py`](../../src/goodidea_agent/model/openai_compatible.py) | One provider-neutral port. Provider quirks stay inside an adapter, so a swap is configuration. Errors map onto a closed set and never carry an upstream body. | Built |
| Structured output | [`model/structured.py`](../../src/goodidea_agent/model/structured.py) | Ask for JSON, validate against a Pydantic schema here, repair once. No provider-specific schema feature, so changing provider cannot weaken the contract. | Built |
| Understanding an idea | [`model/interpreter.py`](../../src/goodidea_agent/model/interpreter.py) | The scenario is a closed set: the model routes among paths that exist, and cannot invent one. An unsupported idea must say what the product cannot do yet. | Built |
| Web search | [`tools/web_search.py`](../../src/goodidea_agent/tools/web_search.py) | The model writes the queries; the workflow issues them. One query returning nothing is normal; a total outage stops the step. | Built |
| Evidence classification | [`workflow/evidence.py`](../../src/goodidea_agent/workflow/evidence.py) | Trust is decided from the URL, not by the page and not by the model. Pages that cannot carry attribution never become sources. | Built |
| Writing the answer | [`model/composer.py`](../../src/goodidea_agent/model/composer.py) | Every claim must cite a retained source. A reply citing anything else is sent back for correction, then refused. | Built |
| Reading the user | [`model/answer_reader.py`](../../src/goodidea_agent/model/answer_reader.py) | Agreement without a choice is stopped before the model sees it. An answer the model cannot settle records nothing. | Built |
| Product boundary | [`model/proposer.py`](../../src/goodidea_agent/model/proposer.py) | The user's decision is settled input, not something to revisit. A line on both sides of the boundary is refused. Writing a proposal approves nothing. | Built |
| Human authority | [`workflow/guidance.py`](../../src/goodidea_agent/workflow/guidance.py), [`domain/state.py`](../../src/goodidea_agent/domain/state.py) | A handoff exists only after the user approves that exact proposal. External side effects are `False` at the type level. | Built |
| Memory: the record | [`memory/sqlite.py`](../../src/goodidea_agent/memory/sqlite.py) | Evidence, decisions and approvals are written by workflow transitions only. No model path can revise them. | Built |
| Memory: the person | [`memory/working.py`](../../src/goodidea_agent/memory/working.py), [`model/note_taker.py`](../../src/goodidea_agent/model/note_taker.py) | A model may propose notes about what the user said; the user may withdraw them. A note has no source, so it can inform a question but can never become a cited fact. | Built |
| Sandbox: preview | [`tools/sandbox.py`](../../src/goodidea_agent/tools/sandbox.py) | No scripts, no network, no storage, mock data only. | Built |
| Sandbox: execution | [`tools/sandbox_exec.py`](../../src/goodidea_agent/tools/sandbox_exec.py), [`model/sandbox_author.py`](../../src/goodidea_agent/model/sandbox_author.py) | A run carries the question it settles and states what it does not settle. The container is given no network, a read-only filesystem, no capabilities and a memory, process and time limit. Where no container can start, the run is refused rather than performed with weaker isolation. Two executions that disagree have settled nothing. | Built |
| Evaluation | [`evaluation/offline.py`](../../src/goodidea_agent/evaluation/offline.py), [`model_output.py`](../../src/goodidea_agent/evaluation/model_output.py) | State transitions are checked deterministically. Real recorded model text is replayed and checked against the product rules, with no key and no network. | Built |

## Three decisions that shaped the rest

**The model does not hold the tools.** It writes search queries; the workflow issues
them. This is the most visible departure from a conventional tool-calling agent, and
it is deliberate: a product that stops at the right moment cannot also let the model
decide how many times to look something up, or when it has looked enough. The cost
is real — the agent cannot pursue an unexpected lead on its own. If evaluation later
shows that fixed research misses things a free agent would find, tool calling belongs
behind the research interface, not spread through the workflow.

**The model cannot write the record.** Two memories exist for one reason: what a user
told us about themselves is revisable, and what the product asserts is not. Keeping
them in one store would eventually let a persuasive sentence become a citation.

**The model cannot approve its own work.** Generating a proposal produces no
approval, no handoff, and no state advance. Repeated agreement never accumulates into
certainty. This is the product's whole claim — encourage action without pretending an
untested idea is safe — expressed as a type constraint rather than a prompt.

## Not built

Sub-agents, long-horizon planning, and context offloading are not implemented. The
research task currently needs the minimum sufficient evidence for one decision, and
none of the three would make that answer better today. They belong here as rows when
a measured gap asks for them, not before.
