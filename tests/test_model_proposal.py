"""The model writes the boundary. It still cannot approve it or widen it silently."""

import pytest

from goodidea_agent.domain.state import StrategySourceChoice
from goodidea_agent.model.adapter import ModelErrorKind, ModelUnavailable
from goodidea_agent.model.fake import FakeModelAdapter
from goodidea_agent.model.proposer import ModelProposalComposer
from goodidea_agent.scenarios.automatic_trading import build_demo_search_adapter
from goodidea_agent.workflow.guidance import (
    GuidanceTransitionError,
    apply_mvp_approval,
    build_mvp_proposal,
)
from goodidea_agent.workflow.vertical_slice import (
    AutomaticTradingVerticalSlice,
    apply_strategy_source_answer,
)


def proposal(**overrides) -> dict:
    payload = {
        "feasibility_summary": "可以先做一个只用固定数据的本地规则执行器。",
        "constraints": ["只使用模拟资金", "交易规则由用户提供"],
        "validation_steps": ["写出一条明确规则", "在固定样本上回放"],
        "success_signals": ["相同输入产生相同判断", "无法创建真实订单"],
        "title": "模拟规则执行器",
        "promise": "验证一条明确规则能否被可靠执行。",
        "target_user": "已经有一条规则想验证的个人用户。",
        "included": ["一条结构化规则", "判断日志"],
        "excluded": ["收益保证", "真实券商连接"],
        "user_flow": ["定义规则", "运行并查看判断"],
        "acceptance_criteria": ["同一份数据重复运行结果一致", "系统无法创建真实订单"],
        "assumptions": ["单用户本地原型", "验证产品行为而不是收益"],
        "implementation_order": ["领域模型和固定数据", "判断日志"],
        "approval_prompt": "这个边界和你想先验证的一致吗？",
        "approval_why": "批准会冻结这一版可以做和不做的内容。",
    }
    payload.update(overrides)
    return payload


IDEA = "I want to build a program that automatically trades stocks and makes money."


def decided_session():
    researched = AutomaticTradingVerticalSlice(build_demo_search_adapter()).run(
        IDEA,
        locale="zh-CN",
    )
    return apply_strategy_source_answer(researched, "使用我已有的规则")


def test_the_proposal_is_written_for_this_session():
    adapter = FakeModelAdapter([proposal()])

    result = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    assert result.status == "proposal_ready"
    assert result.proposal.title == "模拟规则执行器"
    assert result.question.prompt == "这个边界和你想先验证的一致吗？"
    assert result.feasibility.id is StrategySourceChoice.EXISTING_RULES


def test_the_decision_the_user_made_is_given_to_the_model():
    adapter = FakeModelAdapter([proposal()])

    build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    prompt = adapter.requests[0].messages[1].content
    assert "existing_rules" in prompt
    assert "decision_the_user_made" in prompt


def test_a_line_on_both_sides_is_not_a_boundary():
    broken = proposal(included=["收益保证", "判断日志"], excluded=["收益保证", "真实券商连接"])
    adapter = FakeModelAdapter([broken, proposal()])

    result = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    assert result.status == "proposal_ready"
    repair = adapter.requests[-1].messages[-1].content
    assert "收益保证" in repair


def test_an_unusable_proposal_falls_back_instead_of_showing_half_of_one():
    broken = proposal(included=["收益保证"], excluded=["收益保证"])
    adapter = FakeModelAdapter([broken, broken])

    result = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    assert result.status == "proposal_ready"
    assert result.proposal.title == "模拟规则执行器"
    assert result.proposal.implementation_order == ()


def test_a_model_failure_still_produces_the_fixed_proposal():
    failure = ModelUnavailable(ModelErrorKind.QUOTA, "model quota exhausted")
    adapter = FakeModelAdapter([failure])

    result = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    assert result.status == "proposal_ready"
    assert result.proposal.implementation_order == ()


def test_the_handoff_uses_the_build_order_the_model_wrote():
    adapter = FakeModelAdapter([proposal()])
    proposed = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    completed = apply_mvp_approval(proposed, approved=True)

    assert completed.handoff.implementation_order == ("领域模型和固定数据", "判断日志")
    assert completed.handoff.goal == "验证一条明确规则能否被可靠执行。"


def test_generating_a_proposal_does_not_approve_it():
    adapter = FakeModelAdapter([proposal()])
    proposed = build_mvp_proposal(decided_session(), composer=ModelProposalComposer(adapter))

    assert proposed.handoff is None
    assert proposed.state.approvals == ()
    with pytest.raises(GuidanceTransitionError):
        apply_mvp_approval(proposed, approved=False)
