"""Curated offline evidence for the automatic-trading acceptance scenario."""

from datetime import date

from goodidea_agent.tools.web_search import (
    ConstantWebSearchAdapter,
    FakeWebSearchAdapter,
    ResearchQuestion,
    SearchHit,
)

CURATED_ON = date(2026, 8, 29)

ALPACA_PAPER_TRADING = SearchHit(
    title="Paper Trading",
    url="https://docs.alpaca.markets/us/docs/paper-trading",
    content=(
        "Alpaca documents a real-time simulation environment for testing trading code "
        "without routing orders to a live exchange."
    ),
    retrieved_on=CURATED_ON,
)

IBKR_TWS_API = SearchHit(
    title="TWS API introduction",
    url="https://interactivebrokers.github.io/tws-api/introduction.html",
    content=(
        "Interactive Brokers documents an API for automated trading and a paper account "
        "for testing strategies without risking capital."
    ),
    retrieved_on=CURATED_ON,
)

INVESTOR_GOV_RETURNS = SearchHit(
    title="Protect Your Money: How to Avoid Investment Scams",
    url="https://www.investor.gov/protect-your-investments/fraud/protect-your-money",
    content=(
        "Investor.gov explains that every investment involves risk and high guaranteed "
        "investment returns do not exist."
    ),
    retrieved_on=CURATED_ON,
)


def build_fixed_evidence_adapter() -> ConstantWebSearchAdapter:
    """Return the same curated evidence for any query a model may write."""

    return ConstantWebSearchAdapter(
        (ALPACA_PAPER_TRADING, IBKR_TWS_API, INVESTOR_GOV_RETURNS)
    )


def build_demo_search_adapter() -> FakeWebSearchAdapter:
    """Return the reproducible evidence set used by tests and the local demo."""

    return FakeWebSearchAdapter(demo_search_results())


def demo_search_results() -> dict[ResearchQuestion, tuple[SearchHit, ...]]:
    """Return a fresh mapping so failure tests never reach into adapter internals."""

    execution_sources = (ALPACA_PAPER_TRADING, IBKR_TWS_API)
    return {
        ResearchQuestion.EXECUTION_AND_PAPER_TRADING: execution_sources,
        ResearchQuestion.ESTABLISHED_CATEGORY: execution_sources,
        ResearchQuestion.RETURNS_CLAIM: (INVESTOR_GOV_RETURNS,),
    }
