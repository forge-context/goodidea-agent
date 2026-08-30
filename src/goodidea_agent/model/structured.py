"""Structured output that does not depend on a provider-specific schema feature.

Providers disagree on how a schema is enforced: some accept a strict JSON schema,
some only guarantee "valid JSON", and some express it as a tool call. The portable
subset is: ask for JSON, validate locally, and repair once. Validation stays in this
repository, so switching provider does not weaken the contract.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from goodidea_agent.model.adapter import (
    MalformedModelResponse,
    ModelAdapter,
    ModelMessage,
    ModelRequest,
    ModelResponse,
    ModelRole,
)

T = TypeVar("T", bound=BaseModel)

_MAX_ERROR_CHARACTERS = 600


def schema_instruction(schema: type[BaseModel]) -> str:
    """Render the JSON Schema a reply must satisfy."""

    return (
        "Reply with exactly one JSON object and nothing else. "
        "It must satisfy this JSON Schema:\n"
        f"{json.dumps(schema.model_json_schema(), ensure_ascii=False, sort_keys=True)}"
    )


def complete_structured(
    adapter: ModelAdapter,
    request: ModelRequest,
    schema: type[T],
    *,
    repair_attempts: int = 1,
    check: Callable[[T], None] | None = None,
) -> tuple[T, ModelResponse]:
    """Return a validated object, repairing the reply at most ``repair_attempts`` times.

    ``check`` carries rules the schema cannot express on its own, such as "every cited
    identifier must exist". It raises ``ValueError`` and is repaired the same way, so a
    grounding mistake gets the same second chance as a shape mistake.
    """

    attempt_request = request
    last_error: Exception | None = None
    for remaining in range(repair_attempts, -1, -1):
        response = adapter.complete(attempt_request)
        try:
            validated = schema.model_validate(response.payload)
            if check is not None:
                check(validated)
            return validated, response
        except (ValidationError, ValueError) as error:
            last_error = error
            if remaining == 0:
                break
            attempt_request = _repair_request(attempt_request, response, error)

    raise MalformedModelResponse(
        "contract_validation",
        finish_reason=response.finish_reason,
        usage=response.usage,
        latency_ms=response.latency_ms,
    ) from last_error


def _repair_request(
    request: ModelRequest,
    response: ModelResponse,
    error: Exception,
) -> ModelRequest:
    """Show the model its own reply and the exact contract violation."""

    reason = str(error)[:_MAX_ERROR_CHARACTERS]
    correction = (
        "Your previous reply did not satisfy the required contract.\n"
        f"Previous reply: {json.dumps(response.payload, ensure_ascii=False)}\n"
        f"Problem: {reason}\n"
        "Reply again with one corrected JSON object and no other text."
    )
    return request.model_copy(
        update={
            "messages": (
                *request.messages,
                ModelMessage(role=ModelRole.USER, content=correction),
            )
        }
    )
