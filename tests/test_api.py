import asyncio

import httpx
from fastapi import FastAPI

from goodidea_agent.api.app import create_app

IDEA = "I want to build a program that automatically trades stocks and makes money."


def _request(
    app: FastAPI,
    method: str,
    path: str,
    *,
    json: dict[str, object] | None = None,
) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.request(method, path, json=json)

    return asyncio.run(send())


def test_health_reports_explicit_offline_mode(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")

    response = _request(app, "GET", "/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "mode": "offline"}


def test_research_endpoint_runs_and_persists_the_vertical_slice(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")

    created = _request(
        app,
        "POST",
        "/api/v1/sessions/interview-demo/research",
        json={"idea": IDEA, "locale": "zh-CN"},
    )
    loaded = _request(app, "GET", "/api/v1/sessions/interview-demo")

    assert created.status_code == 200
    assert created.json()["version"] == 1
    assert created.json()["result"]["status"] == "awaiting_user"
    assert created.json()["result"]["state"]["current_stage"] == "feasibility"
    assert loaded.status_code == 200
    assert loaded.json() == created.json()


def test_repeating_the_same_request_is_idempotent(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    request = {"idea": IDEA, "locale": "en"}

    first = _request(app, "POST", "/api/v1/sessions/session-1/research", json=request)
    second = _request(app, "POST", "/api/v1/sessions/session-1/research", json=request)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["version"] == first.json()["version"] == 1


def test_session_identity_conflict_returns_409(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "en"},
    )

    response = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": "Build a meal-planning application", "locale": "en"},
    )

    assert response.status_code == 409
    assert "different idea or locale" in response.json()["detail"]


def test_unknown_session_returns_404(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")

    response = _request(app, "GET", "/api/v1/sessions/missing")

    assert response.status_code == 404


def test_request_schema_rejects_unknown_locale_and_extra_fields(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")

    bad_locale = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "fr"},
    )
    extra_field = _request(
        app,
        "POST",
        "/api/v1/sessions/session-2/research",
        json={"idea": IDEA, "locale": "en", "advance_to_build": True},
    )

    assert bad_locale.status_code == 422
    assert extra_field.status_code == 422


def test_answer_endpoint_requires_an_explicit_user_choice(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "zh-CN"},
    )

    vague = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "好的"},
    )
    explicit = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "执行我已有的规则"},
    )

    assert vague.status_code == 200
    assert vague.json()["version"] == 2
    assert vague.json()["result"]["status"] == "awaiting_user"
    assert vague.json()["result"]["question"]["id"] == "strategy_source"
    assert vague.json()["result"]["state"]["product_decisions"] == []

    assert explicit.status_code == 200
    assert explicit.json()["version"] == 3
    assert explicit.json()["result"]["status"] == "decision_recorded"
    assert explicit.json()["result"]["question"] is None
    assert explicit.json()["result"]["state"]["current_stage"] == "feasibility"
    decision = explicit.json()["result"]["state"]["product_decisions"][0]
    assert decision["choice"] == "existing_rules"
    assert decision["decided_by"] == "user"


def test_repeating_the_same_vague_answer_is_idempotent(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "en"},
    )

    first = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "yes"},
    )
    second = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "yes"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["version"] == first.json()["version"] == 2


def test_answer_endpoint_reports_missing_and_resolved_sessions(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    missing = _request(
        app,
        "POST",
        "/api/v1/sessions/missing/answers",
        json={"answer": "Use my existing rules"},
    )
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "en"},
    )
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "Use my existing rules"},
    )
    resolved = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "Discover rules"},
    )

    assert missing.status_code == 404
    assert resolved.status_code == 409


def test_answer_schema_rejects_empty_and_extra_fields(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")

    empty = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": ""},
    )
    extra = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "yes", "assume_choice": "existing_rules"},
    )

    assert empty.status_code == 422
    assert extra.status_code == 422


def test_api_completes_proposal_review_and_handoff(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "zh-CN"},
    )
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "执行我已有的规则"},
    )

    proposed = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/proposal",
    )
    revision = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/approval",
        json={"approved": False, "feedback": "先只支持固定样本"},
    )
    completed = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/approval",
        json={"approved": True},
    )

    assert proposed.status_code == 200
    assert proposed.json()["result"]["status"] == "proposal_ready"
    assert proposed.json()["result"]["proposal"]["title"] == "模拟规则执行器"
    assert revision.status_code == 200
    assert revision.json()["result"]["status"] == "revision_requested"
    assert revision.json()["result"]["handoff"] is None
    assert completed.status_code == 200
    assert completed.json()["result"]["status"] == "handoff_ready"
    assert completed.json()["result"]["state"]["current_stage"] == "handoff"
    assert completed.json()["result"]["handoff"]["approved_by"] == "user"


def test_proposal_and_approval_enforce_transition_order(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "en"},
    )

    early_proposal = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/proposal",
    )
    early_approval = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/approval",
        json={"approved": True},
    )
    missing_feedback = _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/approval",
        json={"approved": False},
    )

    assert early_proposal.status_code == 409
    assert early_approval.status_code == 409
    assert missing_feedback.status_code == 409


def test_sandbox_preview_is_available_only_after_a_proposal(tmp_path) -> None:
    app = create_app(tmp_path / "api.db")
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/research",
        json={"idea": IDEA, "locale": "en"},
    )
    too_early = _request(
        app,
        "GET",
        "/api/v1/sessions/session-1/sandbox-preview",
    )
    _request(
        app,
        "POST",
        "/api/v1/sessions/session-1/answers",
        json={"answer": "Use my existing rules"},
    )
    _request(app, "POST", "/api/v1/sessions/session-1/proposal")
    preview = _request(
        app,
        "GET",
        "/api/v1/sessions/session-1/sandbox-preview",
    )

    assert too_early.status_code == 409
    assert preview.status_code == 200
    assert preview.json()["scripts_allowed"] is False
    assert preview.json()["network_allowed"] is False
    assert "Paper Rule Runner" in preview.json()["html"]
