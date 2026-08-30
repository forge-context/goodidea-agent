"""Run a small piece of code to settle one named uncertainty.

The product principle this serves is narrow: a demo exists to resolve a question
somebody named, not to look like progress. So a run carries the question it answers,
and the result reports what it does not answer as well as what it does.

Isolation is not optional and is not approximated. A bare subprocess on a developer
machine can read the whole filesystem and reach the network; calling that a sandbox
would be a lie told to the person trusting the result. When no container runtime is
available this refuses to run and says so.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import time
from collections.abc import Mapping, Sequence
from enum import Enum
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field

# The image only needs a Python interpreter. It is pinned by digest-free tag on
# purpose: the run must be reproducible within a session, not across years.
DEFAULT_IMAGE = "python:3.11-slim"

MAX_OUTPUT_CHARACTERS = 4_000

# Docker reports 125 when it fails before the container's own command runs.
_RUNTIME_REFUSED = 125


class SandboxPhase(str, Enum):
    """The steps a run goes through, in the order the interface shows them."""

    PREPARE = "prepare"
    LOAD = "load"
    EXECUTE = "execute"
    COLLECT = "collect"


class SandboxLimits(BaseModel):
    """What the run may consume. Everything absent from this list is denied."""

    model_config = ConfigDict(frozen=True)

    seconds: int = Field(default=10, gt=0, le=60)
    memory_mb: int = Field(default=256, ge=32, le=2_048)
    processes: int = Field(default=64, ge=8, le=512)


class SandboxArtifact(BaseModel):
    """One question, the code that answers it, and the data it may read."""

    model_config = ConfigDict(frozen=True)

    question: str = Field(min_length=1)
    code: str = Field(min_length=1)
    files: Mapping[str, str] = Field(default_factory=dict)
    limits: SandboxLimits = SandboxLimits()


class SandboxAttempt(BaseModel):
    """One execution of the artifact."""

    model_config = ConfigDict(frozen=True)

    stdout: str
    stderr: str
    exit_code: int
    duration_ms: int = Field(ge=0)


class SandboxOutcome(BaseModel):
    """What the run established, and what it did not.

    ``repeatable`` is the only judgment made here, because it is the only one that
    can be made by comparing two executions. Whether the answer is good news about
    the product is not a question this tool can answer.
    """

    model_config = ConfigDict(frozen=True)

    question: str = Field(min_length=1)
    attempts: tuple[SandboxAttempt, ...] = Field(min_length=1)
    repeatable: bool
    network_allowed: bool = False
    filesystem_writable: bool = False
    external_side_effects_allowed: bool = False

    @property
    def succeeded(self) -> bool:
        return all(attempt.exit_code == 0 for attempt in self.attempts)


class SandboxUnavailable(RuntimeError):
    """Raised when the code cannot be run under real isolation.

    This is deliberately not a fallback. Running the code with weaker isolation
    would produce a result that looks identical and means something different.
    """


class ExecutionSandbox(Protocol):
    """Interface implemented by the container runner and by test doubles."""

    def run(self, artifact: SandboxArtifact, *, repeats: int = 2) -> SandboxOutcome: ...


class CommandRunner(Protocol):
    """The single point where this module touches the operating system."""

    def which(self, program: str) -> str | None: ...

    def run(self, command: Sequence[str], *, timeout: float) -> tuple[int, str, str]: ...


class SubprocessCommandRunner:
    def which(self, program: str) -> str | None:
        return shutil.which(program)

    def run(self, command: Sequence[str], *, timeout: float) -> tuple[int, str, str]:
        try:
            # Fixed argv, never a shell string: nothing here is interpolated.
            completed = subprocess.run(
                list(command),
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return 124, "", "timed out"
        return completed.returncode, completed.stdout, completed.stderr


class ContainerSandbox:
    """Execute the artifact in a container with nothing granted to it."""

    def __init__(
        self,
        *,
        runner: CommandRunner | None = None,
        image: str = DEFAULT_IMAGE,
        runtime: str = "docker",
    ) -> None:
        self._runner = runner or SubprocessCommandRunner()
        self._image = image
        self._runtime = runtime
        self._available: bool | None = None

    def available(self) -> bool:
        """Report whether a container can actually be started, not whether a binary exists.

        An installed client with no daemon behind it would fail at run time in a way
        that reads like the code failed, which is the confusion this tool exists to
        avoid. The probe result is kept for the life of this object.
        """

        if self._available is None:
            self._available = self._probe()
        return self._available

    def _probe(self) -> bool:
        if self._runner.which(self._runtime) is None:
            return False
        exit_code, _, _ = self._runner.run((self._runtime, "info"), timeout=10)
        return exit_code == 0

    def run(self, artifact: SandboxArtifact, *, repeats: int = 2) -> SandboxOutcome:
        if not self.available():
            raise SandboxUnavailable(
                f"{self._runtime} cannot start a container here, so the code cannot be"
                " isolated"
            )
        attempts = tuple(self._execute(artifact) for _ in range(max(1, repeats)))
        outputs = {attempt.stdout for attempt in attempts}
        return SandboxOutcome(
            question=artifact.question,
            attempts=attempts,
            # Two runs of the same input that disagree have not settled anything, and
            # saying so is more useful than reporting the first one.
            repeatable=len(outputs) == 1 and all(a.exit_code == 0 for a in attempts),
        )

    def _execute(self, artifact: SandboxArtifact) -> SandboxAttempt:
        payload = json.dumps({"code": artifact.code, "files": dict(artifact.files)})
        started = time.monotonic()
        exit_code, stdout, stderr = self._runner.run(
            self._command(artifact, payload),
            timeout=artifact.limits.seconds + 5,
        )
        if exit_code == _RUNTIME_REFUSED:
            # The runtime never got as far as the program. Reporting this as a failed
            # attempt would blame the code for the machine.
            raise SandboxUnavailable(f"{self._runtime} could not start the container")
        return SandboxAttempt(
            stdout=stdout[:MAX_OUTPUT_CHARACTERS],
            stderr=stderr[:MAX_OUTPUT_CHARACTERS],
            exit_code=exit_code,
            duration_ms=int((time.monotonic() - started) * 1000),
        )

    def _command(self, artifact: SandboxArtifact, payload: str) -> tuple[str, ...]:
        limits = artifact.limits
        return (
            self._runtime,
            "run",
            "--rm",
            "--interactive",
            # No route out. This is what makes the result about the code and not
            # about whatever it could reach.
            "--network=none",
            "--read-only",
            "--tmpfs=/work:rw,size=16m,mode=1777",
            "--workdir=/work",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "--user=65534:65534",
            f"--memory={limits.memory_mb}m",
            f"--pids-limit={limits.processes}",
            "--env=PYTHONDONTWRITEBYTECODE=1",
            self._image,
            "python",
            "-c",
            _BOOTSTRAP,
            payload,
        )


# Files and code arrive as one JSON argument so nothing is interpolated into a shell
# and nothing is mounted from the host.
_BOOTSTRAP = """
import json, pathlib, sys, resource
spec = json.loads(sys.argv[1])
for name, content in spec["files"].items():
    path = pathlib.Path(name)
    if path.is_absolute() or ".." in path.parts:
        raise SystemExit("refusing to write outside the work directory")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
exec(compile(spec["code"], "artifact.py", "exec"), {"__name__": "__main__"})
""".strip()
