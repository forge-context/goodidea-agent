"""Deterministic feasibility, MVP proposal, and approval transitions."""

from __future__ import annotations

from goodidea_agent.domain.guidance import (
    CodingHandoff,
    ComposedProposal,
    FeasibilityPath,
    MvpProposal,
)
from goodidea_agent.domain.research import ExplainedQuestion, VerticalSliceResult
from goodidea_agent.domain.state import (
    AgentState,
    ApprovalRecord,
    OpenQuestion,
    ProductDecision,
    Stage,
    StrategySourceChoice,
)
from goodidea_agent.memory.working import RecalledNote
from goodidea_agent.model.adapter import ModelUnavailable
from goodidea_agent.model.proposer import ProposalComposer


class GuidanceTransitionError(ValueError):
    """Raised when a workflow transition is requested from the wrong checkpoint."""


_TEXT = {
    "en": {
        "approval_prompt": "Does this MVP boundary match what you want to validate first?",
        "approval_why": (
            "Approval freezes what the coding agent may build and what must remain excluded."
        ),
        "revision": "The proposal remains unapproved. Your feedback is saved in this checkpoint.",
        "approved": "The MVP boundary is approved and the coding handoff is ready.",
        "existing": {
            "summary": (
                "A local paper-trading runner for one user-supplied rule is technically "
                "testable without connecting real money."
            ),
            "constraints": (
                "Use simulated funds only.",
                "The user supplies the trading rule; the system does not invent one.",
                "Use fixed sample or paper-market data.",
                "Do not connect a live brokerage account.",
            ),
            "steps": (
                "Express one trading rule as explicit entry, exit, and sizing conditions.",
                "Replay the rule against a fixed sample and show every decision.",
                "Send resulting orders only to a paper adapter.",
                "Record outcomes, errors, and skipped actions.",
            ),
            "signals": (
                "The same input produces the same decision log.",
                "No live order can be created.",
                "The user can inspect why every paper order was or was not produced.",
            ),
            "title": "Paper Rule Runner",
            "promise": "Test whether one explicit trading rule can be executed reliably.",
            "target": "An individual who already has a trading rule to test.",
            "included": (
                "One structured trading rule",
                "Fixed sample data and a paper-order adapter",
                "Decision and execution logs",
                "A compact run summary",
            ),
            "excluded": (
                "Strategy discovery or investment recommendations",
                "Live brokerage credentials and real-money orders",
                "Profit guarantees, portfolio optimization, and social features",
            ),
            "flow": (
                "Define one rule",
                "Run it on fixed or paper data",
                "Inspect decisions and simulated orders",
                "Review the run summary",
            ),
            "acceptance": (
                "A rule can be saved and replayed deterministically.",
                "Every simulated order links back to a rule decision.",
                "Live-trading configuration is absent.",
                "Failures are visible instead of silently retried.",
            ),
        },
        "discover": {
            "summary": (
                "A local experiment notebook can compare user-selected candidate rules on "
                "historical samples, but it must not recommend a strategy or imply future returns."
            ),
            "constraints": (
                "Use historical or fixed sample data only.",
                "Compare declared candidate rules; do not generate financial advice.",
                "Show assumptions and limitations beside every result.",
                "Do not connect a brokerage account or place orders.",
            ),
            "steps": (
                "Choose two transparent candidate rules from a fixed catalogue.",
                "Run both against the same historical sample and cost assumptions.",
                "Compare drawdown, turnover, and consistency without ranking a winner.",
                "Ask the user which uncertainty to investigate next.",
            ),
            "signals": (
                "Both rules are evaluated under identical declared assumptions.",
                "Results can be reproduced from the same sample.",
                "The product never labels a rule profitable or suitable for the user.",
            ),
            "title": "Strategy Experiment Notebook",
            "promise": "Compare transparent rule hypotheses without presenting financial advice.",
            "target": "An individual exploring how rule-based trading experiments work.",
            "included": (
                "A small fixed catalogue of transparent candidate rules",
                "One historical sample and explicit cost assumptions",
                "Side-by-side experiment results",
                "Limitations and reproducibility details",
            ),
            "excluded": (
                "Personalized strategy recommendations",
                "Automatic strategy generation or optimization",
                "Broker connections, live orders, and profit claims",
            ),
            "flow": (
                "Select two candidate rules",
                "Review shared assumptions",
                "Run a historical comparison",
                "Inspect results and limitations",
            ),
            "acceptance": (
                "The same sample and assumptions reproduce the same comparison.",
                "Rules and cost assumptions are visible before a run.",
                "No rule is presented as a recommendation or guaranteed winner.",
                "Broker and live-order capabilities are absent.",
            ),
        },
        "assumptions": (
            "Single-user local prototype",
            "No authentication, billing, or public user data",
            "The MVP validates product behavior, not financial performance",
        ),
        "implementation": (
            "Define the domain models and fixed fixtures.",
            "Implement the deterministic evaluation service.",
            "Add the local interface and explicit safety boundary.",
            "Add acceptance tests before any optional external adapter.",
        ),
    },
    "ja": {
        "approval_prompt": "この MVP 境界は、最初に検証したい内容と一致していますか？",
        "approval_why": "承認すると、Coding Agent が作ってよいものと除外するものが固定されます。",
        "revision": "提案は未承認のままです。フィードバックはこの Checkpoint に保存されました。",
        "approved": "MVP 境界が承認され、Coding Agent への引き渡しが準備できました。",
        "existing": {
            "summary": "利用者が持つ一つのルールを、実資金を接続せずローカルのペーパートレードで検証できます。",
            "constraints": (
                "シミュレーション資金だけを使う。",
                "売買ルールは利用者が用意し、システムは作らない。",
                "固定サンプルまたはペーパーマーケットデータを使う。",
                "実口座へ接続しない。",
            ),
            "steps": (
                "エントリー、決済、数量条件を一つの明示的なルールにする。",
                "固定サンプルで再生し、全判断を表示する。",
                "注文は Paper Adapter だけへ送る。",
                "結果、エラー、実行しなかった理由を記録する。",
            ),
            "signals": (
                "同じ入力から同じ判断ログが得られる。",
                "実注文を作成できない。",
                "各 Paper Order の発生理由を確認できる。",
            ),
            "title": "Paper Rule Runner",
            "promise": "一つの明示的な売買ルールを正しく実行できるか検証する。",
            "target": "検証したい売買ルールを既に持つ個人。",
            "included": (
                "一つの構造化された売買ルール",
                "固定サンプルデータと Paper Order Adapter",
                "判断ログと実行ログ",
                "簡潔な実行 Summary",
            ),
            "excluded": (
                "戦略探索や投資推奨",
                "実口座の認証情報と実資金注文",
                "収益保証、Portfolio 最適化、Social 機能",
            ),
            "flow": (
                "一つのルールを定義する",
                "固定または Paper Data で実行する",
                "判断と模擬注文を確認する",
                "実行 Summary を読む",
            ),
            "acceptance": (
                "ルールを保存し、決定的に再生できる。",
                "各模擬注文がルール判断へ戻れる。",
                "実取引設定が存在しない。",
                "失敗を黙って再試行せず表示する。",
            ),
        },
        "discover": {
            "summary": "利用者が選んだ候補ルールを過去サンプルで比較できますが、戦略推奨や将来収益の示唆は行いません。",
            "constraints": (
                "過去または固定サンプルデータだけを使う。",
                "宣言済み候補を比較し、投資助言を生成しない。",
                "各結果の横に前提と限界を表示する。",
                "証券口座へ接続せず注文もしない。",
            ),
            "steps": (
                "固定 Catalogue から透明な候補ルールを二つ選ぶ。",
                "同じ過去サンプルとコスト前提で両方を実行する。",
                "勝者を決めず Drawdown、売買回数、一貫性を比較する。",
                "次に調べる不確実性を利用者に選んでもらう。",
            ),
            "signals": (
                "同じ明示的前提で二つのルールを評価する。",
                "同じ Sample から結果を再現できる。",
                "収益性や利用者への適合を断定しない。",
            ),
            "title": "Strategy Experiment Notebook",
            "promise": "投資助言をせず、透明なルール仮説を比較する。",
            "target": "ルールベース取引の実験方法を調べたい個人。",
            "included": (
                "透明な候補ルールの小さな固定 Catalogue",
                "一つの過去 Sample と明示的なコスト前提",
                "並べて確認できる実験結果",
                "限界と再現方法",
            ),
            "excluded": (
                "個人向け戦略推奨",
                "戦略の自動生成や最適化",
                "Broker 接続、実注文、収益表現",
            ),
            "flow": (
                "候補ルールを二つ選ぶ",
                "共通前提を確認する",
                "過去データ比較を実行する",
                "結果と限界を読む",
            ),
            "acceptance": (
                "同じ Sample と前提から同じ比較を再現できる。",
                "実行前にルールとコスト前提が見える。",
                "推奨や勝者保証として表示しない。",
                "Broker と実注文機能が存在しない。",
            ),
        },
        "assumptions": (
            "一人用の Local Prototype",
            "認証、課金、公開利用者データは扱わない",
            "金融成績ではなく Product Behavior を検証する",
        ),
        "implementation": (
            "Domain Model と固定 Fixture を定義する。",
            "決定的な評価 Service を実装する。",
            "Local UI と明示的な安全境界を追加する。",
            "外部 Adapter より先に Acceptance Test を追加する。",
        ),
    },
    "zh-CN": {
        "approval_prompt": "这个 MVP 边界符合你最先想验证的内容吗？",
        "approval_why": "批准后，Coding Agent 可以做什么、必须排除什么就会被固定下来。",
        "revision": "这份提案仍未批准，你的反馈已经保存在当前 Checkpoint 中。",
        "approved": "MVP 边界已经批准，可以交给 Coding Agent 了。",
        "existing": {
            "summary": "可以把用户提供的一条规则做成本地模拟交易执行器，不接入真钱也能验证。",
            "constraints": (
                "只使用模拟资金。",
                "交易规则由用户提供，系统不替用户发明规则。",
                "使用固定样本或模拟市场数据。",
                "不连接真实券商账户。",
            ),
            "steps": (
                "把一条交易规则写成明确的买入、卖出和仓位条件。",
                "使用固定样本回放，并显示每一次判断。",
                "产生的订单只发送给模拟 Adapter。",
                "记录结果、错误和跳过操作的原因。",
            ),
            "signals": (
                "相同输入会产生相同的判断日志。",
                "系统无法创建真实订单。",
                "用户能检查每一笔模拟订单为什么产生或没有产生。",
            ),
            "title": "模拟规则执行器",
            "promise": "验证一条明确的交易规则能否被可靠执行。",
            "target": "已经有一条交易规则想要验证的个人用户。",
            "included": (
                "一条结构化交易规则",
                "固定样本数据和模拟订单 Adapter",
                "判断日志和执行日志",
                "简洁的运行总结",
            ),
            "excluded": (
                "策略发现或投资建议",
                "真实券商凭证和真钱订单",
                "收益保证、投资组合优化和社交功能",
            ),
            "flow": (
                "定义一条规则",
                "使用固定数据或模拟数据运行",
                "检查判断与模拟订单",
                "查看运行总结",
            ),
            "acceptance": (
                "规则可以保存并以确定方式重复运行。",
                "每一笔模拟订单都能追溯到规则判断。",
                "不存在真实交易配置。",
                "失败会被显示，而不是静默重试。",
            ),
        },
        "discover": {
            "summary": "可以用本地实验笔记比较用户选择的候选规则，但不能推荐策略或暗示未来收益。",
            "constraints": (
                "只使用历史数据或固定样本。",
                "比较声明过的候选规则，不生成投资建议。",
                "每个结果旁边都显示假设和局限。",
                "不连接券商账户，也不产生订单。",
            ),
            "steps": (
                "从固定目录中选择两条透明的候选规则。",
                "使用相同历史样本和成本假设运行两条规则。",
                "比较回撤、换手和一致性，但不替用户选出赢家。",
                "让用户决定下一步要调查哪项不确定性。",
            ),
            "signals": (
                "两条规则在相同且明确的假设下接受评估。",
                "使用相同样本可以复现结果。",
                "产品不会把任何规则称为盈利策略或适合用户。",
            ),
            "title": "策略实验笔记",
            "promise": "比较透明的规则假设，但不提供投资建议。",
            "target": "想了解规则交易实验方式的个人用户。",
            "included": (
                "少量固定且透明的候选规则",
                "一份历史样本和明确的成本假设",
                "并排展示的实验结果",
                "局限说明和复现信息",
            ),
            "excluded": (
                "个性化策略推荐",
                "自动生成或优化策略",
                "券商连接、真实订单和收益宣传",
            ),
            "flow": (
                "选择两条候选规则",
                "确认共同假设",
                "运行历史数据比较",
                "查看结果和局限",
            ),
            "acceptance": (
                "相同样本和假设可以复现相同结果。",
                "运行前可以看到规则和成本假设。",
                "不会把规则显示成推荐或保证获胜的方案。",
                "不存在券商和真实下单能力。",
            ),
        },
        "assumptions": (
            "单用户本地原型",
            "不包含登录、付费和公开用户数据",
            "MVP 验证产品行为，而不是金融收益",
        ),
        "implementation": (
            "定义领域模型和固定 Fixture。",
            "实现确定性的评估 Service。",
            "加入本地界面和明确的安全边界。",
            "在任何外部 Adapter 前先加入验收测试。",
        ),
    },
}


def build_mvp_proposal(
    result: VerticalSliceResult,
    *,
    composer: ProposalComposer | None = None,
    notes: tuple[RecalledNote, ...] = (),
) -> VerticalSliceResult:
    """Create a reviewable proposal from the explicit strategy-source decision.

    Without a composer the fixed per-locale proposal is used, which is what the offline
    slice needs. With one, the boundary is written for this session's own evidence and
    decision. Either way the proposal is only a proposal until the user approves it.
    """

    if result.proposal is not None:
        return result
    decision = next(
        (
            decision
            for decision in result.state.product_decisions
            if decision.id == "strategy_source"
        ),
        None,
    )
    if decision is None:
        raise GuidanceTransitionError("strategy-source decision is required")

    locale_text = _TEXT[result.state.locale]
    composed = _compose(result, composer, notes)
    if composed is None:
        path_text = locale_text[
            "existing"
            if decision.choice is StrategySourceChoice.EXISTING_RULES
            else "discover"
        ]
        feasibility = FeasibilityPath(
            id=decision.choice,
            summary=path_text["summary"],
            constraints=path_text["constraints"],
            validation_steps=path_text["steps"],
            success_signals=path_text["signals"],
        )
        proposal = MvpProposal(
            id=f"automatic-trading-{decision.choice.value}-mvp-v1",
            title=path_text["title"],
            promise=path_text["promise"],
            target_user=path_text["target"],
            included=path_text["included"],
            excluded=path_text["excluded"],
            user_flow=path_text["flow"],
            acceptance_criteria=path_text["acceptance"],
            assumptions=locale_text["assumptions"],
        )
        approval_question = ExplainedQuestion(
            id="mvp_boundary_approval",
            prompt=locale_text["approval_prompt"],
            why_it_matters=locale_text["approval_why"],
        )
    else:
        feasibility, proposal, approval_question = _artifacts_from(composed, decision)
    state_data = result.state.model_dump()
    state_data.update(
        {
            "current_stage": Stage.MVP_BOUNDARY,
            "completed_milestones": tuple(
                dict.fromkeys(
                    (
                        *result.state.completed_milestones,
                        "feasibility_path_defined",
                        "product_shape_defined",
                        "mvp_boundary_proposed",
                    )
                )
            ),
            "open_questions": (
                OpenQuestion(
                    id=approval_question.id,
                    prompt=approval_question.prompt,
                    why_it_matters=approval_question.why_it_matters,
                ),
            ),
            "next_milestone": "approve_mvp_boundary",
        }
    )
    result_data = result.model_dump()
    result_data.update(
        {
            "status": "proposal_ready",
            "state": AgentState.model_validate(state_data),
            "question": approval_question,
            "feasibility": feasibility,
            "proposal": proposal,
            "message": None,
        }
    )
    return VerticalSliceResult.model_validate(result_data)


def apply_mvp_approval(
    result: VerticalSliceResult,
    *,
    approved: bool,
    feedback: str | None = None,
) -> VerticalSliceResult:
    """Create a handoff only when the user approves the exact visible proposal."""

    if result.proposal is None or result.feasibility is None:
        raise GuidanceTransitionError("MVP proposal is required")
    question = next(
        (
            question
            for question in result.state.open_questions
            if question.id == "mvp_boundary_approval"
        ),
        None,
    )
    if question is None:
        raise GuidanceTransitionError("session has no open MVP approval")

    locale_text = _TEXT[result.state.locale]
    if not approved:
        if feedback is None or not feedback.strip():
            raise GuidanceTransitionError("feedback is required when requesting revision")
        result_data = result.model_dump()
        result_data.update(
            {
                "status": "revision_requested",
                "message": f'{locale_text["revision"]} {feedback.strip()}',
            }
        )
        return VerticalSliceResult.model_validate(result_data)

    handoff = CodingHandoff(
        proposal_id=result.proposal.id,
        goal=result.proposal.promise,
        implementation_order=(
            result.proposal.implementation_order or locale_text["implementation"]
        ),
        acceptance_criteria=result.proposal.acceptance_criteria,
        constraints=(*result.feasibility.constraints, *result.proposal.excluded),
        evidence_source_ids=tuple(source.id for source in result.state.evidence_sources),
    )
    state_data = result.state.model_dump()
    state_data.update(
        {
            "current_stage": Stage.HANDOFF,
            "completed_milestones": tuple(
                dict.fromkeys(
                    (
                        *result.state.completed_milestones,
                        "mvp_boundary_approved",
                        "coding_handoff_ready",
                    )
                )
            ),
            "open_questions": (),
            "approvals": (
                *result.state.approvals,
                ApprovalRecord(proposal_id=result.proposal.id),
            ),
            "next_milestone": None,
        }
    )
    result_data = result.model_dump()
    result_data.update(
        {
            "status": "handoff_ready",
            "state": AgentState.model_validate(state_data),
            "question": None,
            "handoff": handoff,
            "message": locale_text["approved"],
        }
    )
    return VerticalSliceResult.model_validate(result_data)


def _compose(
    result: VerticalSliceResult,
    composer: ProposalComposer | None,
    notes: tuple[RecalledNote, ...],
) -> ComposedProposal | None:
    """Fall back to the fixed proposal rather than showing a half-written one."""

    if composer is None:
        return None
    try:
        return composer.compose(result, notes=notes)
    except ModelUnavailable:
        return None


def _artifacts_from(
    composed: ComposedProposal,
    decision: ProductDecision,
) -> tuple[FeasibilityPath, MvpProposal, ExplainedQuestion]:
    feasibility = FeasibilityPath(
        id=decision.choice,
        summary=composed.feasibility_summary,
        constraints=composed.constraints,
        validation_steps=composed.validation_steps,
        success_signals=composed.success_signals,
    )
    proposal = MvpProposal(
        id=f"automatic-trading-{decision.choice.value}-mvp-v1",
        title=composed.title,
        promise=composed.promise,
        target_user=composed.target_user,
        included=composed.included,
        excluded=composed.excluded,
        user_flow=composed.user_flow,
        acceptance_criteria=composed.acceptance_criteria,
        assumptions=composed.assumptions,
        implementation_order=composed.implementation_order,
    )
    question = ExplainedQuestion(
        id="mvp_boundary_approval",
        prompt=composed.approval_prompt,
        why_it_matters=composed.approval_why,
    )
    return feasibility, proposal, question
