"""Validated artifacts produced after the first human product decision."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.state import StrategySourceChoice


class FeasibilityPath(BaseModel):
    """A safe, testable path through the largest technical uncertainty."""

    model_config = ConfigDict(frozen=True)

    id: StrategySourceChoice
    verdict: Literal["feasible_with_constraints"] = "feasible_with_constraints"
    summary: str = Field(min_length=1)
    constraints: tuple[str, ...] = Field(min_length=1)
    validation_steps: tuple[str, ...] = Field(min_length=1)
    success_signals: tuple[str, ...] = Field(min_length=1)


class MvpProposal(BaseModel):
    """A reviewable product boundary; it is not approved merely by being generated."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    promise: str = Field(min_length=1)
    target_user: str = Field(min_length=1)
    included: tuple[str, ...] = Field(min_length=1)
    excluded: tuple[str, ...] = Field(min_length=1)
    user_flow: tuple[str, ...] = Field(min_length=1)
    acceptance_criteria: tuple[str, ...] = Field(min_length=1)
    assumptions: tuple[str, ...] = Field(min_length=1)
    # Empty on the deterministic path, where the build order is fixed per locale.
    implementation_order: tuple[str, ...] = ()


class ComposedProposal(BaseModel):
    """A feasibility path and MVP boundary written by a model for one decided path.

    Generating this does not approve it. It is the object the user is asked to confirm,
    so every field here is shown to them before anything is handed to a coding agent.
    """

    model_config = ConfigDict(frozen=True)

    feasibility_summary: str = Field(min_length=1)
    constraints: tuple[str, ...] = Field(min_length=2, max_length=6)
    validation_steps: tuple[str, ...] = Field(min_length=2, max_length=6)
    success_signals: tuple[str, ...] = Field(min_length=2, max_length=5)
    title: str = Field(min_length=1)
    promise: str = Field(min_length=1)
    target_user: str = Field(min_length=1)
    included: tuple[str, ...] = Field(min_length=2, max_length=6)
    excluded: tuple[str, ...] = Field(min_length=2, max_length=6)
    user_flow: tuple[str, ...] = Field(min_length=2, max_length=6)
    acceptance_criteria: tuple[str, ...] = Field(min_length=2, max_length=6)
    assumptions: tuple[str, ...] = Field(min_length=2, max_length=5)
    implementation_order: tuple[str, ...] = Field(min_length=2, max_length=6)
    approval_prompt: str = Field(min_length=1)
    approval_why: str = Field(min_length=1)


class CodingHandoff(BaseModel):
    """Machine-readable implementation input created only after human approval."""

    model_config = ConfigDict(frozen=True)

    proposal_id: str = Field(min_length=1)
    goal: str = Field(min_length=1)
    implementation_order: tuple[str, ...] = Field(min_length=1)
    acceptance_criteria: tuple[str, ...] = Field(min_length=1)
    constraints: tuple[str, ...] = Field(min_length=1)
    evidence_source_ids: tuple[str, ...] = Field(min_length=1)
    approved_by: Literal["user"] = "user"
    external_side_effects_allowed: Literal[False] = False
