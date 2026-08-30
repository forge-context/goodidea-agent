"""Build the workflow from whatever is configured, without changing its behaviour.

Nothing here decides product rules. It only answers one question: which adapters
exist right now. With no configuration the deterministic offline slice runs; with a
model the idea is assessed; with a model and live search the whole research step is
real. A partial configuration never produces a half-real answer.
"""

from __future__ import annotations

import os
from pathlib import Path

from goodidea_agent.memory.working import RecalledNote, WorkingMemory
from goodidea_agent.model.adapter import ModelAdapter, ModelUnavailable
from goodidea_agent.model.answer_reader import AnswerReader, ModelAnswerReader
from goodidea_agent.model.composer import CardComposer, ModelCardComposer
from goodidea_agent.model.interpreter import IdeaInterpreter, ModelIdeaInterpreter
from goodidea_agent.model.note_taker import ModelNoteTaker, NoteTaker
from goodidea_agent.model.openai_compatible import OpenAICompatibleModelAdapter
from goodidea_agent.model.proposer import ModelProposalComposer, ProposalComposer
from goodidea_agent.model.sandbox_author import ModelSandboxAuthor, SandboxAuthor
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.tools.sandbox_exec import ContainerSandbox, ExecutionSandbox
from goodidea_agent.tools.web_search import (
    SearchUnavailable,
    TavilyWebSearchAdapter,
    WebSearchAdapter,
)
from goodidea_agent.workflow.evidence import NOT_EVIDENCE_HOSTS
from goodidea_agent.workflow.vertical_slice import AutomaticTradingVerticalSlice


def model_from_environment() -> ModelAdapter | None:
    try:
        return OpenAICompatibleModelAdapter.from_environment()
    except ModelUnavailable:
        return None


def live_search_from_environment() -> WebSearchAdapter | None:
    try:
        return TavilyWebSearchAdapter.from_environment(
            exclude_domains=sorted(NOT_EVIDENCE_HOSTS)
        )
    except (SearchUnavailable, ImportError):
        return None


def build_workflow() -> AutomaticTradingVerticalSlice:
    """Assemble the most real workflow the current configuration supports."""

    model = model_from_environment()
    live_search = live_search_from_environment()

    interpreter: IdeaInterpreter | None = None
    composer: CardComposer | None = None
    if model is not None:
        interpreter = ModelIdeaInterpreter(model)
        # Model-written answers cite live sources, so they need live search. Pairing a
        # composer with curated fixtures would search for topics the fixtures cannot
        # answer, and the run would fail for a reason that hides the real cause.
        if live_search is not None:
            composer = ModelCardComposer(model)

    return AutomaticTradingVerticalSlice(
        live_search or build_demo_search_adapter(),
        interpreter=interpreter,
        composer=composer,
    )


def build_proposal_composer() -> ProposalComposer | None:
    """Write the MVP boundary with a model when one is configured."""

    model = model_from_environment()
    return ModelProposalComposer(model) if model is not None else None


def build_answer_reader() -> AnswerReader | None:
    """Understand the user's own words when a model is configured."""

    model = model_from_environment()
    return ModelAnswerReader(model) if model is not None else None


def build_note_taker() -> NoteTaker | None:
    """Notice what the user said about themselves, when a model is configured."""

    model = model_from_environment()
    return ModelNoteTaker(model) if model is not None else None


def build_sandbox_author() -> SandboxAuthor | None:
    """Write the runnable check with a model, when one is configured."""

    model = model_from_environment()
    return ModelSandboxAuthor(model) if model is not None else None


def execution_sandbox() -> ExecutionSandbox | None:
    """Return the sandbox only when the code can really be isolated.

    A machine without a container runtime gets no sandbox rather than a weaker one,
    because a result produced without isolation is not the same result.
    """

    sandbox = ContainerSandbox()
    return sandbox if sandbox.available() else None


def user_id_from_environment() -> str:
    """Identify whose working memory this is.

    A single local operator is the current reality, so the default is one fixed id.
    Naming it now means multiple users later changes configuration, not the schema.
    """

    return os.environ.get("GOODIDEA_USER_ID", "local").strip() or "local"


def open_working_memory(database: str | Path | None = None) -> WorkingMemory:
    return WorkingMemory(database or os.environ.get("GOODIDEA_DATABASE", "goodidea.db"))


def recall_about_user(database: str | Path | None = None) -> tuple[RecalledNote, ...]:
    """Read what is remembered about the user, and close the connection again."""

    with open_working_memory(database) as memory:
        return memory.recall(user_id_from_environment())


def describe_runtime() -> str:
    """One line naming which parts are live, for a CLI or a startup log."""

    model = "model" if model_from_environment() is not None else "no model"
    search = "live search" if live_search_from_environment() is not None else "fixture search"
    sandbox = "sandbox" if execution_sandbox() is not None else "no sandbox"
    return f"{model} · {search} · {sandbox}"
