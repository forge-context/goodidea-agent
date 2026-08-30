# Vertical Slice 02: Human decision to coding handoff

[English](vertical-slice-02.md) | [日本語](vertical-slice-02.ja.md) | [中文](vertical-slice-02.zh.md)

Status: Implemented offline contract

## Purpose

Prove that GoodIdea can resume after the first human decision, define a constrained
feasibility path, propose an MVP boundary, and create a coding-agent handoff only
after the user approves that exact proposal.

## Required flow

1. A vague agreement does not select a product path.
2. An explicit strategy-source answer is stored as `decided_by=user`.
3. The selected path produces a feasibility artifact and an MVP proposal.
4. The proposal separates included behavior, excluded behavior, assumptions, user
   flow, and acceptance criteria.
5. A revision request keeps the proposal unapproved and creates no handoff.
6. Human approval is tied to the proposal ID.
7. Only then is a coding handoff created and the stage changed to `handoff`.

## Safety boundary

Both automatic-trading paths prohibit real-money orders and profit guarantees. The
execution path uses one user-supplied rule and paper orders. The discovery path only
compares fixed, transparent candidates and does not recommend a strategy.

## Acceptance criteria

- Evidence, product decisions, open questions, and approvals remain separate.
- SQLite can restore the complete result and query the current decision and approval.
- The API rejects transitions attempted out of order.
- The handoff retains acceptance criteria, evidence IDs, constraints, and human approval.
- External side effects remain disabled.
- English, Japanese, and Chinese produce the same semantic stages and boundaries.

## Public demo boundary

The landing-page demo mirrors this flow with fixed browser data. It is explicitly
labeled and never calls the API, Tavily, an LLM, a broker, or a coding agent.
