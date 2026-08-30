# Recorded model responses

Each file is one real model answer, stored as `<model>/<request fingerprint>.json`
with the request that produced it.

Record them while a key is valid:

```bash
set -a && source .env && set +a
PYTHONPATH=src python -m goodidea_agent.model.record
```

The fingerprint covers the prompt, not the provider or model name, so one case lands
on the same filename under every model. Recording the same cases with a second
`GOODIDEA_MODEL_NAME` produces a directory that can be compared file by file:

```bash
diff -r fixtures/model/<model-a> fixtures/model/<model-b>
```

`RecordedModelAdapter` replays these files; it never invents an answer for a request
it has not seen.

These files are evidence about a provider's behaviour on a date. They are not a
substitute for the deterministic contract tests, which use `FakeModelAdapter` and
run without any key.
