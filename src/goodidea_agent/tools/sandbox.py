"""A no-script, no-network preview sandbox for reviewing an MVP proposal."""

from __future__ import annotations

from html import escape
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from goodidea_agent.domain.guidance import MvpProposal


class SandboxPreview(BaseModel):
    """HTML that is safe to place in an iframe with an empty sandbox attribute."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    html: str = Field(min_length=1)
    content_security_policy: Literal[
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
    ] = "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
    iframe_sandbox: Literal[""] = ""
    scripts_allowed: Literal[False] = False
    network_allowed: Literal[False] = False
    persistent_storage_allowed: Literal[False] = False
    mock_data_only: Literal[True] = True


class StaticPreviewSandbox:
    """Render a deterministic proposal preview without executing generated code."""

    def render(self, proposal: MvpProposal) -> SandboxPreview:
        title = escape(proposal.title)
        promise = escape(proposal.promise)
        flow = "".join(
            f"<li><span>{index}</span>{escape(step)}</li>"
            for index, step in enumerate(proposal.user_flow, start=1)
        )
        included = "".join(f"<li>{escape(item)}</li>" for item in proposal.included)
        html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{{box-sizing:border-box}}body{{margin:0;padding:24px;background:#f4f1e8;color:#172724;font:14px system-ui,sans-serif}}
    main{{max-width:720px;margin:auto;padding:24px;border:1px solid #d8d7cb;border-radius:16px;background:#fffdf8}}
    .badge{{display:inline-block;padding:5px 8px;border-radius:99px;background:#d9f36f;font-size:10px;font-weight:700;text-transform:uppercase}}
    h1{{margin:16px 0 8px;font:32px Georgia,serif}}p{{color:#58635f;line-height:1.6}}
    ol{{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0;list-style:none}}
    ol li,section{{padding:12px;border:1px solid #d8d7cb;border-radius:9px}}ol span{{margin-right:8px;color:#0f6b55;font-family:monospace}}
    section{{margin-top:16px;background:#f3f8f2}}section h2{{font-size:12px;text-transform:uppercase;letter-spacing:.08em}}ul{{padding-left:18px;line-height:1.7}}
    footer{{margin-top:18px;color:#7a827f;font-size:10px}}@media(max-width:520px){{ol{{grid-template-columns:1fr}}}}
  </style>
</head>
<body>
  <main>
    <span class="badge">Sandbox preview · mock data only</span>
    <h1>{title}</h1>
    <p>{promise}</p>
    <ol>{flow}</ol>
    <section><h2>MVP boundary</h2><ul>{included}</ul></section>
    <footer>No scripts · no network · no storage · no external side effects</footer>
  </main>
</body>
</html>"""
        return SandboxPreview(
            id=f"sandbox-{proposal.id}",
            title=proposal.title,
            html=html,
        )
