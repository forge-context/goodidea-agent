"""OpenAI-compatible Chat Completions adapter.

One implementation covers Bailian, OpenAI, DeepSeek, and local servers, so changing
provider is a change of base URL, model name, and key. Providers with a native wire
format need a second class behind :class:`ModelAdapter`, not a workflow change.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from collections.abc import Mapping
from typing import Protocol, cast

from goodidea_agent.model.adapter import (
    FinishReason,
    MalformedModelResponse,
    ModelErrorKind,
    ModelRequest,
    ModelResponse,
    ModelUnavailable,
    ModelUsage,
)

_FINISH_REASONS: frozenset[str] = frozenset({"stop", "length", "content_filter", "tool_calls"})


class HttpTransport(Protocol):
    """Minimal HTTP boundary so tests never reach the network."""

    def post_json(
        self,
        url: str,
        *,
        headers: Mapping[str, str],
        body: bytes,
        timeout_seconds: float,
    ) -> tuple[int, bytes]: ...


class UrllibTransport:
    """Standard-library transport, chosen to avoid a new runtime dependency."""

    def post_json(
        self,
        url: str,
        *,
        headers: Mapping[str, str],
        body: bytes,
        timeout_seconds: float,
    ) -> tuple[int, bytes]:
        request = urllib.request.Request(url, data=body, headers=dict(headers), method="POST")
        try:
            with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
                return int(response.status), response.read()
        except urllib.error.HTTPError as error:
            return int(error.code), error.read()
        except TimeoutError as error:
            raise ModelUnavailable(ModelErrorKind.TIMEOUT, "model call timed out") from error
        except urllib.error.URLError as error:
            reason = getattr(error, "reason", None)
            if isinstance(reason, TimeoutError):
                raise ModelUnavailable(ModelErrorKind.TIMEOUT, "model call timed out") from error
            raise ModelUnavailable(ModelErrorKind.NETWORK, "model host unreachable") from error


class OpenAICompatibleModelAdapter:
    """Call a Chat Completions endpoint and return one parsed JSON object."""

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        transport: HttpTransport | None = None,
        timeout_seconds: float = 30.0,
        extra_body: Mapping[str, object] | None = None,
    ) -> None:
        if not base_url or not api_key or not model:
            raise ModelUnavailable(
                ModelErrorKind.CONFIGURATION, "model configuration is incomplete"
            )
        self._endpoint = f"{base_url.rstrip('/')}/chat/completions"
        self._api_key = api_key
        self._model = model
        self._transport = transport or UrllibTransport()
        self._timeout_seconds = timeout_seconds
        self._extra_body = dict(extra_body or {})

    @classmethod
    def from_environment(
        cls,
        *,
        transport: HttpTransport | None = None,
    ) -> OpenAICompatibleModelAdapter:
        """Build from provider-neutral variables so a swap never edits code."""

        extra_body_raw = os.environ.get("GOODIDEA_MODEL_EXTRA_BODY", "").strip()
        try:
            extra_body = json.loads(extra_body_raw) if extra_body_raw else {}
        except json.JSONDecodeError as error:
            raise ModelUnavailable(
                ModelErrorKind.CONFIGURATION, "GOODIDEA_MODEL_EXTRA_BODY is not valid JSON"
            ) from error
        if not isinstance(extra_body, dict):
            raise ModelUnavailable(
                ModelErrorKind.CONFIGURATION, "GOODIDEA_MODEL_EXTRA_BODY must be a JSON object"
            )

        timeout_raw = os.environ.get("GOODIDEA_MODEL_TIMEOUT_SECONDS", "").strip()
        try:
            timeout_seconds = float(timeout_raw) if timeout_raw else 30.0
        except ValueError as error:
            raise ModelUnavailable(
                ModelErrorKind.CONFIGURATION, "GOODIDEA_MODEL_TIMEOUT_SECONDS is not a number"
            ) from error

        return cls(
            base_url=os.environ.get("GOODIDEA_MODEL_BASE_URL", "").strip(),
            api_key=os.environ.get("GOODIDEA_MODEL_API_KEY", "").strip(),
            model=os.environ.get("GOODIDEA_MODEL_NAME", "").strip(),
            transport=transport,
            timeout_seconds=timeout_seconds,
            extra_body=extra_body,
        )

    @property
    def model_name(self) -> str:
        return self._model

    def complete(self, request: ModelRequest) -> ModelResponse:
        body = {
            "model": self._model,
            "messages": [
                {"role": message.role.value, "content": message.content}
                for message in request.messages
            ],
            "temperature": request.temperature,
            "max_tokens": request.max_output_tokens,
            "response_format": {"type": "json_object"},
            **self._extra_body,
        }
        started = time.monotonic()
        status, raw = self._transport.post_json(
            self._endpoint,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            body=json.dumps(body).encode("utf-8"),
            timeout_seconds=self._timeout_seconds,
        )
        latency_ms = int((time.monotonic() - started) * 1000)
        self._raise_for_status(status)

        try:
            payload = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise MalformedModelResponse("upstream_json", latency_ms=latency_ms) from error
        if not isinstance(payload, Mapping):
            raise MalformedModelResponse("upstream_json", latency_ms=latency_ms)

        usage = _read_usage(payload.get("usage"))
        finish_reason = _read_finish_reason(payload)
        content = _read_content(payload)
        if content is None:
            raise MalformedModelResponse(
                "upstream_shape",
                finish_reason=finish_reason,
                usage=usage,
                latency_ms=latency_ms,
            )

        try:
            result = json.loads(content)
        except json.JSONDecodeError as error:
            raise MalformedModelResponse(
                "content_json",
                finish_reason=finish_reason,
                usage=usage,
                latency_ms=latency_ms,
            ) from error
        if not isinstance(result, dict):
            raise MalformedModelResponse(
                "content_json",
                finish_reason=finish_reason,
                usage=usage,
                latency_ms=latency_ms,
            )

        return ModelResponse(
            payload=result,
            usage=usage,
            finish_reason=finish_reason,
            latency_ms=latency_ms,
            model_name=self._model,
        )

    def _raise_for_status(self, status: int) -> None:
        if status in (401, 403):
            raise ModelUnavailable(ModelErrorKind.AUTHENTICATION, "model rejected the credential")
        if status == 429:
            raise ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")
        if status >= 400:
            raise ModelUnavailable(ModelErrorKind.API, "model endpoint returned an error")


def _read_usage(raw: object) -> ModelUsage:
    usage = raw if isinstance(raw, Mapping) else {}
    input_tokens = _count(usage.get("prompt_tokens", usage.get("input_tokens", 0)))
    output_tokens = _count(usage.get("completion_tokens", usage.get("output_tokens", 0)))
    total = _count(usage.get("total_tokens", input_tokens + output_tokens))
    return ModelUsage(input_tokens=input_tokens, output_tokens=output_tokens, total_tokens=total)


def _count(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return 0
    return max(0, int(value))


def _first_choice(payload: Mapping[str, object]) -> Mapping[str, object] | None:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    first = choices[0]
    return first if isinstance(first, Mapping) else None


def _read_finish_reason(payload: Mapping[str, object]) -> FinishReason | None:
    choice = _first_choice(payload)
    if choice is None:
        return None
    raw = choice.get("finish_reason")
    if raw is None:
        return None
    value = str(raw)
    return cast(FinishReason, value if value in _FINISH_REASONS else "other")


def _read_content(payload: Mapping[str, object]) -> str | None:
    choice = _first_choice(payload)
    if choice is None:
        return None
    message = choice.get("message")
    if not isinstance(message, Mapping):
        return None
    content = message.get("content")
    return content if isinstance(content, str) and content.strip() else None
