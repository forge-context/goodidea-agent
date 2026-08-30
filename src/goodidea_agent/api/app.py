"""FastAPI boundary for the deterministic GoodIdea workflow."""

import os
from collections.abc import Callable, Iterator
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.research import VerticalSliceResult
from goodidea_agent.domain.state import Locale
from goodidea_agent.memory.sqlite import SavedCheckpoint, SessionConflict, SQLiteMemory
from goodidea_agent.model.adapter import ModelUnavailable
from goodidea_agent.runtime import (
    build_answer_reader,
    build_note_taker,
    build_proposal_composer,
    build_workflow,
    open_working_memory,
    recall_about_user,
    user_id_from_environment,
)
from goodidea_agent.tools.sandbox import SandboxPreview, StaticPreviewSandbox
from goodidea_agent.workflow.guidance import (
    GuidanceTransitionError,
    apply_mvp_approval,
    build_mvp_proposal,
)
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    NoOpenQuestion,
    apply_strategy_source_answer,
)


def _remember_about_user(
    session_id: str,
    asked: VerticalSliceResult,
    answer: str,
    database: str,
) -> None:
    """Keep what the user said about themselves. Never what the product concluded.

    Failing to remember must not fail the request: the decision the user just made is
    already recorded in the audit store, which is the part that matters.
    """

    taker = build_note_taker()
    if taker is None or asked.question is None:
        return
    try:
        notes = taker.notice(
            question=asked.question.prompt,
            answer=answer,
            locale=asked.state.locale,
        )
    except ModelUnavailable:
        return
    if not notes:
        return
    with open_working_memory(database) as memory:
        memory.remember(user_id_from_environment(), notes, session_id=session_id)


class ResearchRequest(BaseModel):
    """One user idea submitted to the first bounded vertical slice."""

    model_config = ConfigDict(extra="forbid")

    idea: str = Field(min_length=1, max_length=4_000)
    locale: Locale = "en"


class AnswerRequest(BaseModel):
    """A human answer used to resume the current paused product decision."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(min_length=1, max_length=4_000)


class ApprovalRequest(BaseModel):
    """A human decision about the exact currently visible MVP proposal."""

    model_config = ConfigDict(extra="forbid")

    approved: bool
    feedback: str | None = Field(default=None, min_length=1, max_length=4_000)


WorkflowFactory = Callable[[], AutomaticTradingVerticalSlice]


def _default_workflow() -> AutomaticTradingVerticalSlice:
    return build_workflow()


def create_app(
    database: str | Path | None = None,
    *,
    workflow_factory: WorkflowFactory | None = None,
) -> FastAPI:
    """Build an API whose external tools and database are replaceable in tests."""

    database_path = str(database or os.environ.get("GOODIDEA_DATABASE", "goodidea.db"))
    build_workflow = workflow_factory or _default_workflow
    api = FastAPI(
        title="GoodIdea API",
        version="0.1.0",
        description="Deterministic offline product-guidance vertical slice",
    )

    def memory() -> Iterator[SQLiteMemory]:
        with SQLiteMemory(database_path) as store:
            yield store

    @api.get("/api/v1/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok", "mode": "offline"}

    @api.post(
        "/api/v1/sessions/{session_id}/research",
        response_model=SavedCheckpoint,
        tags=["sessions"],
    )
    def run_research(
        session_id: str,
        request: ResearchRequest,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SavedCheckpoint:
        if not session_id.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="session_id must not be empty",
            )
        result: VerticalSliceResult = build_workflow().run(
            request.idea,
            locale=request.locale,
        )
        try:
            return store.save(session_id, result)
        except SessionConflict as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    @api.get(
        "/api/v1/sessions/{session_id}",
        response_model=SavedCheckpoint,
        tags=["sessions"],
    )
    def get_session(
        session_id: str,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SavedCheckpoint:
        checkpoint = store.load_latest(session_id)
        if checkpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="session not found",
            )
        return checkpoint

    @api.post(
        "/api/v1/sessions/{session_id}/answers",
        response_model=SavedCheckpoint,
        tags=["sessions"],
    )
    def answer_question(
        session_id: str,
        request: AnswerRequest,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SavedCheckpoint:
        checkpoint = store.load_latest(session_id)
        if checkpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="session not found",
            )
        try:
            resumed = apply_strategy_source_answer(
                checkpoint.result, request.answer, reader=build_answer_reader()
            )
        except NoOpenQuestion as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
        if resumed.status == "decision_recorded":
            _remember_about_user(
                session_id, checkpoint.result, request.answer, database_path
            )
        return store.save(session_id, resumed)

    @api.post(
        "/api/v1/sessions/{session_id}/proposal",
        response_model=SavedCheckpoint,
        tags=["sessions"],
    )
    def create_proposal(
        session_id: str,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SavedCheckpoint:
        checkpoint = store.load_latest(session_id)
        if checkpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="session not found",
            )
        try:
            proposed = build_mvp_proposal(
                checkpoint.result,
                composer=build_proposal_composer(),
                notes=recall_about_user(database_path),
            )
        except GuidanceTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
        return store.save(session_id, proposed)

    @api.post(
        "/api/v1/sessions/{session_id}/approval",
        response_model=SavedCheckpoint,
        tags=["sessions"],
    )
    def approve_proposal(
        session_id: str,
        request: ApprovalRequest,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SavedCheckpoint:
        checkpoint = store.load_latest(session_id)
        if checkpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="session not found",
            )
        try:
            completed = apply_mvp_approval(
                checkpoint.result,
                approved=request.approved,
                feedback=request.feedback,
            )
        except GuidanceTransitionError as exc:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
        return store.save(session_id, completed)

    @api.get(
        "/api/v1/sessions/{session_id}/sandbox-preview",
        response_model=SandboxPreview,
        tags=["sessions"],
    )
    def get_sandbox_preview(
        session_id: str,
        store: Annotated[SQLiteMemory, Depends(memory)],
    ) -> SandboxPreview:
        checkpoint = store.load_latest(session_id)
        if checkpoint is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="session not found",
            )
        if checkpoint.result.proposal is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="MVP proposal is required",
            )
        return StaticPreviewSandbox().render(checkpoint.result.proposal)

    return api


app = create_app()
