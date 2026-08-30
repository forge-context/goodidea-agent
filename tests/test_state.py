from datetime import date

import pytest
from pydantic import ValidationError

from goodidea_agent.domain.state import AgentState, ConfirmedFact, EvidenceSource, Stage


def test_new_idea_starts_in_research_without_side_effect_permission() -> None:
    state = AgentState(idea="Build an automatic stock-trading product")

    assert state.current_stage is Stage.RESEARCH
    assert state.completed_milestones == ()
    assert state.external_side_effects_allowed is False


def test_confirmed_fact_must_reference_retained_evidence() -> None:
    fact = ConfirmedFact(
        id="paper-trading-exists",
        statement="Paper trading can test automated execution.",
        source_ids=("missing-source",),
    )

    with pytest.raises(ValidationError, match="unknown sources"):
        AgentState(idea="Automatic trading", confirmed_facts=(fact,))


def test_state_is_json_serializable_for_workflow_checkpoints() -> None:
    source = EvidenceSource(
        id="broker-docs",
        title="Paper trading documentation",
        url="https://example.com/paper-trading",
        publisher="Example Broker",
        retrieved_on=date(2026, 8, 29),
        source_type="primary",
        excerpt="A simulated environment is available.",
    )
    fact = ConfirmedFact(
        id="paper-trading-exists",
        statement="Paper trading can test automated execution.",
        source_ids=(source.id,),
    )
    state = AgentState(
        idea="Automatic trading",
        evidence_sources=(source,),
        confirmed_facts=(fact,),
    )

    restored = AgentState.model_validate_json(state.model_dump_json())

    assert restored == state

