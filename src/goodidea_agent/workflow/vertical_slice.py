"""LangGraph workflow for vertical slice 01.

The slice intentionally supports one bounded scenario without an LLM. Unknown ideas
remain unsupported instead of being silently interpreted as automatic trading.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import NamedTuple, TypedDict, cast

from langgraph.graph import END, START, StateGraph

from goodidea_agent.domain.research import (
    ComposedFact,
    ExplainedQuestion,
    IdeaAssessment,
    IdeaInterpretation,
    MarketRealityCard,
    VerticalSliceResult,
)
from goodidea_agent.domain.state import (
    AgentState,
    ConfirmedFact,
    EvidenceSource,
    Locale,
    OpenQuestion,
    ProductDecision,
    Stage,
    StrategySourceChoice,
)
from goodidea_agent.model.adapter import ModelUnavailable
from goodidea_agent.model.answer_reader import AnswerReader
from goodidea_agent.model.composer import CardComposer
from goodidea_agent.model.interpreter import IdeaInterpreter
from goodidea_agent.tools.web_search import (
    ResearchQuestion,
    SearchHit,
    SearchRequest,
    SearchUnavailable,
    WebSearchAdapter,
)
from goodidea_agent.workflow.evidence import best_hits, classify_hits, independent_publishers


class _WorkflowState(TypedDict, total=False):
    idea: str
    locale: Locale
    agent_state: AgentState
    interpretation: IdeaInterpretation
    assessment: IdeaAssessment
    requests: tuple[SearchRequest, ...]
    hits: dict[str, tuple[SearchHit, ...]]
    sources: tuple[EvidenceSource, ...]
    card: MarketRealityCard
    question: ExplainedQuestion
    status: str
    message: str
    message_override: str
    model_research: bool
    facts: tuple[ComposedFact, ...]


_SOURCE_POLICY: Mapping[str, tuple[str, str, str]] = {
    "https://docs.alpaca.markets/us/docs/paper-trading": (
        "alpaca-paper-trading",
        "Alpaca",
        "primary",
    ),
    "https://interactivebrokers.github.io/tws-api/introduction.html": (
        "ibkr-tws-api",
        "Interactive Brokers",
        "primary",
    ),
    "https://www.investor.gov/protect-your-investments/fraud/protect-your-money": (
        "investor-gov-returns",
        "Investor.gov",
        "authoritative",
    ),
}

# Each retained hit is material the writer may cite, so a query contributes its best
# few rather than everything a provider chose to return.
_HITS_PER_TOPIC = 3

_TEXT = {
    "en": {
        "encouragement": (
            "Testing rule-based trade execution on its own is a concrete, feasible start."
        ),
        "reality": (
            "Existing brokers provide APIs and paper-trading environments, so the "
            "execution layer does not need to start from zero."
        ),
        "boundary": (
            "Automated execution is not automated profit; results depend on an undefined "
            "trading rule and cannot be guaranteed."
        ),
        "validation": (
            "Choose one explicit rule and run it with simulated money while recording results."
        ),
        "question": (
            "Do you want the system to execute trading rules you already have, or discover "
            "trading rules for you?"
        ),
        "why": (
            "The answer determines whether the product is an execution tool or a "
            "strategy-discovery product."
        ),
        "unsupported": "This offline slice currently supports only automatic-trading ideas.",
        "failed": "Current market evidence could not be collected.",
    },
    "ja": {
        "encouragement": "ルールに基づく自動発注だけを切り出して試すことは、具体的で実行可能な出発点です。",
        "reality": "既存の証券会社には API とペーパートレード環境があり、実行部分をゼロから作る必要はありません。",
        "boundary": "自動執行は自動収益を意味しません。結果は未定の売買ルールに依存し、保証できません。",
        "validation": "明確なルールを一つ選び、シミュレーション資金だけで動かして結果を記録します。",
        "question": "既に持っている売買ルールを実行するシステムと、売買ルールを探すシステムのどちらを望みますか？",
        "why": "この答えによって、製品が実行ツールなのか戦略探索製品なのかが決まります。",
        "unsupported": "このオフライン版は現在、自動売買のアイデアだけに対応しています。",
        "failed": "現在の市場根拠を取得できませんでした。",
    },
    "zh-CN": {
        "encouragement": "把按规则自动执行交易单独拿出来测试，是一个具体而可行的起点。",
        "reality": "现有券商已经提供 API 和模拟交易环境，因此执行层不需要从零开始。",
        "boundary": "自动执行不等于自动盈利；结果取决于尚未确定的交易规则，也不能保证收益。",
        "validation": "先选择一条明确规则，只使用模拟资金运行并记录结果。",
        "question": "你希望系统执行你已经有的交易规则，还是让系统帮你寻找交易规则？",
        "why": "这个答案会决定产品是执行工具，还是策略探索产品。",
        "unsupported": "当前离线版本只支持自动炒股这一类想法。",
        "failed": "目前无法取得市场证据。",
    },
}

_ANSWER_TEXT = {
    "en": {
        "clarify": (
            "Please choose one path: execute trading rules you already have, or "
            "discover trading rules."
        ),
        "existing_rules": "You chose to execute trading rules you already have.",
        "discover_rules": "You chose to explore and evaluate possible trading rules.",
    },
    "ja": {
        "clarify": "次のどちらかを選んでください：既に持っている売買ルールを実行する、または売買ルールを探す。",
        "existing_rules": "既に持っている売買ルールを実行する方針を選びました。",
        "discover_rules": "売買ルールを探索し、評価する方針を選びました。",
    },
    "zh-CN": {
        "clarify": "请明确选择一条路径：执行你已有的交易规则，或者寻找交易规则。",
        "existing_rules": "你选择了执行自己已有的交易规则。",
        "discover_rules": "你选择了寻找并评估可能的交易规则。",
    },
}

_EXISTING_RULE_MARKERS = (
    "existing rule",
    "my rule",
    "rules i already have",
    "rule i already have",
    "already have",
    "已有",
    "自己的规则",
    "现有规则",
    "既存のルール",
    "持っているルール",
    "持っている売買ルール",
)
_DISCOVER_RULE_MARKERS = (
    "discover rule",
    "discover a strategy",
    "find rule",
    "find a strategy",
    "strategy discovery",
    "寻找",
    "发现",
    "帮我找",
    "策略探索",
    "ルールを探",
    "ルールを見つけ",
    "戦略を探",
)


class NoOpenQuestion(ValueError):
    """Raised when a session cannot accept another strategy-source answer."""


def _supports_automatic_trading(idea: str) -> bool:
    normalized = idea.casefold()
    english = ("automatic" in normalized or "automated" in normalized) and any(
        word in normalized for word in ("trade", "trading", "stock")
    )
    chinese = "自动" in idea and any(word in idea for word in ("炒股", "交易", "股票"))
    japanese = "自動" in idea and any(word in idea for word in ("取引", "売買", "株"))
    return english or chinese or japanese


_SEARCH_LANGUAGE: Mapping[Locale, str] = {"en": "en", "ja": "ja", "zh-CN": "zh"}


def _query_language(query: str, locale: Locale) -> str:
    """Search in the language the answer is written in, not the session language.

    A query written in English is asking for English pages, which is how vendor
    documentation is normally published even for a Japanese or Chinese session.
    """

    return "en" if query.isascii() else _SEARCH_LANGUAGE[locale]


def _route_after_interpret(state: _WorkflowState) -> str:
    """Understood, could not be understood, or out of scope — never silently mixed."""

    if "interpretation" in state:
        return "research"
    if "message" in state:
        return "failed"
    return "unsupported"


class AutomaticTradingVerticalSlice:
    """Deterministic orchestration with an injectable search implementation."""

    def __init__(
        self,
        search: WebSearchAdapter,
        *,
        interpreter: IdeaInterpreter | None = None,
        composer: CardComposer | None = None,
    ) -> None:
        """Keyword routing stays the default so the offline slice needs no model.

        With an interpreter alone the model only routes. Adding a composer moves the
        research queries, the source set, and the answer itself onto real evidence.
        """

        self._search = search
        self._interpreter = interpreter
        self._composer = composer
        self._graph = self._build_graph()

    def run(self, idea: str, *, locale: Locale = "en") -> VerticalSliceResult:
        initial_state = AgentState(idea=idea, locale=locale)
        output = self._graph.invoke(
            {"idea": idea, "locale": locale, "agent_state": initial_state}
        )
        return VerticalSliceResult(
            status=cast(str, output["status"]),
            state=output["agent_state"],
            interpretation=output.get("interpretation"),
            assessment=output.get("assessment"),
            card=output.get("card"),
            question=output.get("question"),
            message=output.get("message"),
        )

    def _build_graph(self):
        graph = StateGraph(_WorkflowState)
        graph.add_node("interpret", self._interpret)
        graph.add_node("unsupported", self._unsupported)
        graph.add_node("research", self._research)
        graph.add_node("evaluate", self._evaluate)
        graph.add_node("failed", self._failed)
        graph.add_node("compose", self._compose)
        graph.add_node("advance", self._advance)

        graph.add_edge(START, "interpret")
        graph.add_conditional_edges("interpret", _route_after_interpret)
        graph.add_conditional_edges(
            "research",
            lambda state: "failed" if "message" in state else "evaluate",
        )
        graph.add_conditional_edges(
            "evaluate",
            lambda state: "failed" if "message" in state else "compose",
        )
        graph.add_conditional_edges(
            "compose",
            lambda state: "failed" if "message" in state else "advance",
        )
        graph.add_edge("unsupported", END)
        graph.add_edge("failed", END)
        graph.add_edge("advance", END)
        return graph.compile()

    def _interpret(self, state: _WorkflowState) -> _WorkflowState:
        if self._interpreter is None:
            return self._interpret_by_keyword(state)
        return self._interpret_by_model(state, self._interpreter)

    def _interpret_by_model(
        self,
        state: _WorkflowState,
        interpreter: IdeaInterpreter,
    ) -> _WorkflowState:
        """A model may describe the idea and pick an implemented scenario, nothing more."""

        try:
            assessment = interpreter.interpret(state["idea"], locale=state["locale"])
        except ModelUnavailable:
            return {"message": _TEXT[state["locale"]]["failed"]}
        if assessment.scenario != "automatic_trading":
            return {"assessment": assessment, "message_override": assessment.unsupported_reason}
        if self._composer is None:
            return {"assessment": assessment, **self._interpret_by_keyword(state, force=True)}
        return {
            "assessment": assessment,
            "model_research": True,
            "interpretation": IdeaInterpretation(
                testable_behavior="automated_trade_execution",
                desired_outcome="profitable_trading",
                missing_decision="strategy_source",
            ),
            "requests": tuple(
                SearchRequest(
                    question=topic.question,
                    query=topic.query,
                    language=_query_language(topic.query, state["locale"]),
                )
                for topic in assessment.research_topics
            ),
        }

    def _interpret_by_keyword(
        self,
        state: _WorkflowState,
        *,
        force: bool = False,
    ) -> _WorkflowState:
        if not force and not _supports_automatic_trading(state["idea"]):
            return {}
        return {
            "interpretation": IdeaInterpretation(
                testable_behavior="automated_trade_execution",
                desired_outcome="profitable_trading",
                missing_decision="strategy_source",
            ),
            "requests": (
                SearchRequest(
                    question=ResearchQuestion.EXECUTION_AND_PAPER_TRADING,
                    query="official automated trading API paper trading documentation",
                ),
                SearchRequest(
                    question=ResearchQuestion.ESTABLISHED_CATEGORY,
                    query="official broker automated trading API simulated account",
                ),
                SearchRequest(
                    question=ResearchQuestion.RETURNS_CLAIM,
                    query="official investor guidance guaranteed investment returns",
                ),
            ),
        }

    def _unsupported(self, state: _WorkflowState) -> _WorkflowState:
        """Prefer the model's own reason so the user learns what is missing."""

        override = state.get("message_override")
        return {
            "status": "unsupported",
            "message": override or _TEXT[state["locale"]]["unsupported"],
        }

    def _failed(self, state: _WorkflowState) -> _WorkflowState:
        return {"status": "research_failed"}

    def _research(self, state: _WorkflowState) -> _WorkflowState:
        if state.get("model_research"):
            return self._research_live(state)
        try:
            hits = {request.question: self._search.search(request) for request in state["requests"]}
        except SearchUnavailable:
            return {"message": _TEXT[state["locale"]]["failed"]}
        if any(not results for results in hits.values()):
            return {"message": _TEXT[state["locale"]]["failed"]}
        return {"hits": hits}

    def _research_live(self, state: _WorkflowState) -> _WorkflowState:
        """On the open web a single query returning nothing is normal, not a failure.

        What matters is whether enough evidence arrived overall, which the evaluation
        step decides. Only a total absence of results stops the run here.
        """

        hits: dict[str, tuple[SearchHit, ...]] = {}
        for request in state["requests"]:
            try:
                results = self._search.search(request)
            except SearchUnavailable:
                continue
            if results:
                hits[request.question] = best_hits(results, limit=_HITS_PER_TOPIC)
        if not hits:
            return {"message": _TEXT[state["locale"]]["failed"]}
        return {"hits": hits}

    def _evaluate(self, state: _WorkflowState) -> _WorkflowState:
        if state.get("model_research"):
            return self._evaluate_live_hits(state)
        unique_hits = {
            str(hit.url).rstrip("/"): hit
            for results in state["hits"].values()
            for hit in results
        }
        sources: list[EvidenceSource] = []
        for url, hit in unique_hits.items():
            policy = _SOURCE_POLICY.get(url)
            if policy is None:
                continue
            source_id, publisher, source_type = policy
            sources.append(
                EvidenceSource(
                    id=source_id,
                    title=hit.title,
                    url=hit.url,
                    publisher=publisher,
                    retrieved_on=hit.retrieved_on,
                    source_type=source_type,
                    excerpt=hit.content,
                )
            )

        independent_publishers = {source.publisher for source in sources}
        if len(independent_publishers) < 2:
            return {"message": _TEXT[state["locale"]]["failed"]}
        return {"sources": tuple(sources)}

    def _evaluate_live_hits(self, state: _WorkflowState) -> _WorkflowState:
        """Trust is decided by the URL, not by the page and not by the model."""

        hits = tuple(hit for results in state["hits"].values() for hit in results)
        sources = classify_hits(hits)
        if independent_publishers(sources) < 2:
            return {"message": _TEXT[state["locale"]]["failed"]}
        return {"sources": sources}

    def _compose(self, state: _WorkflowState) -> _WorkflowState:
        if state.get("model_research"):
            return self._compose_with_model(state)
        text = _TEXT[state["locale"]]
        question = ExplainedQuestion(prompt=text["question"], why_it_matters=text["why"])
        return {
            "card": MarketRealityCard(
                grounded_encouragement=text["encouragement"],
                market_reality=text["reality"],
                honest_boundary=text["boundary"],
                safe_validation_step=text["validation"],
                sources=state["sources"],
            ),
            "question": question,
        }

    def _compose_with_model(self, state: _WorkflowState) -> _WorkflowState:
        """The model writes the answer; every claim it makes cites a retained source."""

        assert self._composer is not None
        try:
            composed = self._composer.compose(
                idea=state["idea"],
                assessment=state["assessment"],
                sources=state["sources"],
                locale=state["locale"],
            )
        except ModelUnavailable:
            return {"message": _TEXT[state["locale"]]["failed"]}
        return {
            "card": MarketRealityCard(
                grounded_encouragement=composed.grounded_encouragement,
                market_reality=composed.market_reality,
                honest_boundary=composed.honest_boundary,
                safe_validation_step=composed.safe_validation_step,
                sources=state["sources"],
            ),
            "question": ExplainedQuestion(
                prompt=composed.question_prompt,
                why_it_matters=composed.question_why,
            ),
            "facts": composed.confirmed_facts,
        }

    def _advance(self, state: _WorkflowState) -> _WorkflowState:
        facts = state.get("facts")
        if facts is not None:
            return self._advance_with_facts(state, facts)
        source_ids = tuple(
            source.id for source in state["sources"] if source.id != "investor-gov-returns"
        )
        question = state["question"]
        state_data = state["agent_state"].model_dump()
        state_data.update(
            {
                "current_stage": Stage.FEASIBILITY,
                "completed_milestones": ("market_research",),
                "confirmed_facts": (
                    ConfirmedFact(
                        id="automated-execution-is-testable",
                        statement=(
                            "Automated execution can be tested with existing infrastructure."
                        ),
                        source_ids=source_ids,
                    ),
                ),
                "evidence_sources": state["sources"],
                "open_questions": (
                    OpenQuestion(
                        id=question.id,
                        prompt=question.prompt,
                        why_it_matters=question.why_it_matters,
                    ),
                ),
                "next_milestone": "simulation_ready_feasibility_path",
            }
        )
        updated_state = AgentState.model_validate(state_data)
        return {"agent_state": updated_state, "status": "awaiting_user"}

    def _advance_with_facts(
        self,
        state: _WorkflowState,
        facts: tuple[ComposedFact, ...],
    ) -> _WorkflowState:
        """Record the model's own facts; AgentState still rejects an uncited claim."""

        question = state["question"]
        state_data = state["agent_state"].model_dump()
        state_data.update(
            {
                "current_stage": Stage.FEASIBILITY,
                "completed_milestones": ("market_research",),
                "confirmed_facts": tuple(
                    ConfirmedFact(
                        id=fact.id,
                        statement=fact.statement,
                        source_ids=fact.source_ids,
                    )
                    for fact in facts
                ),
                "evidence_sources": state["sources"],
                "open_questions": (
                    OpenQuestion(
                        id=question.id,
                        prompt=question.prompt,
                        why_it_matters=question.why_it_matters,
                    ),
                ),
                "next_milestone": "simulation_ready_feasibility_path",
            }
        )
        return {
            "agent_state": AgentState.model_validate(state_data),
            "status": "awaiting_user",
        }


def is_low_information_agreement(answer: str) -> bool:
    """Return whether an answer agrees without selecting either product path."""

    normalized = answer.strip().casefold().rstrip(".!。！")
    return normalized in {
        "yes",
        "yeah",
        "yep",
        "ok",
        "okay",
        "好",
        "好的",
        "可以",
        "是",
        "はい",
        "そうです",
    }


def apply_strategy_source_answer(
    result: VerticalSliceResult,
    answer: str,
    *,
    reader: AnswerReader | None = None,
) -> VerticalSliceResult:
    """Resume the first pause without inferring a product choice from vague agreement.

    Without a reader the answer is matched against fixed wording, which only works for
    the fixed question. With one, the answer to a question written for this session is
    understood. Neither path may turn agreement into a decision.
    """

    open_question = next(
        (
            question
            for question in result.state.open_questions
            if question.id == "strategy_source"
        ),
        None,
    )
    if open_question is None:
        raise NoOpenQuestion("session has no open strategy-source question")

    outcome = _read_answer(open_question, answer, result.state.locale, reader)
    choice = outcome.choice
    question = ExplainedQuestion(
        id="strategy_source",
        prompt=open_question.prompt,
        why_it_matters=open_question.why_it_matters,
    )
    if choice is None:
        result_data = result.model_dump()
        result_data.update(
            {
                "status": "awaiting_user",
                "question": question,
                "message": (
                    outcome.clarification or _ANSWER_TEXT[result.state.locale]["clarify"]
                ),
            }
        )
        return VerticalSliceResult.model_validate(result_data)

    choice_value = choice.value
    statement = outcome.statement or _ANSWER_TEXT[result.state.locale][choice_value]
    state_data = result.state.model_dump()
    state_data.update(
        {
            "current_stage": Stage.FEASIBILITY,
            "completed_milestones": tuple(
                dict.fromkeys(
                    (*result.state.completed_milestones, "strategy_source_decided")
                )
            ),
            "open_questions": tuple(
                question
                for question in result.state.open_questions
                if question.id != "strategy_source"
            ),
            "product_decisions": (
                *result.state.product_decisions,
                ProductDecision(choice=choice, statement=statement),
            ),
            "next_milestone": (
                "define_one_rule_for_paper_trading"
                if choice is StrategySourceChoice.EXISTING_RULES
                else "define_strategy_discovery_evaluation"
            ),
        }
    )
    result_data = result.model_dump()
    result_data.update(
        {
            "status": "decision_recorded",
            "state": AgentState.model_validate(state_data),
            "question": None,
            "message": statement,
        }
    )
    return VerticalSliceResult.model_validate(result_data)


class _AnswerOutcome(NamedTuple):
    """What an answer decided, how to say it back, and what to ask if it decided nothing."""

    choice: StrategySourceChoice | None
    statement: str | None = None
    clarification: str | None = None


def _read_answer(
    open_question: OpenQuestion,
    answer: str,
    locale: Locale,
    reader: AnswerReader | None,
) -> _AnswerOutcome:
    """Report what an answer settled, if anything.

    Agreement is never a decision, whoever reads the answer: this guard runs before
    the model, so "yes" cannot become a product path no matter how a model would have
    read it.
    """

    normalized = " ".join(answer.strip().casefold().split())
    if not normalized or is_low_information_agreement(normalized):
        return _AnswerOutcome(None)
    if reader is None:
        return _AnswerOutcome(_parse_strategy_source_choice(answer))
    try:
        reading = reader.read(question=open_question.prompt, answer=answer, locale=locale)
    except ModelUnavailable:
        return _AnswerOutcome(_parse_strategy_source_choice(answer))
    choice = reading.as_choice()
    if choice is None:
        # The fixed wording names two options the user was never shown, because the
        # question was written for this session. The model's own reason is about the
        # answer they actually gave.
        return _AnswerOutcome(None, clarification=reading.why.strip() or None)
    return _AnswerOutcome(choice, statement=reading.restatement.strip() or None)


def _parse_strategy_source_choice(answer: str) -> StrategySourceChoice | None:
    normalized = " ".join(answer.strip().casefold().split())
    if not normalized or is_low_information_agreement(normalized):
        return None

    selects_existing = any(marker in normalized for marker in _EXISTING_RULE_MARKERS)
    selects_discovery = any(marker in normalized for marker in _DISCOVER_RULE_MARKERS)
    if selects_existing == selects_discovery:
        return None
    if selects_existing:
        return StrategySourceChoice.EXISTING_RULES
    return StrategySourceChoice.DISCOVER_RULES
