"""Model-written market reality card, grounded in sources the product retained.

The model writes the prose and chooses the next question. It cannot introduce a
source: every claim must cite an identifier from the list it was given, and a reply
that cites anything else is sent back for correction before it can be used.
"""

from __future__ import annotations

import json
from typing import Protocol

from goodidea_agent.domain.research import ComposedCard, IdeaAssessment
from goodidea_agent.domain.state import EvidenceSource, Locale
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction

PURPOSE = "market_reality_card"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

_RULES = (
    "You are GoodIdea, writing the first research answer a user sees.",
    (
        "Use only the sources listed below. Every confirmed fact must cite at least one"
        " source id from that list. Never cite an id that is not listed, and never state a"
        " fact the listed excerpts do not support."
    ),
    (
        "grounded_encouragement names what is concretely feasible, without predicting"
        " success. market_reality summarises what the sources establish."
    ),
    (
        "honest_boundary names what the evidence does not show, especially any outcome the"
        " user hopes for but nothing here can promise."
    ),
    (
        "safe_validation_step is one step the user could take now with no real money, no"
        " live account, and no external side effects."
    ),
    (
        "question_prompt asks the one thing the next step cannot proceed without: whether"
        " the user already has a rule or strategy they want this product to run, or whether"
        " they need help finding and comparing candidates. Phrase it in their own terms and"
        " in one short question, but a truthful answer to it must settle that and nothing"
        " else. Do not ask about markets, asset classes, budgets, or timelines: an answer to"
        " those leaves the next step unable to continue."
    ),
    (
        "question_why explains what changes depending on the answer. Ask one question only,"
        " and never answer it yourself."
    ),
)


class CardComposer(Protocol):
    """Boundary used by the workflow so the model stays replaceable."""

    def compose(
        self,
        *,
        idea: str,
        assessment: IdeaAssessment,
        sources: tuple[EvidenceSource, ...],
        locale: Locale,
    ) -> ComposedCard: ...


class ModelCardComposer:
    """Write one card from an assessment and the classified sources."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 1_600) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def compose(
        self,
        *,
        idea: str,
        assessment: IdeaAssessment,
        sources: tuple[EvidenceSource, ...],
        locale: Locale,
    ) -> ComposedCard:
        known_ids = frozenset(source.id for source in sources)
        request = ModelRequest(
            purpose=PURPOSE,
            messages=(
                ModelMessage(role=ModelRole.SYSTEM, content=self._system_prompt(locale)),
                ModelMessage(
                    role=ModelRole.USER,
                    content=self._user_prompt(idea, assessment, sources),
                ),
            ),
            max_output_tokens=self._max_output_tokens,
        )
        card, _ = complete_structured(
            self._adapter,
            request,
            ComposedCard,
            check=lambda candidate: _reject_unknown_citations(candidate, known_ids),
        )
        return card

    def _system_prompt(self, locale: Locale) -> str:
        return "\n".join(
            (
                *_RULES,
                f"Write every human-readable field in {_OUTPUT_LANGUAGE[locale]}.",
                schema_instruction(ComposedCard),
            )
        )

    def _user_prompt(
        self,
        idea: str,
        assessment: IdeaAssessment,
        sources: tuple[EvidenceSource, ...],
    ) -> str:
        listed = [
            {
                "id": source.id,
                "publisher": source.publisher,
                "source_type": source.source_type,
                "title": source.title,
                "excerpt": source.excerpt,
            }
            for source in sources
        ]
        return json.dumps(
            {
                "idea": idea,
                "core_uncertainty": assessment.core_uncertainty,
                "missing_decision": assessment.missing_decision,
                "outcome_promise_risk": assessment.outcome_promise_risk,
                "sources": listed,
            },
            ensure_ascii=False,
            indent=2,
        )


def _reject_unknown_citations(card: ComposedCard, known_ids: frozenset[str]) -> None:
    cited = {source_id for fact in card.confirmed_facts for source_id in fact.source_ids}
    unknown = sorted(cited - known_ids)
    if unknown:
        raise ValueError(
            "these cited source ids were not provided: "
            f"{', '.join(unknown)}. Cite only: {', '.join(sorted(known_ids))}"
        )
