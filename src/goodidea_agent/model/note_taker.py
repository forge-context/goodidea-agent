"""Notice what the user told us about themselves, and nothing more.

A model reads the exchange and proposes notes for working memory. It may record what
the person said about their own skills, resources, constraints, and the directions
they ruled out. It may not record a product decision: those live in the audit record
and only a workflow transition writes them.
"""

from __future__ import annotations

import json
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.state import Locale
from goodidea_agent.memory.working import NOTE_KINDS, MemoryNote
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction

PURPOSE = "working_memory_notes"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

_RULES = (
    "You record what a user said about themselves, so they never have to say it twice.",
    (
        "Record only what this person stated or plainly implied about themselves:"
        " capability is what they can already do, resource is time, money, data or"
        " access they have, constraint is a limit they are working within, and"
        " rejected_direction is something they said they do not want."
    ),
    (
        "asked_question records a question they have already been asked, so a later"
        " session does not ask it again."
    ),
    (
        "Record nothing else. Do not record the product decision they made, what you"
        " concluded about their idea, or anything you inferred rather than heard. An"
        " empty list is the right answer when they only answered the question."
    ),
    (
        "Each note gets a short stable id in lowercase words joined by hyphens, so"
        " restating the same thing later replaces it instead of piling up."
    ),
    (
        "Write each statement in the user's own terms, in one sentence, as a fact about"
        " them rather than an instruction to anyone."
    ),
)


class ProposedNotes(BaseModel):
    """Notes a model suggests keeping about the user."""

    model_config = ConfigDict(frozen=True)

    notes: tuple[MemoryNote, ...] = Field(default=(), max_length=6)


class NoteTaker(Protocol):
    """Boundary used by the workflow so the model stays replaceable."""

    def notice(
        self,
        *,
        question: str,
        answer: str,
        locale: Locale,
    ) -> tuple[MemoryNote, ...]: ...


class ModelNoteTaker:
    """Extract durable notes about the user from one exchange."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 700) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def notice(
        self,
        *,
        question: str,
        answer: str,
        locale: Locale,
    ) -> tuple[MemoryNote, ...]:
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
        proposed, _ = complete_structured(self._adapter, request, ProposedNotes)
        return tuple(
            note.model_copy(update={"written_by": "model"}) for note in proposed.notes
        )

    def _system_prompt(self, locale: Locale) -> str:
        return "\n".join(
            (
                *_RULES,
                f"The allowed kinds are: {', '.join(NOTE_KINDS)}.",
                f"Write every statement in {_OUTPUT_LANGUAGE[locale]}.",
                schema_instruction(ProposedNotes),
            )
        )
