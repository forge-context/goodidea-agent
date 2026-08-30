"""What GoodIdea remembers about a person between sessions.

This is a second, separate memory. The first one — sessions, evidence, decisions,
approvals — is an audit record: only a workflow transition writes it, and nothing in
it can be revised by a model. This one holds what the user told us about themselves,
which a model may propose and which the user may correct.

The separation is the point. A note is never evidence and never a decision: a claim
in ``AgentState`` must cite a retained source, and a note has none, so remembering
something can inform the next question but can never become a fact the product
asserts.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterable, Sequence
from datetime import UTC, datetime
from pathlib import Path
from types import TracebackType
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field

NoteKind = Literal[
    "capability",
    "resource",
    "constraint",
    "rejected_direction",
    "asked_question",
]

NOTE_KINDS: tuple[NoteKind, ...] = (
    "capability",
    "resource",
    "constraint",
    "rejected_direction",
    "asked_question",
)


class MemoryNote(BaseModel):
    """One durable thing the user told us, in their own terms."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1, pattern=r"^[a-z0-9][a-z0-9-]*$")
    kind: NoteKind
    statement: str = Field(min_length=1)
    written_by: Literal["model", "user"] = "model"


class RecalledNote(MemoryNote):
    """A stored note, with where and when it came from."""

    source_session_id: str = Field(min_length=1)
    recorded_at: datetime


class WorkingMemory:
    """Cross-session notes about one person. It cannot reach the audit record."""

    def __init__(self, database: str | Path = "goodidea.db") -> None:
        self._connection = sqlite3.connect(str(database))
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
        exc: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self.close()

    def remember(
        self,
        user_id: str,
        notes: Iterable[MemoryNote],
        *,
        session_id: str,
        now: datetime | None = None,
    ) -> tuple[RecalledNote, ...]:
        """Store notes, replacing any earlier note with the same id.

        Re-stating something is how a person corrects it, so the newest wording wins
        rather than accumulating beside the old one.
        """

        recorded_at = (now or datetime.now(UTC)).isoformat()
        stored: list[MemoryNote] = []
        with self._connection:
            for note in notes:
                self._connection.execute(
                    """
                    INSERT INTO working_memory
                        (user_id, note_id, kind, statement, source_session_id,
                         written_by, recorded_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (user_id, note_id) DO UPDATE SET
                        kind = excluded.kind,
                        statement = excluded.statement,
                        source_session_id = excluded.source_session_id,
                        written_by = excluded.written_by,
                        recorded_at = excluded.recorded_at
                    """,
                    (
                        user_id,
                        note.id,
                        note.kind,
                        note.statement,
                        session_id,
                        note.written_by,
                        recorded_at,
                    ),
                )
                stored.append(note)
        return self.recall(user_id, ids=tuple(note.id for note in stored))

    def forget(self, user_id: str, note_id: str) -> bool:
        """Remove one note, because a person may withdraw what they said."""

        with self._connection:
            cursor = self._connection.execute(
                "DELETE FROM working_memory WHERE user_id = ? AND note_id = ?",
                (user_id, note_id),
            )
        return cursor.rowcount > 0

    def recall(
        self,
        user_id: str,
        *,
        kinds: Sequence[NoteKind] | None = None,
        ids: Sequence[str] | None = None,
        limit: int = 40,
    ) -> tuple[RecalledNote, ...]:
        """Return the most recently stated notes first."""

        query = "SELECT * FROM working_memory WHERE user_id = ?"
        parameters: list[object] = [user_id]
        if kinds:
            query += f" AND kind IN ({','.join('?' * len(kinds))})"
            parameters.extend(kinds)
        if ids:
            query += f" AND note_id IN ({','.join('?' * len(ids))})"
            parameters.extend(ids)
        query += " ORDER BY recorded_at DESC, note_id ASC LIMIT ?"
        parameters.append(limit)

        rows = self._connection.execute(query, parameters).fetchall()
        return tuple(
            RecalledNote(
                id=row["note_id"],
                kind=row["kind"],
                statement=row["statement"],
                written_by=row["written_by"],
                source_session_id=row["source_session_id"],
                recorded_at=datetime.fromisoformat(row["recorded_at"]),
            )
            for row in rows
        )

    def _create_schema(self) -> None:
        self._connection.executescript(
            f"""
            CREATE TABLE IF NOT EXISTS working_memory (
                user_id TEXT NOT NULL,
                note_id TEXT NOT NULL,
                kind TEXT NOT NULL CHECK (kind IN ({",".join(f"'{k}'" for k in NOTE_KINDS)})),
                statement TEXT NOT NULL,
                source_session_id TEXT NOT NULL,
                written_by TEXT NOT NULL CHECK (written_by IN ('model', 'user')),
                recorded_at TEXT NOT NULL,
                PRIMARY KEY (user_id, note_id)
            );

            CREATE INDEX IF NOT EXISTS working_memory_by_user
                ON working_memory (user_id, recorded_at DESC);
            """
        )
