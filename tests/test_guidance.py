import pytest

from goodidea_agent.domain.state import Stage
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.guidance import (
    GuidanceTransitionError,
    apply_mvp_approval,
    build_mvp_proposal,
)
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)

IDEA = "I want to build a program that automatically trades stocks and makes money."


def _decided(*, locale: str = "en", answer: str = "Use my existing rules"):
    researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        IDEA,
        locale=locale,
    )
    return apply_strategy_source_answer(researched, answer)


@pytest.mark.parametrize(
    ("locale", "answer", "expected_id"),
    [
        ("en", "Use my existing rules", "existing_rules"),
        ("ja", "売買ルールを探す", "discover_rules"),
        ("zh-CN", "帮我寻找交易规则", "discover_rules"),
    ],
)
def test_decision_generates_a_reviewable_mvp_boundary(
    locale: str,
    answer: str,
    expected_id: str,
) -> None:
    proposed = build_mvp_proposal(_decided(locale=locale, answer=answer))

    assert proposed.status == "proposal_ready"
    assert proposed.state.current_stage is Stage.MVP_BOUNDARY
    assert proposed.feasibility is not None
    assert proposed.feasibility.id.value == expected_id
    assert proposed.proposal is not None
    assert proposed.proposal.id.endswith(f"{expected_id}-mvp-v1")
    assert proposed.question is not None
    assert proposed.question.id == "mvp_boundary_approval"
    assert proposed.state.approvals == ()
    assert "mvp_boundary_proposed" in proposed.state.completed_milestones
    assert proposed.handoff is None


def test_unapproved_proposal_cannot_create_a_handoff() -> None:
    proposed = build_mvp_proposal(_decided())

    revised = apply_mvp_approval(
        proposed,
        approved=False,
        feedback="The first version should only replay fixed sample data.",
    )

    assert revised.status == "revision_requested"
    assert revised.state.current_stage is Stage.MVP_BOUNDARY
    assert revised.state.approvals == ()
    assert revised.handoff is None
    assert revised.question is not None


def test_revision_requires_concrete_feedback() -> None:
    proposed = build_mvp_proposal(_decided())

    with pytest.raises(GuidanceTransitionError, match="feedback is required"):
        apply_mvp_approval(proposed, approved=False)


def test_human_approval_creates_a_bounded_coding_handoff() -> None:
    proposed = build_mvp_proposal(_decided(locale="zh-CN", answer="执行我已有的规则"))

    completed = apply_mvp_approval(proposed, approved=True)

    assert completed.status == "handoff_ready"
    assert completed.state.current_stage is Stage.HANDOFF
    assert completed.state.open_questions == ()
    assert completed.state.next_milestone is None
    assert len(completed.state.approvals) == 1
    assert completed.state.approvals[0].approved_by == "user"
    assert completed.handoff is not None
    assert completed.handoff.proposal_id == completed.proposal.id
    assert completed.handoff.approved_by == "user"
    assert completed.handoff.external_side_effects_allowed is False
    assert any("真实券商" in item for item in completed.handoff.constraints)


def test_wrong_transition_order_is_rejected() -> None:
    researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(IDEA)

    with pytest.raises(GuidanceTransitionError, match="strategy-source decision"):
        build_mvp_proposal(researched)


def test_proposal_generation_is_idempotent() -> None:
    proposed = build_mvp_proposal(_decided())

    assert build_mvp_proposal(proposed) is proposed
