"""Deterministic model adapters: scripted fakes and recorded fixtures.

Every test and the offline evaluation run through these, so the suite keeps working
after an API key expires. Recorded fixtures also act as the regression baseline when
the provider changes: the same request can be replayed against a new model.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from pathlib import Path

from goodidea_agent.model.adapter import (
    ModelAdapter,
    ModelErrorKind,
    ModelRequest,
    ModelResponse,
    ModelUnavailable,
)


def request_fingerprint(request: ModelRequest) -> str:
    """Identify a call by what was asked, not by which provider answered it.

    The model name is deliberately excluded so one fixture can be replayed against a
    replacement provider and compared.
    """

    canonical = json.dumps(
        {
            "purpose": request.purpose,
            "messages": [
                {"role": message.role.value, "content": message.content}
                for message in request.messages
            ],
            "max_output_tokens": request.max_output_tokens,
            "temperature": request.temperature,
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:32]


class FakeModelAdapter:
    """Return scripted payloads in order and record every request."""

    def __init__(self, replies: Sequence[Mapping[str, object] | Exception]) -> None:
        self._replies = list(replies)
        self._index = 0
        self.requests: list[ModelRequest] = []

    def complete(self, request: ModelRequest) -> ModelResponse:
        self.requests.append(request)
        if self._index >= len(self._replies):
            raise ModelUnavailable(ModelErrorKind.CONFIGURATION, "fake adapter ran out of replies")
        reply = self._replies[self._index]
        self._index += 1
        if isinstance(reply, Exception):
            raise reply
        return ModelResponse(payload=dict(reply), model_name="fake")


class RecordedModelAdapter:
    """Replay fixtures captured from a live provider."""

    def __init__(self, directory: str | Path) -> None:
        self._directory = Path(directory)
        self.requests: list[ModelRequest] = []
        # Callers that swallow ModelUnavailable would otherwise report a missing
        # fixture as a model outage, which reads as a product failure.
        self.misses: list[str] = []

    def complete(self, request: ModelRequest) -> ModelResponse:
        self.requests.append(request)
        fingerprint = request_fingerprint(request)
        path = self._directory / f"{fingerprint}.json"
        if not path.is_file():
            self.misses.append(f"{request.purpose}:{fingerprint}")
            raise ModelUnavailable(
                ModelErrorKind.CONFIGURATION, "no recorded response for this request"
            )
        record = json.loads(path.read_text(encoding="utf-8"))
        return ModelResponse.model_validate(record["response"])


class RecordingModelAdapter:
    """Wrap a live adapter and write each answered request to disk."""

    def __init__(self, inner: ModelAdapter, directory: str | Path) -> None:
        self._inner = inner
        self._directory = Path(directory)
        self.written: list[Path] = []

    def complete(self, request: ModelRequest) -> ModelResponse:
        response = self._inner.complete(request)
        self._directory.mkdir(parents=True, exist_ok=True)
        path = self._directory / f"{request_fingerprint(request)}.json"
        path.write_text(
            json.dumps(
                {
                    "fingerprint": request_fingerprint(request),
                    "request": request.model_dump(mode="json"),
                    "response": response.model_dump(mode="json"),
                },
                ensure_ascii=False,
                indent=2,
                sort_keys=True,
            )
            + "\n",
            encoding="utf-8",
        )
        self.written.append(path)
        return response
