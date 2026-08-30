"""The model-output suite must fail loudly rather than pass on nothing."""

import json

import pytest

from goodidea_agent.evaluation.model_output import (
    _promise_words_in,
    _question_count,
    recorded_models,
    run_model_output_evaluation,
)


def test_no_recording_reports_nothing_rather_than_success(tmp_path):
    report = run_model_output_evaluation(root=tmp_path)

    assert report.total == 0
    assert recorded_models(tmp_path) == ()


def test_a_stale_recording_is_a_failure_not_a_pass(tmp_path):
    stale = tmp_path / "some-model"
    stale.mkdir()
    (stale / f"{'0' * 32}.json").write_text(
        json.dumps({"response": {"payload": {}}}), encoding="utf-8"
    )

    report = run_model_output_evaluation(root=tmp_path)

    assert report.failed == report.total > 0
    assert all("re-record" in case.detail for case in report.cases)
    assert {case.id for case in report.cases} == {
        "en-recorded-output-matches-current-prompts",
        "ja-recorded-output-matches-current-prompts",
        "zh-CN-recorded-output-matches-current-prompts",
    }


def test_the_recorded_suite_passes():
    """Stale fixtures are skipped here and failed by the CLI gate.

    Re-recording needs a live key, and this suite must stay runnable without one.
    `python -m goodidea_agent.evaluation.model_output` is where staleness is a failure.
    """

    report = run_model_output_evaluation()

    if report.total == 0:
        pytest.skip("no recorded model output")
    if any("re-record" in case.detail for case in report.cases):
        pytest.skip("recorded model output predates the current prompts")
    failures = [case.id for case in report.cases if not case.passed]
    assert failures == []


def test_a_promise_is_a_certainty_attached_to_an_outcome():
    assert _promise_words_in(("we guarantee returns of 20%",), "en") == ()
    assert _promise_words_in(("guaranteed returns every month",), "en") == (
        "guaranteed return",
    )


def test_a_denial_inside_a_claim_is_not_a_promise():
    assert _promise_words_in(("虽然无法保证盈利，但可以验证逻辑",), "zh-CN") == ()
    assert _promise_words_in(("high guaranteed returns do not exist",), "en") == ()
    assert _promise_words_in(("本产品保证盈利",), "zh-CN") == ("保证盈利",)


def test_a_true_statement_about_a_sandbox_is_not_a_promise():
    sandbox = ("verify the rule in a risk-free paper environment",)

    assert _promise_words_in(sandbox, "en") == ()
    assert _promise_words_in(("只用模拟资金，不承诺任何收益",), "zh-CN") == ()
    assert _promise_words_in(("这个产品稳赚不赔",), "zh-CN") == ("稳赚",)


def test_questions_are_counted_in_every_language():
    assert _question_count("你已经有一条规则了吗？") == 1
    assert _question_count("Do you have a rule? And a budget?") == 2
    assert _question_count("Tell me about your rule.") == 0
