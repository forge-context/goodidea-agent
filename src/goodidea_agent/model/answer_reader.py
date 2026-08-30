"""Read what the user actually said, and only then let a decision be recorded.

Keyword matching came from the fixed demo, where the question and the parser were
written together. Now the question is written for the session, so the answer has to
be understood rather than matched.

The model reads the answer. It does not get to decide that an unclear answer is
good enough: an answer that agrees without choosing is stopped before the model sees
it, and an answer the model is not confident about records nothing.
"""

from __future__ import annotations

import json
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.state import Locale, StrategySourceChoice
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction

PURPOSE = "strategy_source_answer"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

_RULES = (
    "You read one answer a user gave to one question, and report what it means.",
    (
        "existing_rules means the user already has a trading rule or strategy in mind that"
        " they want the product to execute. Naming a strategy type they intend to use is"
        " naming a rule they have."
    ),
    (
        "discover_rules means the user does not have a rule yet and wants help finding or"
        " comparing candidates."
    ),
    (
        "unclear means the answer does not settle this. Agreement without a choice, a"
        " question back, a change of subject, or an answer that could be read either way"
        " are all unclear. Choosing for the user is the one mistake you must never make,"
        " so prefer unclear whenever you are weighing two readings."
    ),
    (
        "restatement is how you would say the user's choice back to them in one short"
        " sentence, using their own words. Leave it empty when the answer is unclear."
    ),
)


class AnswerReading(BaseModel):
    """What one answer decided, if anything."""

    model_config = ConfigDict(frozen=True)

    reading: Literal["existing_rules", "discover_rules", "unclear"]
    restatement: str = Field(default="")
    why: str = Field(min_length=1)

    def as_choice(self) -> StrategySourceChoice | None:
        if self.reading == "existing_rules":
            return StrategySourceChoice.EXISTING_RULES
        if self.reading == "discover_rules":
            return StrategySourceChoice.DISCOVER_RULES
        return None


class AnswerReader(Protocol):
    """Boundary used by the workflow so the model stays replaceable."""

    def read(self, *, question: str, answer: str, locale: Locale) -> AnswerReading: ...


class ModelAnswerReader:
    """Understand a free-text answer to a question the model itself wrote."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 600) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def read(self, *, question: str, answer: str, locale: Locale) -> AnswerReading:
        request = ModelRequest(
            purpose=PURPOSE,
            messages=(
                ModelMessage(role=ModelRole.SYSTEM, content=self._system_prompt(locale)),
                ModelMessage(
                    role=ModelRole.USER,
                    content=json.dumps(
                        {"question": question, "answer": answer},
                        ensure_ascii=False,
                        indent=2,
                    ),
                ),
            ),
            max_output_tokens=self._max_output_tokens,
        )
        reading, _ = complete_structured(self._adapter, request, AnswerReading)
        return reading

    def _system_prompt(self, locale: Locale) -> str:
        return "\n".join(
            (
                *_RULES,
                f"Write restatement and why in {_OUTPUT_LANGUAGE[locale]}.",
                schema_instruction(AnswerReading),
            )
        )
