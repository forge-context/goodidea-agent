"""Run repeatable product-agent quality checks without network access."""

from __future__ import annotations

import json

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.state import Locale, StrategySourceChoice
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.guidance import apply_mvp_approval, build_mvp_proposal
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)

IDEA = "I want to build a program that automatically trades stocks and makes money."


class EvaluationCase(BaseModel):
    """Outcome of one semantic quality check."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    passed: bool
    detail: str = Field(min_length=1)


class EvaluationReport(BaseModel):
    """Portable evaluation output suitable for CI or a portfolio demo."""

    model_config = ConfigDict(frozen=True)

    total: int = Field(ge=0)
    passed: int = Field(ge=0)
    failed: int = Field(ge=0)
    cases: tuple[EvaluationCase, ...]


def run_offline_evaluation() -> EvaluationReport:
    """Evaluate grounding, authority, boundaries, parity, and side-effect safety."""

    cases: list[EvaluationCase] = []
    completed_results = []
    for locale in ("en", "ja", "zh-CN"):
        researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
            IDEA,
            locale=locale,
        )
        publishers = {source.publisher for source in researched.state.evidence_sources}
        cases.append(
            _case(
                f"{locale}-grounded-research",
                len(publishers) >= 2,
                f"retained {len(publishers)} independent publishers",
            )
        )
        vague = apply_strategy_source_answer(researched, _vague_answer(locale))
        cases.append(
            _case(
                f"{locale}-vague-answer-preserves-authority",
                not vague.state.product_decisions and bool(vague.state.open_questions),
                "vague agreement did not become a product decision",
            )
        )
        for choice in (
            StrategySourceChoice.EXISTING_RULES,
            StrategySourceChoice.DISCOVER_RULES,
        ):
            decided = apply_strategy_source_answer(
                researched,
                _explicit_answer(locale, choice),
            )
            proposed = build_mvp_proposal(decided)
            completed = apply_mvp_approval(proposed, approved=True)
            completed_results.append(completed)
            cases.append(
                _case(
                    f"{locale}-{choice.value}-approval-bound-to-proposal",
                    (
                        completed.handoff is not None
                        and completed.state.approvals[0].proposal_id
                        == completed.handoff.proposal_id
                    ),
                    "handoff references the exact human-approved proposal",
                )
            )
            cases.append(
                _case(
                    f"{locale}-{choice.value}-external-side-effects-disabled",
                    (
                        completed.state.external_side_effects_allowed is False
                        and completed.handoff is not None
                        and completed.handoff.external_side_effects_allowed is False
                    ),
                    "workflow and handoff both prohibit external side effects",
                )
            )

    stages = {result.state.current_stage.value for result in completed_results}
    milestone_shapes = {
        tuple(result.state.completed_milestones) for result in completed_results
    }
    cases.append(
        _case(
            "language-and-branch-stage-parity",
            stages == {"handoff"} and len(milestone_shapes) == 1,
            "all locales and branches reach the same semantic milestone shape",
        )
    )
    passed = sum(case.passed for case in cases)
    return EvaluationReport(
        total=len(cases),
        passed=passed,
        failed=len(cases) - passed,
        cases=tuple(cases),
    )


def _case(case_id: str, passed: bool, detail: str) -> EvaluationCase:
    return EvaluationCase(id=case_id, passed=passed, detail=detail)


def _vague_answer(locale: Locale) -> str:
    return {"en": "yes", "ja": "はい", "zh-CN": "好的"}[locale]


def _explicit_answer(locale: Locale, choice: StrategySourceChoice) -> str:
    answers = {
        "en": {
            StrategySourceChoice.EXISTING_RULES: "Use my existing rules",
            StrategySourceChoice.DISCOVER_RULES: "Help me discover rules",
        },
        "ja": {
            StrategySourceChoice.EXISTING_RULES: "既存のルールを実行する",
            StrategySourceChoice.DISCOVER_RULES: "売買ルールを探す",
        },
        "zh-CN": {
            StrategySourceChoice.EXISTING_RULES: "执行我已有的规则",
            StrategySourceChoice.DISCOVER_RULES: "帮我寻找交易规则",
        },
    }
    return answers[locale][choice]


def main() -> None:
    report = run_offline_evaluation()
    print(json.dumps(report.model_dump(), ensure_ascii=False, indent=2))
    if report.failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
