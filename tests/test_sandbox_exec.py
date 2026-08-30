"""Isolation is the product of this tool. Weakening it silently is the failure mode."""

import json

import pytest

from goodidea_agent.tools.sandbox_exec import (
    ContainerSandbox,
    SandboxArtifact,
    SandboxLimits,
    SandboxUnavailable,
)


class FakeRunner:
    def __init__(self, results, *, available: bool = True, daemon: bool = True) -> None:
        self._results = list(results)
        self._available = available
        self._daemon = daemon
        self.commands: list[list[str]] = []

    def which(self, program: str) -> str | None:
        return f"/usr/bin/{program}" if self._available else None

    def run(self, command, *, timeout):
        self.commands.append(list(command))
        if list(command)[1:] == ["info"]:
            return (0, "", "") if self._daemon else (1, "", "cannot connect")
        return self._results.pop(0) if self._results else (0, "", "")


def artifact(**overrides) -> SandboxArtifact:
    payload = {
        "question": "Can this rule be replayed deterministically?",
        "code": "print('17 signals')",
        "files": {"sample.csv": "date,close\n2026-01-02,10\n"},
    }
    payload.update(overrides)
    return SandboxArtifact(**payload)


def test_nothing_runs_without_a_container_runtime():
    sandbox = ContainerSandbox(runner=FakeRunner([], available=False))

    with pytest.raises(SandboxUnavailable) as error:
        sandbox.run(artifact())

    assert "isolated" in str(error.value)


def test_an_installed_client_without_a_daemon_is_not_availability():
    sandbox = ContainerSandbox(runner=FakeRunner([], daemon=False))

    assert sandbox.available() is False
    with pytest.raises(SandboxUnavailable):
        sandbox.run(artifact())


def test_a_runtime_that_never_starts_the_program_is_not_a_failed_program():
    runner = FakeRunner([(125, "", "docker: error during connect")])

    with pytest.raises(SandboxUnavailable) as error:
        ContainerSandbox(runner=runner).run(artifact())

    assert "could not start" in str(error.value)


def test_the_daemon_is_probed_once():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])
    sandbox = ContainerSandbox(runner=runner)

    sandbox.run(artifact())

    assert sum(1 for command in runner.commands if command[1:] == ["info"]) == 1


def test_the_run_is_granted_nothing_it_was_not_given():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])

    ContainerSandbox(runner=runner).run(artifact())

    command = runner.commands[-1]
    assert "--network=none" in command
    assert "--read-only" in command
    assert "--cap-drop=ALL" in command
    assert "--security-opt=no-new-privileges" in command
    assert "--user=65534:65534" in command
    assert "--memory=256m" in command
    assert "--pids-limit=64" in command


def test_limits_reach_the_runtime():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])

    ContainerSandbox(runner=runner).run(
        artifact(limits=SandboxLimits(seconds=5, memory_mb=64, processes=16))
    )

    assert "--memory=64m" in runner.commands[-1]
    assert "--pids-limit=16" in runner.commands[-1]


def test_code_and_data_travel_as_one_argument_not_a_shell_string():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])

    ContainerSandbox(runner=runner).run(artifact())

    payload = json.loads(runner.commands[-1][-1])
    assert payload["code"] == "print('17 signals')"
    assert "sample.csv" in payload["files"]
    assert "sh" not in runner.commands[-1]


def test_two_agreeing_runs_are_reported_as_repeatable():
    runner = FakeRunner([(0, "17 signals", ""), (0, "17 signals", "")])

    outcome = ContainerSandbox(runner=runner).run(artifact())

    assert outcome.repeatable is True
    assert outcome.succeeded is True
    assert len(outcome.attempts) == 2


def test_two_runs_that_disagree_have_settled_nothing():
    runner = FakeRunner([(0, "17 signals", ""), (0, "18 signals", "")])

    outcome = ContainerSandbox(runner=runner).run(artifact())

    assert outcome.repeatable is False


def test_a_failing_run_is_not_repeatable_even_when_it_fails_the_same_way():
    runner = FakeRunner([(1, "", "boom"), (1, "", "boom")])

    outcome = ContainerSandbox(runner=runner).run(artifact())

    assert outcome.succeeded is False
    assert outcome.repeatable is False


def test_the_outcome_states_what_was_denied():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])

    outcome = ContainerSandbox(runner=runner).run(artifact())

    assert outcome.network_allowed is False
    assert outcome.filesystem_writable is False
    assert outcome.external_side_effects_allowed is False


def test_the_question_stays_attached_to_the_answer():
    runner = FakeRunner([(0, "ok", ""), (0, "ok", "")])

    outcome = ContainerSandbox(runner=runner).run(artifact())

    assert outcome.question == "Can this rule be replayed deterministically?"


def test_a_program_that_reaches_outside_is_rewritten_before_it_runs():
    from goodidea_agent.model.fake import FakeModelAdapter
    from goodidea_agent.model.sandbox_author import ModelSandboxAuthor
    from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
    from goodidea_agent.workflow.guidance import build_mvp_proposal
    from goodidea_agent.workflow.vertical_slice import (
        AutomaticTradingVerticalSlice,
        apply_strategy_source_answer,
    )

    reaching_out = {
        "question": "Can the rule be replayed?",
        "code": "import requests\nprint(requests.get('http://example.com').status_code)",
        "files": {},
        "limitation": "It cannot tell you whether the rule is profitable.",
    }
    contained = {
        "question": "Can the rule be replayed?",
        "code": "rows = open('sample.csv').read().splitlines()\nprint(len(rows), 'rows')",
        "files": {"sample.csv": "date,close\n2026-01-02,10\n"},
        "limitation": "It cannot tell you whether the rule is profitable.",
    }
    adapter = FakeModelAdapter([reaching_out, contained])
    researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        "I want a program that automatically trades stocks and makes money.",
        locale="en",
    )
    decided = apply_strategy_source_answer(researched, "Use my existing rules")
    proposed = build_mvp_proposal(decided)

    written = ModelSandboxAuthor(adapter).write(proposed)

    assert "requests" not in written.code
    assert "sample.csv" in written.files
    assert len(adapter.requests) == 2
    assert "reach the network" in adapter.requests[1].messages[-1].content


def test_the_run_says_what_it_cannot_tell_you():
    from goodidea_agent.model.fake import FakeModelAdapter
    from goodidea_agent.model.sandbox_author import ModelSandboxAuthor
    from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
    from goodidea_agent.workflow.vertical_slice import AutomaticTradingVerticalSlice

    adapter = FakeModelAdapter(
        [
            {
                "question": "Can the rule be replayed?",
                "code": "print('17 signals')",
                "files": {},
                "limitation": "It cannot tell you whether the rule makes money.",
            }
        ]
    )
    researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        "I want a program that automatically trades stocks and makes money.",
        locale="en",
    )

    written = ModelSandboxAuthor(adapter).write(researched)

    assert "makes money" in written.limitation
    assert written.as_artifact().question == "Can the rule be replayed?"
