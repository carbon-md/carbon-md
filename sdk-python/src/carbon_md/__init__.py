"""carbon.md — Python SDK (placeholder).

carbon.md is an open standard for carbon-governed AI agents: a Markdown
policy file plus tooling to measure agent emissions, govern them with
human-set policies, and fund verified carbon-removal contributions.

This 0.0.x release reserves the package name while the SDK is built.
Planned for 0.1: an EcoLogits-based usage tracker, a LangGraph callback,
and ledger interop with the reference CLI (`npx carbon-md`).

Spec and reference implementation: https://github.com/carbon-md/carbon-md
"""

__version__ = "0.0.1"

SPEC_URL = "https://github.com/carbon-md/carbon-md"


def status() -> str:
    """Return a short note about the state of this package."""
    return (
        "carbon-md (Python) is a placeholder — the SDK is in development. "
        f"Follow along at {SPEC_URL} — meanwhile the reference CLI works today: "
        "npx carbon-md init"
    )
