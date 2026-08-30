"""The model may describe an idea and route it. It may not decide the product."""

import pytest

from goodidea_agent.domain.research import IdeaAssessment
from goodidea_agent.model.adapter import ModelErrorKind, ModelUnavailable
from goodidea_agent.model.fake import FakeModelAdapter
from goodidea_agent.model.interpreter import ModelIdeaInterpreter
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.vertical_slice import AutomaticTradingVerticalSlice

TRADING_ASSESSMENT = {
    "scenario": "automatic_trading",
    "summary": "用户想要一个自动执行交易的产品。",
    "testable_behavior": "按一条明确规则自动下单。",
    "desired_outcome": "希望它替自己赚钱。",
    "core_uncertainty": "规则本身是否有效尚未验证。",
    "missing_decision": "规则由用户提供，还是由系统探索。",
    "outcome_promise_risk": True,
    "research_topics": [
        {"question": "券商是否提供模拟交易?", "query": "broker paper trading API documentation"},
        {"question": "收益承诺是否合规?", "query": "regulator guidance guaranteed investment returns"},
    ],
}

RECIPE_ASSESSMENT = {
    "scenario": "unsupported",
    "summary": "用户想做一个邻里共享厨具的应用。",
    "testable_behavior": "在同一小区内借还一件厨具。",
    "desired_outcome": "减少闲置厨具。",
    "core_uncertainty": "同一小区是否有足够的出借意愿。",
    "missing_decision": "先做出借方还是借入方。",
    "outcome_promise_risk": False,
    "research_topics": [
        {"question": "同类共享应用的留存如何?", "query": "neighborhood tool sharing app retention"},
        {"question": "是否已有本地竞品?", "query": "local kitchen tool sharing platform"},
    ],
    "unsupported_reason": "GoodIdea 目前只实现了自动交易这一条引导路径。",
}


def test_a_supported_idea_is_assessed_in_the_session_language():
    adapter = FakeModelAdapter([TRADING_ASSESSMENT])

    assessment = ModelIdeaInterpreter(adapter).interpret("帮我做自动炒股产品", locale="zh-CN")

    assert assessment.scenario == "automatic_trading"
    assert assessment.outcome_promise_risk is True
    assert len(assessment.research_topics) == 2
    assert "Simplified Chinese" in adapter.requests[0].messages[0].content


def test_an_unsupported_idea_must_say_what_is_missing():
    with pytest.raises(ValueError):
        IdeaAssessment.model_validate({**RECIPE_ASSESSMENT, "unsupported_reason": None})


def test_the_model_cannot_invent_a_scenario():
    with pytest.raises(ValueError):
        IdeaAssessment.model_validate({**TRADING_ASSESSMENT, "scenario": "healthcare"})


def test_the_workflow_stays_keyword_driven_without_an_interpreter():
    workflow = AutomaticTradingVerticalSlice(build_demo_search_adapter())

    result = workflow.run("An app for sharing kitchen tools", locale="en")

    assert result.status == "unsupported"
    assert result.assessment is None


def test_an_interpreted_idea_reaches_research_and_keeps_the_assessment():
    workflow = AutomaticTradingVerticalSlice(
        build_demo_search_adapter(),
        interpreter=ModelIdeaInterpreter(FakeModelAdapter([TRADING_ASSESSMENT])),
    )

    result = workflow.run("帮我做一个能自动炒股、替我赚钱的产品。", locale="zh-CN")

    assert result.status == "awaiting_user"
    assert result.assessment is not None
    assert result.card is not None
    assert result.question is not None


def test_an_out_of_scope_idea_is_refused_with_the_model_reason():
    workflow = AutomaticTradingVerticalSlice(
        build_demo_search_adapter(),
        interpreter=ModelIdeaInterpreter(FakeModelAdapter([RECIPE_ASSESSMENT])),
    )

    result = workflow.run("帮我做一个邻里共享厨具的应用。", locale="zh-CN")

    assert result.status == "unsupported"
    assert result.message == RECIPE_ASSESSMENT["unsupported_reason"]
    assert result.card is None


def test_an_idea_the_keyword_check_would_miss_can_still_be_understood():
    workflow = AutomaticTradingVerticalSlice(
        build_demo_search_adapter(),
        interpreter=ModelIdeaInterpreter(FakeModelAdapter([TRADING_ASSESSMENT])),
    )

    result = workflow.run("I want a bot that buys and sells shares for me overnight.", locale="en")

    assert result.status == "awaiting_user"


def test_a_model_failure_is_reported_as_a_research_failure():
    failure = ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")
    workflow = AutomaticTradingVerticalSlice(
        build_demo_search_adapter(),
        interpreter=ModelIdeaInterpreter(FakeModelAdapter([failure])),
    )

    result = workflow.run("帮我做一个能自动炒股的产品。", locale="zh-CN")

    assert result.status == "research_failed"
    assert result.card is None
