"""Contract tests for the OpenAI-compatible adapter. No network is used."""

import json

import pytest

from goodidea_agent.model.adapter import (
    MalformedModelResponse,
    ModelErrorKind,
    ModelMessage,
    ModelRequest,
    ModelRole,
    ModelUnavailable,
)
from goodidea_agent.model.openai_compatible import OpenAICompatibleModelAdapter


class StubTransport:
    def __init__(self, status: int, body: object, *, raise_error: Exception | None = None) -> None:
        self._status = status
        self._body = body
        self._raise_error = raise_error
        self.calls: list[dict[str, object]] = []

    def post_json(self, url, *, headers, body, timeout_seconds):
        self.calls.append(
            {
                "url": url,
                "headers": dict(headers),
                "body": json.loads(body),
                "timeout_seconds": timeout_seconds,
            }
        )
        if self._raise_error is not None:
            raise self._raise_error
        raw = self._body if isinstance(self._body, bytes) else json.dumps(self._body).encode()
        return self._status, raw


def chat_completion(content: str, **overrides):
    payload = {
        "choices": [{"message": {"content": content}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 11, "completion_tokens": 7, "total_tokens": 18},
    }
    payload.update(overrides)
    return payload


def build_adapter(transport, **overrides):
    options = {
        "base_url": "https://example.test/v1/",
        "api_key": "test-key",
        "model": "test-model",
        "transport": transport,
    }
    options.update(overrides)
    return OpenAICompatibleModelAdapter(**options)


def a_request():
    return ModelRequest(
        purpose="idea_assessment",
        messages=(
            ModelMessage(role=ModelRole.SYSTEM, content="rules"),
            ModelMessage(role=ModelRole.USER, content="an idea"),
        ),
        max_output_tokens=256,
    )


def test_request_uses_chat_completions_and_asks_for_json():
    transport = StubTransport(200, chat_completion('{"ok": true}'))

    build_adapter(transport).complete(a_request())

    call = transport.calls[0]
    assert call["url"] == "https://example.test/v1/chat/completions"
    assert call["headers"]["Authorization"] == "Bearer test-key"
    assert call["body"]["model"] == "test-model"
    assert call["body"]["max_tokens"] == 256
    assert call["body"]["response_format"] == {"type": "json_object"}
    assert call["body"]["messages"] == [
        {"role": "system", "content": "rules"},
        {"role": "user", "content": "an idea"},
    ]


def test_provider_specific_fields_stay_in_configuration():
    transport = StubTransport(200, chat_completion('{"ok": true}'))

    build_adapter(transport, extra_body={"enable_thinking": False}).complete(a_request())

    assert transport.calls[0]["body"]["enable_thinking"] is False


def test_parsed_payload_and_usage_are_returned():
    transport = StubTransport(200, chat_completion('{"scenario": "unsupported"}'))

    response = build_adapter(transport).complete(a_request())

    assert response.payload == {"scenario": "unsupported"}
    assert response.usage.input_tokens == 11
    assert response.usage.output_tokens == 7
    assert response.usage.total_tokens == 18
    assert response.finish_reason == "stop"
    assert response.model_name == "test-model"


def test_unknown_finish_reason_is_mapped_to_a_closed_value():
    body = chat_completion('{"ok": true}')
    body["choices"][0]["finish_reason"] = "something_new"

    response = build_adapter(StubTransport(200, body)).complete(a_request())

    assert response.finish_reason == "other"


@pytest.mark.parametrize(
    ("status", "kind"),
    [
        (401, ModelErrorKind.AUTHENTICATION),
        (403, ModelErrorKind.AUTHENTICATION),
        (429, ModelErrorKind.QUOTA),
        (500, ModelErrorKind.API),
    ],
)
def test_http_failures_map_onto_the_closed_error_set(status, kind):
    adapter = build_adapter(StubTransport(status, {"error": {"message": "secret detail"}}))

    with pytest.raises(ModelUnavailable) as error:
        adapter.complete(a_request())

    assert error.value.kind is kind
    assert "secret detail" not in str(error.value)


@pytest.mark.parametrize(
    ("body", "stage"),
    [
        (b"not json", "upstream_json"),
        ({"choices": []}, "upstream_shape"),
        ({"choices": [{"message": {"content": "plain prose"}}]}, "content_json"),
        ({"choices": [{"message": {"content": "[1, 2]"}}]}, "content_json"),
    ],
)
def test_unusable_bodies_report_where_parsing_stopped(body, stage):
    adapter = build_adapter(StubTransport(200, body))

    with pytest.raises(MalformedModelResponse) as error:
        adapter.complete(a_request())

    assert error.value.stage == stage


def test_incomplete_configuration_is_rejected_before_any_call():
    with pytest.raises(ModelUnavailable) as error:
        OpenAICompatibleModelAdapter(base_url="", api_key="k", model="m")

    assert error.value.kind is ModelErrorKind.CONFIGURATION


def test_environment_configuration_uses_provider_neutral_names(monkeypatch):
    monkeypatch.setenv("GOODIDEA_MODEL_BASE_URL", "https://example.test/v1")
    monkeypatch.setenv("GOODIDEA_MODEL_API_KEY", "key")
    monkeypatch.setenv("GOODIDEA_MODEL_NAME", "some-model")
    monkeypatch.setenv("GOODIDEA_MODEL_EXTRA_BODY", '{"enable_thinking": false}')
    transport = StubTransport(200, chat_completion('{"ok": true}'))

    adapter = OpenAICompatibleModelAdapter.from_environment(transport=transport)
    adapter.complete(a_request())

    assert adapter.model_name == "some-model"
    assert transport.calls[0]["body"]["enable_thinking"] is False


def test_missing_environment_reports_configuration_not_a_crash(monkeypatch):
    for name in ("GOODIDEA_MODEL_BASE_URL", "GOODIDEA_MODEL_API_KEY", "GOODIDEA_MODEL_NAME"):
        monkeypatch.delenv(name, raising=False)

    with pytest.raises(ModelUnavailable) as error:
        OpenAICompatibleModelAdapter.from_environment()

    assert error.value.kind is ModelErrorKind.CONFIGURATION
