import pytest

from goodidea_agent.domain.state import Stage, StrategySourceChoice
from goodidea_agent.scenarios.automatic_trading import (
    build_demo_search_adapter,
    demo_search_results,
)
from goodidea_agent.tools.web_search import FakeWebSearchAdapter, ResearchQuestion
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    NoOpenQuestion,
    apply_strategy_source_answer,
    is_low_information_agreement,
)

IDEA = "I want to build a program that automatically trades stocks and makes money."


def test_offline_slice_reaches_one_question_without_external_side_effects() -> None:
    result = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        IDEA,
        locale="zh-CN",
    )

    assert result.status == "awaiting_user"
    assert result.state.current_stage is Stage.FEASIBILITY
    assert result.state.completed_milestones == ("market_research",)
    assert result.state.external_side_effects_allowed is False
    assert result.card is not None
    assert len(result.card.sources) == 3
    assert result.question is not None
    assert result.question.id == "strategy_source"
    assert len(result.state.open_questions) == 1


def test_language_variants_preserve_semantic_state() -> None:
    results = [
        AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(IDEA, locale=locale)
        for locale in ("en", "ja", "zh-CN")
    ]

    assert {result.status for result in results} == {"awaiting_user"}
    assert {result.state.current_stage for result in results} == {Stage.FEASIBILITY}
    assert {result.question.id for result in results if result.question} == {"strategy_source"}
    assert {
        tuple(source.id for source in result.state.evidence_sources) for result in results
    } == {
        ("alpaca-paper-trading", "ibkr-tws-api", "investor-gov-returns")
    }


def test_search_failure_keeps_the_workflow_in_research() -> None:
    failing = FakeWebSearchAdapter(
        demo_search_results(),
        fail_on=frozenset({ResearchQuestion.RETURNS_CLAIM}),
    )

    result = AutomaticTradingVerticalSlice(failing).run(IDEA)

    assert result.status == "research_failed"
    assert result.state.current_stage is Stage.RESEARCH
    assert result.card is None
    assert result.question is None


def test_unknown_idea_is_not_silently_interpreted() -> None:
    result = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        "Build a meal-planning application"
    )

    assert result.status == "unsupported"
    assert result.state.current_stage is Stage.RESEARCH
    assert result.interpretation is None


@pytest.mark.parametrize("answer", ["yes", "好的", "可以。", "はい"])
def test_low_information_agreement_does_not_select_a_path(answer: str) -> None:
    assert is_low_information_agreement(answer) is True


@pytest.mark.parametrize(
    "answer",
    ["Use my existing rules", "帮我寻找交易规则", "既存のルールを実行する"],
)
def test_concrete_path_answer_is_not_low_information(answer: str) -> None:
    assert is_low_information_agreement(answer) is False


@pytest.mark.parametrize("answer", ["好的", "yes", "はい", "随便，都可以"])
def test_vague_answer_repeats_two_paths_without_recording_a_decision(answer: str) -> None:
    result = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        IDEA,
        locale="zh-CN",
    )

    resumed = apply_strategy_source_answer(result, answer)

    assert resumed.status == "awaiting_user"
    assert resumed.state == result.state
    assert resumed.state.product_decisions == ()
    assert resumed.question == result.question
    assert resumed.message is not None
    assert "执行你已有" in resumed.message
    assert "寻找交易规则" in resumed.message


@pytest.mark.parametrize(
    ("locale", "answer", "choice", "next_milestone"),
    [
        ("en", "Use my existing rules", StrategySourceChoice.EXISTING_RULES, "define_one_rule_for_paper_trading"),
        ("ja", "売買ルールを探す", StrategySourceChoice.DISCOVER_RULES, "define_strategy_discovery_evaluation"),
        ("zh-CN", "执行我已有的规则", StrategySourceChoice.EXISTING_RULES, "define_one_rule_for_paper_trading"),
        ("zh-CN", "帮我寻找交易策略", StrategySourceChoice.DISCOVER_RULES, "define_strategy_discovery_evaluation"),
    ],
)
def test_explicit_answer_records_only_a_user_decision(
    locale: str,
    answer: str,
    choice: StrategySourceChoice,
    next_milestone: str,
) -> None:
    result = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        IDEA,
        locale=locale,
    )

    resumed = apply_strategy_source_answer(result, answer)

    assert resumed.status == "decision_recorded"
    assert resumed.state.current_stage is Stage.FEASIBILITY
    assert resumed.state.open_questions == ()
    assert resumed.question is None
    assert resumed.state.next_milestone == next_milestone
    assert resumed.state.completed_milestones == (
        "market_research",
        "strategy_source_decided",
    )
    assert len(resumed.state.product_decisions) == 1
    assert resumed.state.product_decisions[0].choice is choice
    assert resumed.state.product_decisions[0].decided_by == "user"


def test_answering_an_already_resolved_question_is_rejected() -> None:
    result = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(IDEA)
    resumed = apply_strategy_source_answer(result, "Use my existing rules")

    with pytest.raises(NoOpenQuestion, match="no open strategy-source question"):
        apply_strategy_source_answer(resumed, "Discover rules")
