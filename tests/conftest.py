"""Keep the suite offline no matter what the shell happens to export.

Every adapter falls back to a deterministic implementation when its configuration is
absent, so a key present in the environment silently turns these tests into live
calls: real model output, real search, real cost, and assertions that drift. The
promise that this suite runs with no key and no network has to be enforced here
rather than depend on how the developer started the shell.
"""

import os

import pytest

# Anything that would make an adapter reach outside this process.
_LIVE_CONFIGURATION = (
    "GOODIDEA_MODEL_BASE_URL",
    "GOODIDEA_MODEL_API_KEY",
    "GOODIDEA_MODEL_NAME",
    "GOODIDEA_MODEL_EXTRA_BODY",
    "GOODIDEA_MODEL_TIMEOUT_SECONDS",
    "TAVILY_API_KEY",
    # Not a live call, but it would write test data into a real database.
    "GOODIDEA_DATABASE",
    "GOODIDEA_USER_ID",
)


@pytest.fixture(autouse=True, scope="session")
def _offline_environment():
    with pytest.MonkeyPatch.context() as patch:
        for name in _LIVE_CONFIGURATION:
            patch.delenv(name, raising=False)
        yield


def test_names_are_not_collected_from_this_module() -> None:
    """Guard against a stray import turning the tuple above into a test."""

    assert all(name.isupper() for name in _LIVE_CONFIGURATION)
    assert os.environ.get("TAVILY_API_KEY") is None
