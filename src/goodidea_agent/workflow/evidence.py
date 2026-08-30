"""Turn raw search hits into evidence the product is willing to cite.

The model decides what to look up. It does not decide how far a source is trusted:
that judgment is made here from the URL itself, so a persuasive page cannot argue
its way into a higher trust level.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

from goodidea_agent.domain.state import EvidenceSource
from goodidea_agent.tools.web_search import SearchHit

# Public bodies and standards organisations. A page served from one of these is
# treated as authoritative for factual claims about rules and risks.
_AUTHORITATIVE_SUFFIXES: tuple[str, ...] = (
    ".gov",
    ".gov.uk",
    ".go.jp",
    ".gov.cn",
    ".europa.eu",
    ".int",
    ".edu",
    ".ac.uk",
    ".ac.jp",
    ".edu.cn",
)

# Vendor documentation and developer references describe what a tool actually does,
# which is the strongest evidence available for a feasibility question.
_PRIMARY_HOST_MARKERS: tuple[str, ...] = ("docs.", "developer.", "developers.", "api.")
_PRIMARY_PATH_PREFIXES: tuple[str, ...] = ("/docs/", "/documentation/", "/developer/")

# Pages whose authorship cannot be attributed to anyone accountable. A post can be
# right, but the product cannot cite it as evidence, so these never become sources.
NOT_EVIDENCE_HOSTS: frozenset[str] = frozenset(
    {
        "facebook.com",
        "instagram.com",
        "x.com",
        "twitter.com",
        "t.co",
        "reddit.com",
        "tiktok.com",
        "douyin.com",
        "weibo.com",
        "pinterest.com",
        "quora.com",
        "baidu.com",
        "google.com",
        "bing.com",
        "yahoo.co.jp",
        "so.com",
        "sogou.com",
        "youtube.com",
        "bilibili.com",
    }
)

_SLUG = re.compile(r"[^a-z0-9]+")


def classify_hit(hit: SearchHit, *, taken_ids: frozenset[str] = frozenset()) -> EvidenceSource:
    """Describe one hit as a citable source, without asking a model to vouch for it."""

    host = (urlparse(str(hit.url)).hostname or "").lower().removeprefix("www.")
    path = urlparse(str(hit.url)).path.lower()
    return EvidenceSource(
        id=_unique_id(host, path, taken_ids),
        title=hit.title,
        url=hit.url,
        publisher=_publisher(host),
        retrieved_on=hit.retrieved_on,
        source_type=_source_type(host, path),
        excerpt=hit.content,
    )


def is_citable(hit: SearchHit) -> bool:
    """Reject pages that cannot carry attribution, before they can be cited."""

    host = (urlparse(str(hit.url)).hostname or "").lower().removeprefix("www.")
    return _publisher(host) not in NOT_EVIDENCE_HOSTS


def classify_hits(hits: tuple[SearchHit, ...]) -> tuple[EvidenceSource, ...]:
    """Classify citable hits in order, keeping one source per URL and unique ids."""

    seen_urls: set[str] = set()
    sources: list[EvidenceSource] = []
    for hit in hits:
        if not is_citable(hit):
            continue
        url = str(hit.url).rstrip("/")
        if url in seen_urls:
            continue
        seen_urls.add(url)
        sources.append(classify_hit(hit, taken_ids=frozenset(source.id for source in sources)))
    return tuple(sources)


def best_hits(hits: tuple[SearchHit, ...], *, limit: int) -> tuple[SearchHit, ...]:
    """Keep the highest-ranked hits of one query.

    A long list of weakly related pages makes a worse answer than a short list of
    close ones: everything handed to the writer is material it may cite.
    """

    ranked = sorted(hits, key=lambda hit: hit.score if hit.score is not None else 0.0, reverse=True)
    return tuple(ranked[:limit])


def independent_publishers(sources: tuple[EvidenceSource, ...]) -> int:
    """Count distinct publishers, so one site cannot look like agreement."""

    return len({source.publisher for source in sources})


def _publisher(host: str) -> str:
    """Report the registrable site rather than the sub-domain that served the page."""

    if not host:
        return "unknown"
    labels = host.split(".")
    if len(labels) <= 2:
        return host
    if len(labels[-2]) <= 3 and len(labels[-1]) <= 3:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:])


def _source_type(host: str, path: str) -> str:
    if any(host.endswith(suffix) for suffix in _AUTHORITATIVE_SUFFIXES):
        return "authoritative"
    if host.startswith(_PRIMARY_HOST_MARKERS) or path.startswith(_PRIMARY_PATH_PREFIXES):
        return "primary"
    return "secondary"


def _unique_id(host: str, path: str, taken_ids: frozenset[str]) -> str:
    base = _SLUG.sub("-", f"{_publisher(host)}-{path}").strip("-")[:48] or "source"
    if base not in taken_ids:
        return base
    suffix = 2
    while f"{base}-{suffix}" in taken_ids:
        suffix += 1
    return f"{base}-{suffix}"
