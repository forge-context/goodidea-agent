"""Write the small program that settles one named uncertainty.

The sandbox can run code safely; it cannot decide what is worth running. That choice
comes from the proposal: the first version claims something is testable, and this
writes the smallest program that tests it.

What the model writes is checked before it is run. The container already denies the
network, so a program that tries to reach it would simply fail — but failing for the
wrong reason wastes the user's question, and a request to reach outside is a sign the
model misunderstood the task rather than a sign of a hostile author.
"""

from __future__ import annotations

import json
import re
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.research import VerticalSliceResult
from goodidea_agent.domain.state import Locale
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction
from goodidea_agent.tools.sandbox_exec import SandboxArtifact

PURPOSE = "sandbox_artifact"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

# Reaching outside is impossible in the container. Naming these anyway keeps the
# failure legible: the reply is sent back to be rewritten rather than run and lost.
_OUTSIDE_WORLD = re.compile(
    r"\b(?:import\s+(?:socket|urllib|http|ftplib|smtplib|subprocess|requests)"
    r"|from\s+(?:socket|urllib|http|ftplib|smtplib|subprocess|requests)\s+import"
    r"|open\s*\(\s*['\"]/)",
)

_RULES = (
    "You write one small program that answers a single question about a proposed MVP.",
    (
        "The program runs with no network, a read-only filesystem, and no credentials."
        " Use only the Python standard library and the files you declare yourself."
    ),
    (
        "It must print a short, deterministic result: the same inputs must produce the"
        " same output every time. No timestamps, no randomness without a fixed seed, no"
        " reading the clock."
    ),
    (
        "question is the one uncertainty this run settles, written for the user in one"
        " sentence. It must be something running the program can actually answer."
    ),
    (
        "limitation says what the run does not tell them. If the idea hopes for an"
        " outcome, say plainly that this run cannot speak to it."
    ),
    "files are the fixed sample data the program reads. Keep them small and readable.",
)


class ComposedArtifact(BaseModel):
    """A runnable check, plus what it will and will not establish."""

    model_config = ConfigDict(frozen=True)

    question: str = Field(min_length=1)
    code: str = Field(min_length=1)
    files: dict[str, str] = Field(default_factory=dict)
    limitation: str = Field(min_length=1)

    def as_artifact(self) -> SandboxArtifact:
        return SandboxArtifact(question=self.question, code=self.code, files=self.files)


class SandboxAuthor(Protocol):
    """Boundary used by the workflow so the model stays replaceable."""

    def write(self, result: VerticalSliceResult) -> ComposedArtifact: ...


class ModelSandboxAuthor:
    """Turn an approved boundary into one runnable question."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 1_600) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def write(self, result: VerticalSliceResult) -> ComposedArtifact:
        request = ModelRequest(
            purpose=PURPOSE,
            messages=(
                ModelMessage(
                    role=ModelRole.SYSTEM,
                    content=self._system_prompt(result.state.locale),
                ),
                ModelMessage(role=ModelRole.USER, content=self._user_prompt(result)),
            ),
            max_output_tokens=self._max_output_tokens,
        )
        artifact, _ = complete_structured(
            self._adapter,
            request,
            ComposedArtifact,
            check=_reject_a_program_that_reaches_outside,
        )
        return artifact

    def _system_prompt(self, locale: Locale) -> str:
        return "\n".join(
            (
                *_RULES,
                (
                    f"Write question and limitation in {_OUTPUT_LANGUAGE[locale]}."
                    " Keep code and file contents in English."
                ),
                schema_instruction(ComposedArtifact),
            )
        )

    def _user_prompt(self, result: VerticalSliceResult) -> str:
        proposal = result.proposal
        context: dict[str, object] = {"idea": result.state.idea}
        if proposal is not None:
            context["first_version_does"] = list(proposal.included)
            context["first_version_does_not"] = list(proposal.excluded)
            context["acceptance_criteria"] = list(proposal.acceptance_criteria)
        if result.assessment is not None:
            context["core_uncertainty"] = result.assessment.core_uncertainty
            context["outcome_the_user_hopes_for"] = result.assessment.desired_outcome
        return json.dumps(context, ensure_ascii=False, indent=2)


def _reject_a_program_that_reaches_outside(artifact: ComposedArtifact) -> None:
    if _OUTSIDE_WORLD.search(artifact.code):
        raise ValueError(
            "the program tries to reach the network, run another process, or read an"
            " absolute path. Rewrite it using only the declared files."
        )
