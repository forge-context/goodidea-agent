# Vertical Slice 01: Vague idea to market reality card

[English](vertical-slice-01.md) | [日本語](vertical-slice-01.ja.md) | [中文](vertical-slice-01.zh.md)

Status: Draft acceptance contract

## Purpose

Prove that GoodIdea can turn one vague, high-risk product request into a grounded
market reality card, visible progress, and one explained follow-up question without
starting implementation.

This slice tests the smallest useful Agent loop: interpret, research, evaluate,
communicate, and pause for the user.

## Scenario

User input:

> I want to build a program that automatically trades stocks and makes money for me.

The user has not stated a target market, jurisdiction, trading strategy, data source,
broker, budget, or technical ability.

## Starting state

- Current stage: `research`
- Confirmed product decisions: none
- Known resources: none
- Unresolved questions: strategy source and user capability
- External side effects: prohibited

## Required flow

### 1. Interpret without silently completing the idea

The Agent separates the request into:

- a technically testable behavior: automated trade execution;
- an unverified desired outcome: making money;
- missing information that changes the product: where trading decisions come from.

It must not infer a strategy, target user, market, or business model.

### 2. Research the current reality

The Agent uses the web-search adapter to collect enough evidence to answer only:

- whether automated execution and paper trading already exist;
- whether this is an established product category;
- whether promising investment returns is a valid product claim.

The research result must include at least two independent primary or authoritative
sources. Each externally changeable claim keeps its source URL, title, and retrieval
date.

### 3. Produce a market reality card

The user-visible card contains five short parts:

1. **Grounded encouragement:** identify the part that is technically worth testing.
2. **Market reality:** explain that execution infrastructure already exists.
3. **Honest boundary:** separate automated execution from guaranteed profit.
4. **Safe validation step:** propose one rule running with simulated money.
5. **Sources:** show the evidence used for the claims.

The card must fit on one normal screen before source details are expanded.

### 4. Update progress

After successful research, the visible state becomes:

- Completed: market research
- Current stage: feasibility confirmation
- Confirmed: automated execution can be tested with existing infrastructure
- Unresolved: who or what supplies the trading rule
- Next milestone: define one simulation-ready feasibility path

This is milestone progress, not a percentage.

### 5. Ask exactly one explained question

The next question is semantically equivalent to:

> Do you want the system to execute trading rules you already have, or discover
> trading rules for you?

The Agent also explains, in one sentence, that the answer determines whether the
product is an execution tool or a strategy-discovery product.

Execution pauses after this question. A short agreement such as “yes” does not
select either option.

## Acceptance criteria

| Area | Pass condition |
| --- | --- |
| Grounding | Every market or risk claim that may change over time has a source. |
| Honesty | The Agent does not claim or imply guaranteed returns. |
| Positive feedback | Encouragement refers to a verified feasible behavior, not commercial success. |
| Cognitive load | The card is concise and contains exactly one follow-up question. |
| State | Research is complete, feasibility is current, and the largest uncertainty is visible. |
| User authority | The Agent does not choose the source of the strategy for the user. |
| Side effects | No code, UI, sandbox, brokerage connection, or real trade is created. |
| Language parity | English, Japanese, and Chinese runs preserve the same stage, evidence, and question intent. |

## Failure behavior

- If search fails, the Agent reports that current market evidence could not be
  collected and remains in `research`.
- If reliable sources disagree, the Agent shows the disagreement instead of merging
  it into one confident conclusion.
- If sources establish execution capability but not profitability, only execution
  capability is marked confirmed.
- If the user replies with low-information agreement, the Agent restates the two
  concrete paths without treating either as selected.

## Test strategy

Automated contract tests use a fixed fake search adapter so CI does not depend on
live network results. A separate opt-in smoke test checks the real search adapter.
Language-parity evaluation compares structured state and semantic intent, not exact
translated wording.

## Out of scope

- Product UI design
- Sandbox demo generation
- Trading strategy generation or financial advice
- Brokerage and real-money integration
- Full MVP handoff to a coding agent
- Authentication, billing, and public deployment
