from datetime import date

import pytest

from goodidea_agent.tools.web_search import (
    FakeWebSearchAdapter,
    ResearchQuestion,
    SearchErrorKind,
    SearchHit,
    SearchRequest,
    SearchUnavailable,
    TavilyWebSearchAdapter,
    WebSearchAdapter,
)


def _hit() -> SearchHit:
    return SearchHit(
        title="Paper trading documentation",
        url="https://example.com/paper-trading",
        content="A simulated environment is available.",
        score=0.91,
        retrieved_on=date(2026, 8, 29),
    )


def test_fake_search_returns_fixed_evidence_and_records_the_request() -> None:
    adapter: WebSearchAdapter = FakeWebSearchAdapter(
        {ResearchQuestion.EXECUTION_AND_PAPER_TRADING: (_hit(),)}
    )
    request = SearchRequest(
        question=ResearchQuestion.EXECUTION_AND_PAPER_TRADING,
        query="official paper trading API documentation",
    )

    results = adapter.search(request)

    assert results == (_hit(),)
    assert isinstance(adapter, FakeWebSearchAdapter)
    assert adapter.requests == [request]


def test_fake_search_can_reproduce_provider_failure() -> None:
    request = SearchRequest(
        question=ResearchQuestion.RETURNS_CLAIM,
        query="official guidance guaranteed investment returns",
    )
    adapter = FakeWebSearchAdapter(
        {},
        fail_on=frozenset({ResearchQuestion.RETURNS_CLAIM}),
    )

    with pytest.raises(SearchUnavailable, match="returns_claim"):
        adapter.search(request)


class _StubTavilyClient:
    def __init__(self) -> None:
        self.query: str | None = None
        self.options: dict[str, object] = {}

    def search(self, query: str, **kwargs: object) -> dict[str, object]:
        self.query = query
        self.options = kwargs
        return {
            "results": [
                {
                    "title": "Paper trading documentation",
                    "url": "https://example.com/paper-trading",
                    "content": "A simulated environment is available.",
                    "score": 0.91,
                }
            ]
        }


def test_tavily_search_converts_provider_results_without_classifying_evidence() -> None:
    client = _StubTavilyClient()
    adapter = TavilyWebSearchAdapter(
        client,
        max_results=3,
        today=lambda: date(2026, 8, 29),
    )
    request = SearchRequest(
        question=ResearchQuestion.EXECUTION_AND_PAPER_TRADING,
        query="official paper trading API documentation",
    )

    results = adapter.search(request)

    assert results == (_hit(),)
    assert client.query == request.query
    assert client.options == {
        "max_results": 3,
        "search_depth": "basic",
        "include_raw_content": False,
    }


def test_tavily_search_translates_provider_errors() -> None:
    class FailingClient:
        def search(self, query: str, **kwargs: object) -> dict[str, object]:
            raise ConnectionError("offline")

    adapter = TavilyWebSearchAdapter(FailingClient())
    request = SearchRequest(
        question=ResearchQuestion.RETURNS_CLAIM,
        query="official guidance guaranteed investment returns",
    )

    with pytest.raises(SearchUnavailable, match="Tavily search failed"):
        adapter.search(request)


def test_search_options_follow_the_documented_defaults() -> None:
    client = _StubTavilyClient()
    adapter = TavilyWebSearchAdapter(
        client,
        max_results=4,
        exclude_domains=("facebook.com",),
    )

    adapter.search(SearchRequest(question="q", query="broker API docs", language="en"))

    assert client.options["search_depth"] == "basic"
    assert client.options["max_results"] == 4
    assert client.options["include_raw_content"] is False
    assert client.options["exclude_domains"] == ["facebook.com"]
    assert client.options["language"] == "en"


def test_language_is_omitted_when_the_caller_has_no_preference() -> None:
    client = _StubTavilyClient()

    TavilyWebSearchAdapter(client).search(SearchRequest(question="q", query="broker API"))

    assert "language" not in client.options


def test_provider_failures_keep_their_operational_meaning() -> None:
    class UsageLimitExceededError(Exception):
        pass

    class FailingClient:
        def search(self, query: str, **kwargs: object) -> dict[str, object]:
            raise UsageLimitExceededError("out of credits")

    adapter = TavilyWebSearchAdapter(FailingClient())

    with pytest.raises(SearchUnavailable) as error:
        adapter.search(SearchRequest(question="q", query="anything"))

    assert error.value.kind is SearchErrorKind.QUOTA


def test_a_missing_key_is_a_configuration_problem(monkeypatch) -> None:
    monkeypatch.delenv("TAVILY_API_KEY", raising=False)

    with pytest.raises(SearchUnavailable) as error:
        TavilyWebSearchAdapter.from_environment()

    assert error.value.kind is SearchErrorKind.CONFIGURATION
