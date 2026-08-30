"""Model-driven research: the model chooses queries and writes the answer.

Trust in a source and the grounding of a claim stay outside the model's control.
"""

from datetime import date

import pytest

from goodidea_agent.model.adapter import ModelErrorKind, ModelUnavailable
from goodidea_agent.model.composer import ModelCardComposer
from goodidea_agent.model.fake import FakeModelAdapter
from goodidea_agent.model.interpreter import ModelIdeaInterpreter
from goodidea_agent.tools.web_search import FakeWebSearchAdapter, SearchHit
from goodidea_agent.workflow.evidence import best_hits, classify_hits, independent_publishers
from goodidea_agent.workflow.vertical_slice import AutomaticTradingVerticalSlice

ASSESSMENT = {
    "scenario": "automatic_trading",
    "summary": "用户想要一个自动执行交易的产品。",
    "testable_behavior": "按一条明确规则自动下单。",
    "desired_outcome": "希望它替自己赚钱。",
    "core_uncertainty": "规则本身是否有效尚未验证。",
    "missing_decision": "规则由用户提供，还是由系统探索。",
    "outcome_promise_risk": True,
    "research_topics": [
        {"question": "券商是否提供模拟交易", "query": "broker paper trading API documentation"},
        {"question": "收益承诺是否合规", "query": "regulator guidance guaranteed returns"},
    ],
}


def hit(url: str, title: str = "A page") -> SearchHit:
    return SearchHit(
        title=title,
        url=url,
        content="An excerpt that supports one narrow claim.",
        retrieved_on=date(2026, 8, 30),
    )


def search_adapter() -> FakeWebSearchAdapter:
    return FakeWebSearchAdapter(
        {
            "券商是否提供模拟交易": (hit("https://docs.alpaca.markets/us/docs/paper-trading"),),
            "收益承诺是否合规": (hit("https://www.investor.gov/protect-your-money"),),
        }
    )


def card(**overrides) -> dict:
    payload = {
        "grounded_encouragement": "把执行部分单独验证是可行的起点。",
        "market_reality": "券商已经提供模拟交易环境。",
        "honest_boundary": "没有证据支持任何收益承诺。",
        "safe_validation_step": "只用模拟资金运行一条明确规则。",
        "confirmed_facts": [
            {
                "id": "paper-trading-exists",
                "statement": "模拟交易环境已经存在。",
                "source_ids": ["alpaca-markets-us-docs-paper-trading"],
            }
        ],
        "question_prompt": "你已经有一条想执行的规则了吗？",
        "question_why": "答案决定第一版是执行工具还是策略实验。",
    }
    payload.update(overrides)
    return payload


def build(model_replies) -> AutomaticTradingVerticalSlice:
    adapter = FakeModelAdapter(model_replies)
    return AutomaticTradingVerticalSlice(
        search_adapter(),
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )


def test_the_model_chooses_the_search_queries():
    search = search_adapter()
    adapter = FakeModelAdapter([ASSESSMENT, card()])
    workflow = AutomaticTradingVerticalSlice(
        search,
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )

    workflow.run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert [request.query for request in search.requests] == [
        "broker paper trading API documentation",
        "regulator guidance guaranteed returns",
    ]


def test_the_answer_and_its_facts_come_from_the_model():
    result = build([ASSESSMENT, card()]).run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "awaiting_user"
    assert result.card.market_reality == "券商已经提供模拟交易环境。"
    assert result.question.prompt == "你已经有一条想执行的规则了吗？"
    assert [fact.id for fact in result.state.confirmed_facts] == ["paper-trading-exists"]


def test_no_url_whitelist_is_applied_to_live_results():
    result = build([ASSESSMENT, card()]).run("帮我做一个自动炒股的产品。", locale="zh-CN")

    publishers = {source.publisher for source in result.card.sources}
    assert publishers == {"alpaca.markets", "investor.gov"}


def test_a_fabricated_citation_is_sent_back_for_correction():
    invalid = card(
        confirmed_facts=[
            {"id": "invented", "statement": "某处这样说。", "source_ids": ["not-a-real-source"]}
        ]
    )
    adapter = FakeModelAdapter([ASSESSMENT, invalid, card()])
    workflow = AutomaticTradingVerticalSlice(
        search_adapter(),
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )

    result = workflow.run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "awaiting_user"
    repair = adapter.requests[-1].messages[-1].content
    assert "not-a-real-source" in repair


def test_a_citation_that_stays_fabricated_produces_no_answer():
    invalid = card(
        confirmed_facts=[
            {"id": "invented", "statement": "某处这样说。", "source_ids": ["not-a-real-source"]}
        ]
    )
    result = build([ASSESSMENT, invalid, invalid]).run("帮我做自动炒股产品。", locale="zh-CN")

    assert result.status == "research_failed"
    assert result.card is None


def test_a_single_publisher_is_not_treated_as_agreement():
    adapter = FakeModelAdapter([ASSESSMENT, card()])
    one_publisher = FakeWebSearchAdapter(
        {
            "券商是否提供模拟交易": (hit("https://docs.alpaca.markets/us/docs/paper-trading"),),
            "收益承诺是否合规": (hit("https://docs.alpaca.markets/us/docs/orders"),),
        }
    )
    workflow = AutomaticTradingVerticalSlice(
        one_publisher,
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )

    result = workflow.run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "research_failed"


def test_a_composer_failure_does_not_produce_a_partial_answer():
    failure = ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")
    result = build([ASSESSMENT, failure]).run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "research_failed"
    assert result.card is None
    assert result.state.confirmed_facts == ()


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        ("https://docs.alpaca.markets/us/docs/paper-trading", "primary"),
        ("https://developer.example.com/guide", "primary"),
        ("https://www.investor.gov/protect", "authoritative"),
        ("https://www.fsa.go.jp/policy/algo", "authoritative"),
        ("https://medium.com/@someone/post", "secondary"),
    ],
)
def test_trust_is_decided_by_the_url(url, expected):
    assert classify_hits((hit(url),))[0].source_type == expected


def test_the_same_page_is_never_counted_twice():
    sources = classify_hits((hit("https://a.example.com/x"), hit("https://a.example.com/x/")))

    assert len(sources) == 1
    assert independent_publishers(sources) == 1


def test_one_empty_query_does_not_end_the_research():
    adapter = FakeModelAdapter([ASSESSMENT, card()])
    partial = FakeWebSearchAdapter(
        {
            "券商是否提供模拟交易": (
                hit("https://docs.alpaca.markets/us/docs/paper-trading"),
                hit("https://www.investor.gov/protect-your-money"),
            )
        }
    )
    workflow = AutomaticTradingVerticalSlice(
        partial,
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )

    result = workflow.run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "awaiting_user"


def test_a_search_outage_still_stops_the_run():
    adapter = FakeModelAdapter([ASSESSMENT, card()])
    outage = FakeWebSearchAdapter(
        {},
        fail_on=frozenset({"券商是否提供模拟交易", "收益承诺是否合规"}),
    )
    workflow = AutomaticTradingVerticalSlice(
        outage,
        interpreter=ModelIdeaInterpreter(adapter),
        composer=ModelCardComposer(adapter),
    )

    result = workflow.run("帮我做一个自动炒股的产品。", locale="zh-CN")

    assert result.status == "research_failed"


def test_pages_that_cannot_carry_attribution_are_never_cited():
    sources = classify_hits(
        (
            hit("https://www.facebook.com/somebody/posts/123"),
            hit("https://www.baidu.com/s?wd=trading"),
            hit("https://docs.alpaca.markets/us/docs/paper-trading"),
        )
    )

    assert [source.publisher for source in sources] == ["alpaca.markets"]


def test_only_the_best_hits_of_a_query_become_material():
    ranked = tuple(
        SearchHit(
            title=f"page {index}",
            url=f"https://example{index}.com/a",
            content="c",
            score=score,
            retrieved_on=date(2026, 8, 30),
        )
        for index, score in enumerate([0.2, 0.9, 0.5, 0.7])
    )

    kept = best_hits(ranked, limit=2)

    assert [h.score for h in kept] == [0.9, 0.7]
