"""Model-written feasibility path and MVP boundary.

The user has already made the decision that selects this path. The model turns that
decision into a boundary the user can confirm or reject; it does not revisit the
decision, and it does not approve its own proposal.
"""

from __future__ import annotations

import json
from typing import Protocol

from goodidea_agent.domain.guidance import ComposedProposal
from goodidea_agent.domain.research import VerticalSliceResult
from goodidea_agent.domain.state import Locale
from goodidea_agent.memory.working import RecalledNote
from goodidea_agent.model.adapter import ModelAdapter, ModelMessage, ModelRequest, ModelRole
from goodidea_agent.model.structured import complete_structured, schema_instruction

PURPOSE = "mvp_proposal"

_OUTPUT_LANGUAGE: dict[Locale, str] = {
    "en": "English",
    "ja": "Japanese",
    "zh-CN": "Simplified Chinese",
}

_RULES = (
    "You are GoodIdea, turning one decision the user already made into an MVP boundary.",
    (
        "The decision below is settled. Build on it. Never re-ask it, never propose the"
        " other path, and never widen the product beyond what this first version needs."
    ),
    (
        "The first version must be buildable with no real money, no live account, no"
        " credentials for a third-party service, and no external side effects."
    ),
    (
        "excluded names what this version deliberately does not do, and must include the"
        " outcome the user hoped for when nothing can promise it. Nothing may appear in"
        " both included and excluded."
    ),
    (
        "acceptance_criteria are checks someone can run against the built thing and get a"
        " yes or no. Not intentions, not qualities."
    ),
    (
        "user_flow steps are short labels a person scans, not sentences: name the action"
        " and stop. included, excluded and assumptions are each one short phrase for the"
        " same reason. Detail belongs in the acceptance criteria, where it is checked."
    ),
    (
        "implementation_order is the order a coding agent should build in, starting with"
        " what makes the rest testable."
    ),
    (
        "approval_prompt asks the user to confirm this exact boundary. approval_why says"
        " what approving freezes. Neither may claim the product will succeed."
    ),
    (
        "what_we_know_about_the_user is what this person told us in this or an earlier"
        " session. Fit the first version to it: do not propose work they said they cannot"
        " do, and do not propose a direction they already rejected. It is what they said"
        " about themselves, not evidence, so never cite it as a finding."
    ),
)


class ProposalComposer(Protocol):
    """Boundary used by the guidance workflow so the model stays replaceable."""

    def compose(
        self,
        result: VerticalSliceResult,
        *,
        notes: tuple[RecalledNote, ...] = (),
    ) -> ComposedProposal: ...


class ModelProposalComposer:
    """Write one reviewable proposal from the decided path and the evidence so far."""

    def __init__(self, adapter: ModelAdapter, *, max_output_tokens: int = 2_400) -> None:
        self._adapter = adapter
        self._max_output_tokens = max_output_tokens

    def compose(
        self,
        result: VerticalSliceResult,
        *,
        notes: tuple[RecalledNote, ...] = (),
    ) -> ComposedProposal:
        request = ModelRequest(
            purpose=PURPOSE,
            messages=(
                ModelMessage(
                    role=ModelRole.SYSTEM,
                    content=self._system_prompt(result.state.locale),
                ),
                ModelMessage(
                    role=ModelRole.USER,
                    content=self._user_prompt(result, notes),
                ),
            ),
            max_output_tokens=self._max_output_tokens,
        )
        proposal, _ = complete_structured(
            self._adapter,
            request,
            ComposedProposal,
            check=_reject_a_boundary_that_is_not_one,
        )
        return proposal

    def _system_prompt(self, locale: Locale) -> str:
        return "\n".join(
            (
                *_RULES,
                f"Write every human-readable field in {_OUTPUT_LANGUAGE[locale]}.",
                schema_instruction(ComposedProposal),
            )
        )

    def _user_prompt(
        self,
        result: VerticalSliceResult,
        notes: tuple[RecalledNote, ...] = (),
    ) -> str:
        decision = next(
            (item for item in result.state.product_decisions if item.id == "strategy_source"),
            None,
        )
        context: dict[str, object] = {
            "idea": result.state.idea,
            "decision_the_user_made": decision.statement if decision else None,
            "decided_path": decision.choice.value if decision else None,
        }
        if result.assessment is not None:
            context["core_uncertainty"] = result.assessment.core_uncertainty
            context["outcome_the_user_hopes_for"] = result.assessment.desired_outcome
        if result.card is not None:
            context["market_reality"] = result.card.market_reality
            context["honest_boundary"] = result.card.honest_boundary
            context["safe_validation_step"] = result.card.safe_validation_step
        context["established_facts"] = [
            fact.statement for fact in result.state.confirmed_facts
        ]
        if notes:
            context["what_we_know_about_the_user"] = [
                {"kind": note.kind, "statement": note.statement} for note in notes
            ]
        return json.dumps(context, ensure_ascii=False, indent=2)


def _reject_a_boundary_that_is_not_one(proposal: ComposedProposal) -> None:
    """A line that is both in and out of scope draws no boundary at all."""

    included = {item.strip().casefold() for item in proposal.included}
    overlap = sorted(item for item in proposal.excluded if item.strip().casefold() in included)
    if overlap:
        raise ValueError(
            "these appear in both included and excluded: "
            f"{', '.join(overlap)}. Each one belongs on exactly one side."
        )
