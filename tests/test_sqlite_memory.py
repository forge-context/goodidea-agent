from datetime import UTC, datetime

import pytest

from goodidea_agent.memory.sqlite import SessionConflict, SQLiteMemory
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.guidance import apply_mvp_approval, build_mvp_proposal
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)

IDEA = "I want to build a program that automatically trades stocks and makes money."
SAVED_AT = datetime(2026, 8, 29, 12, 0, tzinfo=UTC)


def _result(locale: str = "en"):
    return AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(IDEA, locale=locale)


def test_save_and_load_round_trip_uses_validated_snapshot(tmp_path) -> None:
    database = tmp_path / "memory.db"
    result = _result()

    with SQLiteMemory(database, clock=lambda: SAVED_AT) as memory:
        saved = memory.save("session-1", result)
        loaded = memory.load_latest("session-1")

    assert saved.version == 1
    assert saved.saved_at == SAVED_AT
    assert loaded == saved


def test_same_snapshot_is_idempotent() -> None:
    result = _result()

    with SQLiteMemory(":memory:", clock=lambda: SAVED_AT) as memory:
        first = memory.save("session-1", result)
        second = memory.save("session-1", result)

    assert second.version == first.version == 1


def test_normalized_memory_keeps_evidence_and_open_questions_queryable() -> None:
    result = _result(locale="zh-CN")

    with SQLiteMemory(":memory:", clock=lambda: SAVED_AT) as memory:
        memory.save("session-1", result)
        evidence = memory.evidence_for("session-1")
        questions = memory.open_questions_for("session-1")

    assert tuple(source.id for source in evidence) == (
        "alpaca-paper-trading",
        "ibkr-tws-api",
        "investor-gov-returns",
    )
    assert len(questions) == 1
    assert questions[0].id == "strategy_source"
    assert questions[0].prompt.startswith("你希望")


def test_file_database_can_be_reopened(tmp_path) -> None:
    database = tmp_path / "memory.db"
    result = _result()

    with SQLiteMemory(database, clock=lambda: SAVED_AT) as memory:
        memory.save("session-1", result)

    with SQLiteMemory(database) as reopened:
        loaded = reopened.load_latest("session-1")

    assert loaded is not None
    assert loaded.result == result


def test_session_identity_cannot_silently_change() -> None:
    result = _result()
    other_idea = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        "Build a meal-planning application"
    )

    with SQLiteMemory(":memory:", clock=lambda: SAVED_AT) as memory:
        memory.save("session-1", result)
        with pytest.raises(SessionConflict, match="different idea or locale"):
            memory.save("session-1", other_idea)


def test_resumed_decision_replaces_open_question_in_normalized_memory() -> None:
    result = _result(locale="zh-CN")
    resumed = apply_strategy_source_answer(result, "执行我已有的规则")

    with SQLiteMemory(":memory:", clock=lambda: SAVED_AT) as memory:
        first = memory.save("session-1", result)
        second = memory.save("session-1", resumed)
        questions = memory.open_questions_for("session-1")
        decisions = memory.decisions_for("session-1")

    assert first.version == 1
    assert second.version == 2
    assert questions == ()
    assert len(decisions) == 1
    assert decisions[0].choice.value == "existing_rules"
    assert decisions[0].decided_by == "user"


def test_handoff_persists_approval_for_the_exact_proposal() -> None:
    decided = apply_strategy_source_answer(_result(locale="zh-CN"), "执行我已有的规则")
    proposed = build_mvp_proposal(decided)
    completed = apply_mvp_approval(proposed, approved=True)

    with SQLiteMemory(":memory:", clock=lambda: SAVED_AT) as memory:
        memory.save("session-1", completed)
        approvals = memory.approvals_for("session-1")
        loaded = memory.load_latest("session-1")

    assert loaded is not None
    assert loaded.result.handoff is not None
    assert len(approvals) == 1
    assert approvals[0].proposal_id == completed.proposal.id
    assert approvals[0].approved_by == "user"
