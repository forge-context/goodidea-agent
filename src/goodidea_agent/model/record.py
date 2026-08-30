"""Capture real model responses into replayable fixtures.

Run this while a live key is valid. The fixtures keep model-dependent tests
meaningful after the key expires, and they become the regression baseline when the
provider changes: replay the same requests and compare the new answers.

    PYTHONPATH=src python -m goodidea_agent.model.record
    PYTHONPATH=src python -m goodidea_agent.model.record --locale zh-CN --idea "..."
"""

from __future__ import annotations

import argparse
from collections.abc import Sequence
from pathlib import Path

from goodidea_agent.domain.state import Locale
from goodidea_agent.model.adapter import ModelUnavailable
from goodidea_agent.model.answer_reader import ModelAnswerReader
from goodidea_agent.model.composer import ModelCardComposer
from goodidea_agent.model.fake import RecordingModelAdapter
from goodidea_agent.model.interpreter import ModelIdeaInterpreter
from goodidea_agent.model.openai_compatible import OpenAICompatibleModelAdapter
from goodidea_agent.model.proposer import ModelProposalComposer
from goodidea_agent.scenarios.automatic_trading import build_fixed_evidence_adapter
from goodidea_agent.workflow.guidance import build_mvp_proposal
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)

DEFAULT_DIRECTORY = Path("fixtures/model")

# One in-scope idea per locale, plus out-of-scope ideas from other domains. Together
# they cover both routing outcomes the workflow can take.
DEFAULT_CASES: tuple[tuple[str, Locale], ...] = (
    ("Build me a product that trades stocks automatically and makes money for me.", "en"),
    ("株を自動で売買して、代わりに儲けてくれる製品を作ってほしい。", "ja"),
    ("帮我做一个能自动炒股、替我赚钱的产品。", "zh-CN"),
    ("An app that helps neighbours share rarely used kitchen tools.", "en"),
    ("社内の議事録を検索できるツールを作りたい。", "ja"),
    ("我想做一个帮助独立开发者管理订阅收入的工具。", "zh-CN"),
)


def record_cases(
    cases: Sequence[tuple[str, Locale]],
    *,
    directory: Path = DEFAULT_DIRECTORY,
) -> int:
    """Record one assessment per case and report how many succeeded.

    Each model writes into its own sub-directory. The fingerprint ignores the model
    name, so the same case lands on the same filename under every model and two
    models can be compared answer by answer.
    """

    live = OpenAICompatibleModelAdapter.from_environment()
    recorder = RecordingModelAdapter(live, directory / live.model_name)
    interpreter = ModelIdeaInterpreter(recorder)

    recorded = 0
    for idea, locale in cases:
        try:
            assessment = interpreter.interpret(idea, locale=locale)
        except ModelUnavailable as error:
            print(f"[skip] {locale} {idea[:40]!r}: {error}")
            continue
        recorded += 1
        print(f"[ok]   {locale} scenario={assessment.scenario} {idea[:40]!r}")

    target = directory / live.model_name
    print(f"\n{recorded}/{len(cases)} recorded into {target}/ ({len(recorder.written)} files)")
    return recorded


# The flow is recorded against curated evidence rather than live search, so a later
# replay compares model behaviour rather than whatever the web returned that day.
FLOW_ANSWERS: tuple[tuple[str, Locale, str, str], ...] = (
    (
        "Build me a product that trades stocks automatically and makes money.",
        "en",
        "yes",
        "I already trade a moving-average crossover rule by hand.",
    ),
    (
        "株を自動で売買して、代わりに儲けてくれる製品を作ってほしい。",
        "ja",
        "はい",
        "移動平均のゴールデンクロスで手動売買しているルールがあります。",
    ),
    (
        "帮我做一个能自动炒股、替我赚钱的产品。",
        "zh-CN",
        "好的",
        "我有一条均线金叉买入的规则，一直手动在做。",
    ),
)


def record_flow(*, directory: Path = DEFAULT_DIRECTORY) -> int:
    """Record every model call of a whole session, in each language.

    Recording the flow rather than one step is what makes a replay meaningful: the
    proposal a model writes depends on the card it wrote and the answer it read.
    """

    live = OpenAICompatibleModelAdapter.from_environment()
    recorder = RecordingModelAdapter(live, directory / live.model_name)
    recorded = 0

    for idea, locale, vague_answer, real_answer in FLOW_ANSWERS:
        try:
            workflow = AutomaticTradingVerticalSlice(
                build_fixed_evidence_adapter(),
                interpreter=ModelIdeaInterpreter(recorder),
                composer=ModelCardComposer(recorder),
            )
            result = workflow.run(idea, locale=locale)
            if result.status != "awaiting_user":
                print(f"[skip] {locale} research: {result.status} {result.message}")
                continue
            reader = ModelAnswerReader(recorder)
            # A vague answer is recorded too: how the model reads it is a rule the
            # evaluation checks, not an accident of the session.
            apply_strategy_source_answer(result, vague_answer, reader=reader)
            decided = apply_strategy_source_answer(result, real_answer, reader=reader)
            if decided.status != "decision_recorded":
                print(f"[skip] {locale} answer: {decided.message}")
                continue
            proposed = build_mvp_proposal(decided, composer=ModelProposalComposer(recorder))
            print(f"[ok]   {locale} {proposed.proposal.title}")
            recorded += 1
        except ModelUnavailable as error:
            print(f"[skip] {locale}: {error}")

    target = directory / live.model_name
    print(f"\n{recorded}/{len(FLOW_ANSWERS)} flows into {target}/ ({len(recorder.written)} files)")
    return recorded


def main() -> None:
    parser = argparse.ArgumentParser(description="Record live model responses as fixtures.")
    parser.add_argument("--idea", help="Record a single idea instead of the default set.")
    parser.add_argument("--locale", default="en", choices=("en", "ja", "zh-CN"))
    parser.add_argument("--directory", default=str(DEFAULT_DIRECTORY))
    parser.add_argument(
        "--flow",
        action="store_true",
        help="Record a whole session per language instead of the assessment only.",
    )
    arguments = parser.parse_args()

    if arguments.flow:
        record_flow(directory=Path(arguments.directory))
        return

    cases: tuple[tuple[str, Locale], ...] = (
        ((arguments.idea, arguments.locale),) if arguments.idea else DEFAULT_CASES
    )
    record_cases(cases, directory=Path(arguments.directory))


if __name__ == "__main__":
    main()
