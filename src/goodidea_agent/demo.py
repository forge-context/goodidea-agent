"""Run the deterministic offline vertical slice from the command line."""

import argparse
import json

from goodidea_agent.memory.sqlite import SQLiteMemory
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.guidance import apply_mvp_approval, build_mvp_proposal
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the GoodIdea offline demo")
    parser.add_argument(
        "--idea",
        default="I want to build a program that automatically trades stocks and makes money.",
    )
    parser.add_argument("--locale", choices=("en", "ja", "zh-CN"), default="en")
    parser.add_argument("--database", help="Optional SQLite database path")
    parser.add_argument("--session", default="offline-demo", help="Stable memory session ID")
    parser.add_argument(
        "--strategy-source",
        choices=("existing_rules", "discover_rules"),
        help="Continue through proposal generation with an explicit demo choice",
    )
    parser.add_argument(
        "--approve",
        action="store_true",
        help="Approve the generated proposal and include the coding handoff",
    )
    args = parser.parse_args()

    workflow = AutomaticTradingVerticalSlice(build_demo_search_adapter())
    result = workflow.run(args.idea, locale=args.locale)
    if args.strategy_source:
        answer = (
            "Use my existing rules"
            if args.strategy_source == "existing_rules"
            else "Help me discover rules"
        )
        result = apply_strategy_source_answer(result, answer)
        result = build_mvp_proposal(result)
    if args.approve:
        if result.proposal is None:
            parser.error("--approve requires --strategy-source")
        result = apply_mvp_approval(result, approved=True)
    if not args.database:
        print(result.model_dump_json(indent=2))
        return

    with SQLiteMemory(args.database) as memory:
        checkpoint = memory.save(args.session, result)
    print(
        json.dumps(
            {
                "session_id": checkpoint.session_id,
                "checkpoint_version": checkpoint.version,
                "result": result.model_dump(mode="json"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
