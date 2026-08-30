"""Structured output is validated locally, so a provider swap cannot weaken it."""

import json

import pytest
from pydantic import BaseModel, Field

from goodidea_agent.model.adapter import (
    MalformedModelResponse,
    ModelErrorKind,
    ModelMessage,
    ModelRequest,
    ModelRole,
    ModelUnavailable,
)
from goodidea_agent.model.fake import (
    FakeModelAdapter,
    RecordedModelAdapter,
    RecordingModelAdapter,
    request_fingerprint,
)
from goodidea_agent.model.structured import complete_structured, schema_instruction


class Answer(BaseModel):
    verdict: str = Field(min_length=1)
    confidence: int = Field(ge=0, le=100)


def a_request(purpose="test"):
    return ModelRequest(
        purpose=purpose,
        messages=(ModelMessage(role=ModelRole.USER, content="question"),),
    )


def test_valid_reply_is_returned_as_a_typed_object():
    adapter = FakeModelAdapter([{"verdict": "possible", "confidence": 40}])

    answer, response = complete_structured(adapter, a_request(), Answer)

    assert answer.verdict == "possible"
    assert response.model_name == "fake"
    assert len(adapter.requests) == 1


def test_an_invalid_reply_is_repaired_once():
    adapter = FakeModelAdapter(
        [{"verdict": "possible", "confidence": 400}, {"verdict": "possible", "confidence": 40}]
    )

    answer, _ = complete_structured(adapter, a_request(), Answer)

    assert answer.confidence == 40
    assert len(adapter.requests) == 2
    repair = adapter.requests[1].messages[-1].content
    assert "did not satisfy" in repair
    assert "confidence" in repair


def test_a_reply_that_stays_invalid_fails_at_the_contract():
    adapter = FakeModelAdapter([{"verdict": ""}, {"verdict": ""}])

    with pytest.raises(MalformedModelResponse) as error:
        complete_structured(adapter, a_request(), Answer)

    assert error.value.stage == "contract_validation"


def test_repair_can_be_disabled():
    adapter = FakeModelAdapter([{"verdict": "possible", "confidence": 400}])

    with pytest.raises(MalformedModelResponse):
        complete_structured(adapter, a_request(), Answer, repair_attempts=0)

    assert len(adapter.requests) == 1


def test_schema_instruction_names_every_required_field():
    instruction = schema_instruction(Answer)

    assert "verdict" in instruction
    assert "confidence" in instruction


def test_fixtures_replay_by_request_not_by_provider(tmp_path):
    live = FakeModelAdapter([{"verdict": "ok", "confidence": 1}])
    recorded = RecordingModelAdapter(live, tmp_path)
    recorded.complete(a_request())

    replayed = RecordedModelAdapter(tmp_path).complete(a_request())

    assert replayed.payload == {"verdict": "ok", "confidence": 1}
    stored = json.loads(recorded.written[0].read_text(encoding="utf-8"))
    assert stored["fingerprint"] == request_fingerprint(a_request())
    assert stored["request"]["purpose"] == "test"


def test_a_request_without_a_fixture_is_reported_not_invented(tmp_path):
    with pytest.raises(ModelUnavailable) as error:
        RecordedModelAdapter(tmp_path).complete(a_request())

    assert error.value.kind is ModelErrorKind.CONFIGURATION


def test_a_changed_prompt_produces_a_different_fixture():
    assert request_fingerprint(a_request("one")) != request_fingerprint(a_request("two"))
