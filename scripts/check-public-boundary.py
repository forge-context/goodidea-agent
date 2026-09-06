"""Check tracked/staged file paths; this is not a content or history secret scan."""
from pathlib import PurePosixPath
import subprocess
import sys

files = {"README.md", "README.zh.md", "README.ja.md", "LICENSE", ".gitignore", "AGENTS.md", "CHANGELOG.md", "scripts/check-public-boundary.py", ".github/workflows/checks.yml"}
for suffix in ("", ".zh", ".ja"):
    files.add(f"docs/design/lp-visual-system{suffix}.md")
    files.add(f"docs/deployment/cloudflare-pages{suffix}.md")
forbidden_parts = {"node_modules", "dist", ".venv", "__pycache__"}
paths = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
errors = []
for name in filter(None, paths):
    p = PurePosixPath(name)
    allowed = name in files or name.startswith(("web/", "shared/studio/"))
    if not allowed or forbidden_parts.intersection(p.parts) or any(part.startswith(".env") for part in p.parts) or p.suffix in {".db", ".sqlite", ".log"}:
        errors.append(name)
if errors:
    print("Unexpected public paths:\n" + "\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"Public boundary checked: {len(list(filter(None, paths)))} files")
