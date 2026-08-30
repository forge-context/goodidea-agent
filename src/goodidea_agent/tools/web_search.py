"""Web-search boundary and deterministic test adapter."""

from __future__ import annotations

import os
from collections.abc import Callable, Mapping, Sequence
from datetime import date
from enum import Enum
from typing import Protocol, cast

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class SearchHit(BaseModel):
    """Unclassified result returned by a search provider.

    A later research step decides whether a hit is primary or authoritative evidence.
    The search provider is not allowed to make that product-level judgment.
    """

    model_config = ConfigDict(frozen=True)

    title: str = Field(min_length=1)
    url: HttpUrl
    content: str = Field(min_length=1)
    score: float | None = Field(default=None, ge=0, le=1)
    retrieved_on: date


def research_key(question: ResearchQuestion | str) -> str:
    """Normalise a question to the plain string used as a lookup key."""

    return question.value if isinstance(question, ResearchQuestion) else str(question)


class ResearchQuestion(str, Enum):
    """The bounded questions used by the deterministic offline slice.

    Model-generated research topics are plain strings, so the request field below is
    a string and this enum is one convenient source of those strings.
    """

    EXECUTION_AND_PAPER_TRADING = "execution_and_paper_trading"
    ESTABLISHED_CATEGORY = "established_category"
    RETURNS_CLAIM = "returns_claim"


class SearchRequest(BaseModel):
    """One auditable request sent to a search implementation.

    ``language`` is the language the answer is expected to be written in, which is not
    always the session language: vendor documentation is usually English even for a
    Japanese or Chinese session.
    """

    model_config = ConfigDict(frozen=True)

    question: str = Field(min_length=1)
    query: str = Field(min_length=1)
    language: str | None = None


class SearchErrorKind(str, Enum):
    """Closed set of search failures. Anything unexpected becomes ``PROVIDER``."""

    CONFIGURATION = "configuration"
    AUTHENTICATION = "authentication"
    QUOTA = "quota"
    REQUEST = "request"
    PROVIDER = "provider"


class SearchUnavailable(RuntimeError):
    """Raised when current evidence cannot be collected.

    An exhausted quota and a rejected key are different operational problems, so the
    kind is kept even though every one of them stops the same research step.
    """

    def __init__(self, detail: str, *, kind: SearchErrorKind = SearchErrorKind.PROVIDER) -> None:
        super().__init__(detail)
        self.kind = kind


class WebSearchAdapter(Protocol):
    """Interface implemented by fake and live search providers."""

    def search(self, request: SearchRequest) -> tuple[SearchHit, ...]: ...


class FakeWebSearchAdapter:
    """Deterministic search adapter for contract tests and local demos."""

    def __init__(
        self,
        results: Mapping[ResearchQuestion | str, tuple[SearchHit, ...]],
        *,
        fail_on: frozenset[ResearchQuestion | str] = frozenset(),
    ) -> None:
        self._results = {research_key(key): value for key, value in results.items()}
        self._fail_on = {research_key(key) for key in fail_on}
        self.requests: list[SearchRequest] = []

    def search(self, request: SearchRequest) -> tuple[SearchHit, ...]:
        self.requests.append(request)
        key = research_key(request.question)
        if key in self._fail_on:
            raise SearchUnavailable(f"search unavailable for {key}")
        return self._results.get(key, ())


class ConstantWebSearchAdapter:
    """Answer every query with the same evidence.

    Recording or replaying a session needs the evidence to stay fixed while the model
    is free to write its own queries. Keying fixtures by question cannot do that: the
    questions are written per session.
    """

    def __init__(self, hits: tuple[SearchHit, ...]) -> None:
        self._hits = hits
        self.requests: list[SearchRequest] = []

    def search(self, request: SearchRequest) -> tuple[SearchHit, ...]:
        self.requests.append(request)
        return self._hits


class _TavilyClient(Protocol):
    def search(self, query: str, **kwargs: object) -> Mapping[str, object]: ...


class TavilyWebSearchAdapter:
    """Live Tavily implementation of the bounded web-search interface."""

    def __init__(
        self,
        client: _TavilyClient,
        *,
        max_results: int = 5,
        today: Callable[[], date] = date.today,
        exclude_domains: Sequence[str] = (),
    ) -> None:
        self._client = client
        self._max_results = max_results
        self._today = today
        self._exclude_domains = tuple(exclude_domains)

    @classmethod
    def from_environment(
        cls,
        *,
        max_results: int = 5,
        exclude_domains: Sequence[str] = (),
    ) -> TavilyWebSearchAdapter:
        api_key = os.environ.get("TAVILY_API_KEY")
        if not api_key:
            raise SearchUnavailable(
                "TAVILY_API_KEY is not configured", kind=SearchErrorKind.CONFIGURATION
            )

        from tavily import TavilyClient

        return cls(
            cast(_TavilyClient, TavilyClient(api_key=api_key)),
            max_results=max_results,
            exclude_domains=exclude_domains,
        )

    def search(self, request: SearchRequest) -> tuple[SearchHit, ...]:
        options: dict[str, object] = {
            "max_results": self._max_results,
            # "basic" costs one API credit; "advanced" costs two and is not needed to
            # decide which sources exist.
            "search_depth": "basic",
            "include_raw_content": False,
        }
        if self._exclude_domains:
            # Filtering here rather than after the fact means the excluded pages do not
            # occupy result slots that a citable page could have used.
            options["exclude_domains"] = list(self._exclude_domains)
        if request.language:
            options["language"] = request.language

        try:
            response = self._client.search(request.query, **options)
            raw_results = response.get("results", [])
            if not isinstance(raw_results, list):
                raise TypeError("Tavily response has no result list")
            return tuple(self._to_hit(item) for item in raw_results)
        except SearchUnavailable:
            raise
        except Exception as exc:
            raise SearchUnavailable(
                f"Tavily search failed: {exc}", kind=_classify_provider_error(exc)
            ) from exc

    def _to_hit(self, item: object) -> SearchHit:
        if not isinstance(item, Mapping):
            raise TypeError("Tavily returned a malformed result")

        score = item.get("score")
        return SearchHit(
            title=item.get("title"),
            url=item.get("url"),
            content=item.get("content"),
            score=float(score) if score is not None else None,
            retrieved_on=self._today(),
        )


# The SDK names its failures; mapping them keeps an exhausted quota distinguishable
# from a rejected key, which are different problems for whoever operates this.
_PROVIDER_ERROR_KINDS: Mapping[str, SearchErrorKind] = {
    "MissingAPIKeyError": SearchErrorKind.CONFIGURATION,
    "InvalidAPIKeyError": SearchErrorKind.AUTHENTICATION,
    "UsageLimitExceededError": SearchErrorKind.QUOTA,
    "TavilyKeylessLimitError": SearchErrorKind.QUOTA,
    "BadRequestError": SearchErrorKind.REQUEST,
    "KeylessUnsupportedEndpointError": SearchErrorKind.REQUEST,
}


def _classify_provider_error(error: Exception) -> SearchErrorKind:
    return _PROVIDER_ERROR_KINDS.get(type(error).__name__, SearchErrorKind.PROVIDER)
