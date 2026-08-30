"""Serializable state records for the GoodIdea workflow.

These models contain state, not stage-transition policy. Workflow nodes must return
explicit state updates so a tool or model call cannot silently advance the product.
"""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

Locale: TypeAlias = Literal["en", "ja", "zh-CN"]


class Stage(str, Enum):
    """User-visible product discovery stages."""

    RESEARCH = "research"
    FEASIBILITY = "feasibility"
    PRODUCT_SHAPE = "product_shape"
    MVP_BOUNDARY = "mvp_boundary"
    HANDOFF = "handoff"


class StrategySourceChoice(str, Enum):
    """The two product paths the first scenario asks the user to choose."""

    EXISTING_RULES = "existing_rules"
    DISCOVER_RULES = "discover_rules"


class EvidenceSource(BaseModel):
    """A source retained for a changeable external claim."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    url: HttpUrl
    publisher: str = Field(min_length=1)
    retrieved_on: date
    source_type: Literal["primary", "authoritative", "secondary"]
    excerpt: str = Field(min_length=1)


class ConfirmedFact(BaseModel):
    """A product-relevant fact supported by retained evidence."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    statement: str = Field(min_length=1)
    source_ids: tuple[str, ...] = Field(min_length=1)


class OpenQuestion(BaseModel):
    """A user decision that the agent must not silently make."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    prompt: str = Field(min_length=1)
    why_it_matters: str = Field(min_length=1)


class ProductDecision(BaseModel):
    """A consequential product choice explicitly made by the user."""

    model_config = ConfigDict(frozen=True)

    id: Literal["strategy_source"] = "strategy_source"
    choice: StrategySourceChoice
    statement: str = Field(min_length=1)
    decided_by: Literal["user"] = "user"


class ApprovalRecord(BaseModel):
    """Human approval tied to the exact proposal that was reviewed."""

    model_config = ConfigDict(frozen=True)

    id: Literal["mvp_boundary"] = "mvp_boundary"
    proposal_id: str = Field(min_length=1)
    approved_by: Literal["user"] = "user"


class AgentState(BaseModel):
    """Checkpoint-safe state shared by deterministic workflow nodes."""

    model_config = ConfigDict(frozen=True)

    idea: str = Field(min_length=1)
    locale: Locale = "en"
    current_stage: Stage = Stage.RESEARCH
    completed_milestones: tuple[str, ...] = ()
    confirmed_facts: tuple[ConfirmedFact, ...] = ()
    evidence_sources: tuple[EvidenceSource, ...] = ()
    open_questions: tuple[OpenQuestion, ...] = ()
    product_decisions: tuple[ProductDecision, ...] = ()
    approvals: tuple[ApprovalRecord, ...] = ()
    next_milestone: str | None = None
    external_side_effects_allowed: Literal[False] = False

    @model_validator(mode="after")
    def confirmed_facts_reference_retained_sources(self) -> AgentState:
        source_ids = {source.id for source in self.evidence_sources}
        missing = {
            source_id
            for fact in self.confirmed_facts
            for source_id in fact.source_ids
            if source_id not in source_ids
        }
        if missing:
            missing_list = ", ".join(sorted(missing))
            raise ValueError(f"confirmed facts reference unknown sources: {missing_list}")
        return self
