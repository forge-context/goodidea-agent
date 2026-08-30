"""Model-driven idea assessment.

This replaces keyword matching as the way GoodIdea decides what an idea is. The
model may describe the idea and choose among implemented scenarios; it may not
decide that a product is feasible, promise an outcome, or answer a question that
belongs to the user.
"""

from __future__ import annotations

from typing import Protocol

from goodidea_agent.domain.research import IdeaAssessment
from goodidea_agent.domain.state import Locale
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction

PURPOSE = "idea_assessment"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

_RULES = (
    "You are GoodIdea, a product guidance agent that runs before any code is written.",
    (
        "You describe an idea and name what is still unknown. You never promise an outcome,"
        " never claim an idea will succeed, and never decide something the user must decide."
    ),
    (
        "Set scenario to automatic_trading only when the idea is about automating trading or"
        " investing decisions or order execution. Otherwise set scenario to unsupported."
    ),
    (
        "unsupported_reason is shown to the user, so write it to them. Say that GoodIdea can"
        " only guide automated trading ideas today, and name what their idea is about. Never"
        " write a field name or a scenario value, never judge the idea, and never claim"
        " GoodIdea cannot help with that kind of product in general."
    ),
    (
        "core_uncertainty is the one thing that would most change the product if it turned"
        " out differently. missing_decision is the single decision the user must make next."
    ),
    (
        "Set outcome_promise_risk to true when the idea implies a promised result, such as"
        " money, health, legal, or safety outcomes."
    ),
    (
        "research_topics are two to four checks a web search could actually settle today."
        " Each query must be a search query, not a sentence addressed to a person."
    ),
    (
        "At least one query must aim at a source that can be held accountable: a regulator,"
        " a public body, or a vendor's own product documentation. Vendor documentation is"
        " usually written in English, so write that query in English even when the rest of"
        " the reply is in another language."
    ),
)


class IdeaInterpreter(Protocol):
    """Boundary used by the workflow so the model stays replaceable."""

    def interpret(self, idea: str, *, locale: Locale) -> IdeaAssessment: ...


class ModelIdeaInterpreter:
    """Turn one free-text idea into a validated :class:`IdeaAssessment`."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 1_200) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def interpret(self, idea: str, *, locale: Locale = "en") -> IdeaAssessment:
        request = ModelRequest(
            purpose=PURPOSE,
            messages=(
                ModelMessage(role=ModelRole.SYSTEM, content=self._system_prompt(locale)),
                ModelMessage(role=ModelRole.USER, content=idea),
            ),
            max_output_tokens=self._max_output_tokens,
        )
        assessment, _ = complete_structured(self._adapter, request, IdeaAssessment)
        return assessment

    def _system_prompt(self, locale: Locale) -> str:
        language = _OUTPUT_LANGUAGE[locale]
        return "\n".join(
            (
                *_RULES,
                f"Write every human-readable field in {language}.",
                schema_instruction(IdeaAssessment),
            )
        )
