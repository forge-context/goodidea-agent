"""Provider-independent model boundary.

Only this module is allowed to describe what a model call looks like. Provider
quirks (endpoint shape, thinking flags, structured-output syntax) stay inside the
individual adapters, so replacing a provider does not reach the workflow.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field


class ModelRole(str, Enum):
    """Roles portable across every provider this project may use."""

    SYSTEM = "system"
    USER = "user"


class ModelMessage(BaseModel):
    model_config = ConfigDict(frozen=True)

    role: ModelRole
    content: str = Field(min_length=1)


class ModelRequest(BaseModel):
    """One auditable model call.

    ``purpose`` names the product step that asked for the call. It is recorded with
    fixtures and never sent to the provider.
    """

    model_config = ConfigDict(frozen=True)

    purpose: str = Field(min_length=1)
    messages: tuple[ModelMessage, ...] = Field(min_length=1)
    max_output_tokens: int = Field(default=1_200, gt=0, le=32_000)
    temperature: float = Field(default=0.1, ge=0, le=2)


class ModelUsage(BaseModel):
    model_config = ConfigDict(frozen=True)

    input_tokens: int = Field(default=0, ge=0)
    output_tokens: int = Field(default=0, ge=0)
    total_tokens: int = Field(default=0, ge=0)


FinishReason = Literal["stop", "length", "content_filter", "tool_calls", "other"]

ParsingStage = Literal["upstream_json", "upstream_shape", "content_json", "contract_validation"]


class ModelResponse(BaseModel):
    """A parsed JSON object plus the facts that are safe to keep about the call."""

    model_config = ConfigDict(frozen=True)

    payload: dict[str, object]
    usage: ModelUsage = ModelUsage()
    finish_reason: FinishReason | None = None
    latency_ms: int = Field(default=0, ge=0)
    model_name: str | None = None


class ModelErrorKind(str, Enum):
    """Closed set of failure categories. Anything unexpected becomes ``API``."""

    CONFIGURATION = "configuration"
    NETWORK = "network"
    TIMEOUT = "timeout"
    AUTHENTICATION = "authentication"
    QUOTA = "quota"
    API = "api"
    MALFORMED_RESPONSE = "malformed_response"


class ModelUnavailable(RuntimeError):
    """Raised when a model result cannot be produced.

    The message carries a fixed internal label only. Upstream bodies, provider
    messages, and prompts are never attached, so an error can be logged safely.
    """

    def __init__(self, kind: ModelErrorKind, detail: str) -> None:
        super().__init__(f"{kind.value}: {detail}")
        self.kind = kind
        self.detail = detail


class MalformedModelResponse(ModelUnavailable):
    """The call succeeded but the body could not be turned into a usable object."""

    def __init__(
        self,
        stage: ParsingStage,
        *,
        finish_reason: FinishReason | None = None,
        usage: ModelUsage | None = None,
        latency_ms: int = 0,
    ) -> None:
        super().__init__(ModelErrorKind.MALFORMED_RESPONSE, stage)
        self.stage: ParsingStage = stage
        self.finish_reason = finish_reason
        self.usage = usage or ModelUsage()
        self.latency_ms = latency_ms


class ModelAdapter(Protocol):
    """Interface implemented by live providers, fixtures, and fakes."""

    def complete(self, request: ModelRequest) -> ModelResponse: ...
