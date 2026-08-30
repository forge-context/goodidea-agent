"""Understanding the answer must not become deciding for the user."""

import pytest

from goodidea_agent.domain.state import StrategySourceChoice
from goodidea_agent.model.adapter import ModelErrorKind, ModelUnavailable
from goodidea_agent.model.answer_reader import ModelAnswerReader
from goodidea_agent.model.fake import FakeModelAdapter
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)

IDEA = "I want to build a program that automatically trades stocks and makes money."


def reading(kind: str, **overrides) -> dict:
    payload = {
        "reading": kind,
        "restatement": "你打算先执行趋势跟踪这条已有规则。" if kind != "unclear" else "",
        "why": "用户点名了一种打算使用的策略类型。",
    }
    payload.update(overrides)
    return payload


def researched(locale: str = "zh-CN"):
    return AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(IDEA, locale=locale)


def read_with(replies, answer: str):
    adapter = FakeModelAdapter(replies)
    result = apply_strategy_source_answer(
        researched(), answer, reader=ModelAnswerReader(adapter)
    )
    return result, adapter


def test_an_answer_the_keywords_would_miss_is_now_understood():
    result, _ = read_with([reading("existing_rules")], "趋势跟踪")

    assert result.status == "decision_recorded"
    decision = result.state.product_decisions[0]
    assert decision.choice is StrategySourceChoice.EXISTING_RULES
    assert decision.decided_by == "user"


def test_the_decision_is_said_back_in_the_user_s_own_terms():
    result, _ = read_with([reading("existing_rules")], "趋势跟踪")

    assert result.message == "你打算先执行趋势跟踪这条已有规则。"
    assert result.state.product_decisions[0].statement == "你打算先执行趋势跟踪这条已有规则。"


def test_an_unclear_answer_records_nothing():
    result, _ = read_with([reading("unclear", restatement="")], "这个要看情况")

    assert result.status == "awaiting_user"
    assert result.state.product_decisions == ()


@pytest.mark.parametrize("answer", ["好的", "可以", "yes", "はい", "  ok  "])
def test_agreement_never_reaches_the_model(answer):
    adapter = FakeModelAdapter([reading("existing_rules")])

    result = apply_strategy_source_answer(
        researched(), answer, reader=ModelAnswerReader(adapter)
    )

    assert result.status == "awaiting_user"
    assert result.state.product_decisions == ()
    assert adapter.requests == []


def test_the_question_the_user_answered_is_given_to_the_model():
    _, adapter = read_with([reading("existing_rules")], "趋势跟踪")

    sent = adapter.requests[0].messages[1].content
    assert "趋势跟踪" in sent
    assert researched().question.prompt in sent


def test_a_model_failure_falls_back_to_the_fixed_wording():
    failure = ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")

    result, _ = read_with([failure], "使用我已有的规则")

    assert result.status == "decision_recorded"
    assert result.state.product_decisions[0].choice is StrategySourceChoice.EXISTING_RULES


def test_a_model_failure_on_an_unmatched_answer_asks_again():
    failure = ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")

    result, _ = read_with([failure], "趋势跟踪")

    assert result.status == "awaiting_user"
    assert result.state.product_decisions == ()


def test_keyword_matching_still_works_without_a_reader():
    result = apply_strategy_source_answer(researched(), "使用我已有的规则")

    assert result.status == "decision_recorded"


def test_the_follow_up_is_about_the_answer_the_user_gave():
    result, _ = read_with(
        [reading("unclear", restatement="", why="你说的是市场类别，还没说明规则从哪里来。")],
        "先做 A 股",
    )

    assert result.status == "awaiting_user"
    assert result.message == "你说的是市场类别，还没说明规则从哪里来。"
