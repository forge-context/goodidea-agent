"""Structured outputs produced by the first research vertical slice."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from goodidea_agent.domain.guidance import CodingHandoff, FeasibilityPath, MvpProposal
from goodidea_agent.domain.state import AgentState, EvidenceSource


class IdeaInterpretation(BaseModel):
    """What the agent understood without filling in missing product decisions."""

    model_config = ConfigDict(frozen=True)

    testable_behavior: Literal["automated_trade_execution"]
    desired_outcome: Literal["profitable_trading"]
    missing_decision: Literal["strategy_source"]


class ResearchTopic(BaseModel):
    """One thing the agent proposes to check, plus the query it would send."""

    model_config = ConfigDict(frozen=True)

    question: str = Field(min_length=1)
    query: str = Field(min_length=1)


class IdeaAssessment(BaseModel):
    """What a model understood about an idea before any research has run.

    ``scenario`` is a closed set of the paths this product has actually implemented,
    so the model routes but cannot invent a path. Every free-text field is written in
    the session locale.
    """

    model_config = ConfigDict(frozen=True)

    scenario: Literal["automatic_trading", "unsupported"]
    summary: str = Field(min_length=1)
    testable_behavior: str = Field(min_length=1)
    desired_outcome: str = Field(min_length=1)
    core_uncertainty: str = Field(min_length=1)
    missing_decision: str = Field(min_length=1)
    outcome_promise_risk: bool
    research_topics: tuple[ResearchTopic, ...] = Field(min_length=2, max_length=4)
    unsupported_reason: str | None = None

    @model_validator(mode="after")
    def unsupported_ideas_explain_themselves(self) -> IdeaAssessment:
        """An unsupported idea must say what this product cannot do yet."""

        if self.scenario == "unsupported" and not (self.unsupported_reason or "").strip():
            raise ValueError("an unsupported assessment requires unsupported_reason")
        return self


class ComposedFact(BaseModel):
    """One claim the agent is prepared to make, with the sources it rests on."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1, pattern=r"^[a-z0-9][a-z0-9-]*$")
    statement: str = Field(min_length=1)
    source_ids: tuple[str, ...] = Field(min_length=1)


class ComposedCard(BaseModel):
    """A market reality card written by a model from retained sources only."""

    model_config = ConfigDict(frozen=True)

    grounded_encouragement: str = Field(min_length=1)
    market_reality: str = Field(min_length=1)
    honest_boundary: str = Field(min_length=1)
    safe_validation_step: str = Field(min_length=1)
    confirmed_facts: tuple[ComposedFact, ...] = Field(min_length=1, max_length=4)
    question_prompt: str = Field(min_length=1)
    question_why: str = Field(min_length=1)


class MarketRealityCard(BaseModel):
    """Concise, cited output shown after successful research."""

    model_config = ConfigDict(frozen=True)

    grounded_encouragement: str = Field(min_length=1)
    market_reality: str = Field(min_length=1)
    honest_boundary: str = Field(min_length=1)
    safe_validation_step: str = Field(min_length=1)
    sources: tuple[EvidenceSource, ...] = Field(min_length=2)


class ExplainedQuestion(BaseModel):
    """The single user decision requested at the pause point."""

    model_config = ConfigDict(frozen=True)

    id: Literal["strategy_source", "mvp_boundary_approval"] = "strategy_source"
    prompt: str = Field(min_length=1)
    why_it_matters: str = Field(min_length=1)


class VerticalSliceResult(BaseModel):
    """Public result returned by the deterministic local workflow."""

    model_config = ConfigDict(frozen=True)

    status: Literal[
        "awaiting_user",
        "decision_recorded",
        "proposal_ready",
        "revision_requested",
        "handoff_ready",
        "research_failed",
        "unsupported",
    ]
    state: AgentState
    interpretation: IdeaInterpretation | None = None
    assessment: IdeaAssessment | None = None
    card: MarketRealityCard | None = None
    question: ExplainedQuestion | None = None
    feasibility: FeasibilityPath | None = None
    proposal: MvpProposal | None = None
    handoff: CodingHandoff | None = None
    message: str | None = None
