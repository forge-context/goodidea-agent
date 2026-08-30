from goodidea_agent.domain.guidance import MvpProposal
from goodidea_agent.tools.sandbox import StaticPreviewSandbox


def test_static_preview_escapes_content_and_disables_capabilities() -> None:
    proposal = MvpProposal(
        id="demo-v1",
        title="<script>alert(1)</script>",
        promise="Review one <strong>idea</strong>",
        target_user="One user",
        included=("Mock <data>",),
        excluded=("Network",),
        user_flow=("Open", "Review"),
        acceptance_criteria=("Visible",),
        assumptions=("Local",),
    )

    preview = StaticPreviewSandbox().render(proposal)

    assert "<script>" not in preview.html
    assert "&lt;script&gt;" in preview.html
    assert "https://" not in preview.html
    assert preview.iframe_sandbox == ""
    assert preview.scripts_allowed is False
    assert preview.network_allowed is False
    assert preview.persistent_storage_allowed is False
    assert preview.mock_data_only is True
