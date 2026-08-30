"""SQLite-backed product memory for GoodIdea sessions.

The latest result is stored as a validated snapshot while evidence and open questions
are also normalized into queryable tables. Re-saving the same result is idempotent.
"""

from __future__ import annotations

import hashlib
import json
import sqlite3
from collections.abc import Callable
from datetime import UTC, date, datetime
from pathlib import Path
from types import TracebackType
from typing import Self

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.research import VerticalSliceResult
from goodidea_agent.domain.state import (
    ApprovalRecord,
    EvidenceSource,
    OpenQuestion,
    ProductDecision,
)


class SessionConflict(ValueError):
    """Raised when a session ID is reused for a different initial idea or locale."""


class SavedCheckpoint(BaseModel):
    """Identity and content of one persisted workflow snapshot."""

    model_config = ConfigDict(frozen=True)

    session_id: str = Field(min_length=1)
    version: int = Field(ge=1)
    saved_at: datetime
    result: VerticalSliceResult


class SQLiteMemory:
    """Transactional product memory using only Python's standard SQLite driver."""

    def __init__(
        self,
        database: str | Path,
        *,
        clock: Callable[[], datetime] = lambda: datetime.now(UTC),
    ) -> None:
        self._database = str(database)
        self._clock = clock
        self._connection = sqlite3.connect(self._database, isolation_level=None)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON")
        self._create_schema()

    def close(self) -> None:
        self._connection.close()

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()

    def save(self, session_id: str, result: VerticalSliceResult) -> SavedCheckpoint:
        """Persist a complete result and return its stable checkpoint identity."""

        if not session_id.strip():
            raise ValueError("session_id must not be empty")

        payload = json.dumps(
            result.model_dump(mode="json"),
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        saved_at = self._clock().astimezone(UTC)

        self._connection.execute("BEGIN IMMEDIATE")
        try:
            self._ensure_session(session_id, result, saved_at)
            existing = self._connection.execute(
                """
                SELECT version, saved_at, payload_json
                FROM checkpoints
                WHERE session_id = ? AND payload_sha256 = ?
                """,
                (session_id, digest),
            ).fetchone()
            if existing is not None:
                self._connection.execute("COMMIT")
                return self._row_to_checkpoint(session_id, existing)

            next_version = self._next_version(session_id)
            self._connection.execute(
                """
                INSERT INTO checkpoints (
                    session_id, version, status, stage, payload_json, payload_sha256, saved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    next_version,
                    result.status,
                    result.state.current_stage.value,
                    payload,
                    digest,
                    saved_at.isoformat(),
                ),
            )
            self._replace_current_memory(session_id, result)
            self._connection.execute(
                "UPDATE sessions SET updated_at = ? WHERE session_id = ?",
                (saved_at.isoformat(), session_id),
            )
            self._connection.execute("COMMIT")
        except Exception:
            self._connection.execute("ROLLBACK")
            raise

        return SavedCheckpoint(
            session_id=session_id,
            version=next_version,
            saved_at=saved_at,
            result=result,
        )

    def load_latest(self, session_id: str) -> SavedCheckpoint | None:
        """Load and validate the newest snapshot for a session."""

        row = self._connection.execute(
            """
            SELECT version, saved_at, payload_json
            FROM checkpoints
            WHERE session_id = ?
            ORDER BY version DESC
            LIMIT 1
            """,
            (session_id,),
        ).fetchone()
        if row is None:
            return None
        return self._row_to_checkpoint(session_id, row)

    def evidence_for(self, session_id: str) -> tuple[EvidenceSource, ...]:
        """Return the current normalized evidence set for inspection or UI use."""

        rows = self._connection.execute(
            """
            SELECT source_id, title, url, publisher, retrieved_on, source_type, excerpt
            FROM evidence
            WHERE session_id = ?
            ORDER BY ordinal
            """,
            (session_id,),
        ).fetchall()
        return tuple(
            EvidenceSource(
                id=row["source_id"],
                title=row["title"],
                url=row["url"],
                publisher=row["publisher"],
                retrieved_on=date.fromisoformat(row["retrieved_on"]),
                source_type=row["source_type"],
                excerpt=row["excerpt"],
            )
            for row in rows
        )

    def open_questions_for(self, session_id: str) -> tuple[OpenQuestion, ...]:
        """Return unresolved user decisions without reconstructing them from chat text."""

        rows = self._connection.execute(
            """
            SELECT question_id, prompt, why_it_matters
            FROM open_questions
            WHERE session_id = ? AND status = 'open'
            ORDER BY ordinal
            """,
            (session_id,),
        ).fetchall()
        return tuple(
            OpenQuestion(
                id=row["question_id"],
                prompt=row["prompt"],
                why_it_matters=row["why_it_matters"],
            )
            for row in rows
        )

    def decisions_for(self, session_id: str) -> tuple[ProductDecision, ...]:
        """Return explicit user decisions separately from evidence and chat text."""

        rows = self._connection.execute(
            """
            SELECT decision_id, choice, statement, decided_by
            FROM decisions
            WHERE session_id = ?
            ORDER BY ordinal
            """,
            (session_id,),
        ).fetchall()
        return tuple(
            ProductDecision(
                id=row["decision_id"],
                choice=row["choice"],
                statement=row["statement"],
                decided_by=row["decided_by"],
            )
            for row in rows
        )

    def approvals_for(self, session_id: str) -> tuple[ApprovalRecord, ...]:
        """Return approvals tied to exact proposal identities."""

        rows = self._connection.execute(
            """
            SELECT approval_id, proposal_id, approved_by
            FROM approvals
            WHERE session_id = ?
            ORDER BY ordinal
            """,
            (session_id,),
        ).fetchall()
        return tuple(
            ApprovalRecord(
                id=row["approval_id"],
                proposal_id=row["proposal_id"],
                approved_by=row["approved_by"],
            )
            for row in rows
        )

    def _create_schema(self) -> None:
        self._connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                idea TEXT NOT NULL,
                locale TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS checkpoints (
                session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
                version INTEGER NOT NULL,
                status TEXT NOT NULL,
                stage TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                payload_sha256 TEXT NOT NULL,
                saved_at TEXT NOT NULL,
                PRIMARY KEY (session_id, version),
                UNIQUE (session_id, payload_sha256)
            );

            CREATE TABLE IF NOT EXISTS evidence (
                session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
                source_id TEXT NOT NULL,
                ordinal INTEGER NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                publisher TEXT NOT NULL,
                retrieved_on TEXT NOT NULL,
                source_type TEXT NOT NULL,
                excerpt TEXT NOT NULL,
                PRIMARY KEY (session_id, source_id)
            );

            CREATE TABLE IF NOT EXISTS open_questions (
                session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
                question_id TEXT NOT NULL,
                ordinal INTEGER NOT NULL,
                prompt TEXT NOT NULL,
                why_it_matters TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
                PRIMARY KEY (session_id, question_id)
            );

            CREATE TABLE IF NOT EXISTS decisions (
                session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
                decision_id TEXT NOT NULL,
                ordinal INTEGER NOT NULL,
                choice TEXT NOT NULL,
                statement TEXT NOT NULL,
                decided_by TEXT NOT NULL CHECK (decided_by = 'user'),
                PRIMARY KEY (session_id, decision_id)
            );

            CREATE TABLE IF NOT EXISTS approvals (
                session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
                approval_id TEXT NOT NULL,
                ordinal INTEGER NOT NULL,
                proposal_id TEXT NOT NULL,
                approved_by TEXT NOT NULL CHECK (approved_by = 'user'),
                PRIMARY KEY (session_id, approval_id)
            );

            PRAGMA user_version = 3;
            """
        )

    def _ensure_session(
        self,
        session_id: str,
        result: VerticalSliceResult,
        saved_at: datetime,
    ) -> None:
        existing = self._connection.execute(
            "SELECT idea, locale FROM sessions WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        if existing is None:
            timestamp = saved_at.isoformat()
            self._connection.execute(
                """
                INSERT INTO sessions (session_id, idea, locale, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (session_id, result.state.idea, result.state.locale, timestamp, timestamp),
            )
            return

        if existing["idea"] != result.state.idea or existing["locale"] != result.state.locale:
            raise SessionConflict("session ID already belongs to a different idea or locale")

    def _next_version(self, session_id: str) -> int:
        row = self._connection.execute(
            "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM checkpoints WHERE session_id = ?",
            (session_id,),
        ).fetchone()
        return int(row["next_version"])

    def _replace_current_memory(self, session_id: str, result: VerticalSliceResult) -> None:
        self._connection.execute("DELETE FROM evidence WHERE session_id = ?", (session_id,))
        self._connection.executemany(
            """
            INSERT INTO evidence (
                session_id, source_id, ordinal, title, url, publisher,
                retrieved_on, source_type, excerpt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                (
                    session_id,
                    source.id,
                    ordinal,
                    source.title,
                    str(source.url),
                    source.publisher,
                    source.retrieved_on.isoformat(),
                    source.source_type,
                    source.excerpt,
                )
                for ordinal, source in enumerate(result.state.evidence_sources)
            ),
        )

        self._connection.execute("DELETE FROM open_questions WHERE session_id = ?", (session_id,))
        self._connection.executemany(
            """
            INSERT INTO open_questions (
                session_id, question_id, ordinal, prompt, why_it_matters, status
            ) VALUES (?, ?, ?, ?, ?, 'open')
            """,
            (
                (
                    session_id,
                    question.id,
                    ordinal,
                    question.prompt,
                    question.why_it_matters,
                )
                for ordinal, question in enumerate(result.state.open_questions)
            ),
        )


        self._connection.execute("DELETE FROM decisions WHERE session_id = ?", (session_id,))
        self._connection.executemany(
            """
            INSERT INTO decisions (
                session_id, decision_id, ordinal, choice, statement, decided_by
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                (
                    session_id,
                    decision.id,
                    ordinal,
                    decision.choice.value,
                    decision.statement,
                    decision.decided_by,
                )
                for ordinal, decision in enumerate(result.state.product_decisions)
            ),
        )

        self._connection.execute("DELETE FROM approvals WHERE session_id = ?", (session_id,))
        self._connection.executemany(
            """
            INSERT INTO approvals (
                session_id, approval_id, ordinal, proposal_id, approved_by
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (
                (
                    session_id,
                    approval.id,
                    ordinal,
                    approval.proposal_id,
                    approval.approved_by,
                )
                for ordinal, approval in enumerate(result.state.approvals)
            ),
        )

    def _row_to_checkpoint(self, session_id: str, row: sqlite3.Row) -> SavedCheckpoint:
        return SavedCheckpoint(
            session_id=session_id,
            version=row["version"],
            saved_at=datetime.fromisoformat(row["saved_at"]),
            result=VerticalSliceResult.model_validate_json(row["payload_json"]),
        )
