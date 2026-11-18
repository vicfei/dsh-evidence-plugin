# evidence ledger for DeepSeek Harness

**Every session transition lands in a hash-chained, append-only ledger — in your own git repo.**

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin porting the v1.5 evidence ledger of [dsh-super-agent](https://github.com/vicfei/dsh-super-agent) into the official harness: trust is not a claim, it's a chain you can verify.

```text
evidence/ledger.jsonl   one JSON row per transition: { id, ts, kind, payload, prevHash, entryHash }
evidence/head           the last entryHash (tail-truncation anchor)
```

`entryHash = sha256(kind ⟟ payload ⟟ prevHash)`, genesis = 64 zeros. Edit any row and the chain breaks; truncate the tail and the head anchor breaks. The chain's promise is no *silent* partial edit.

Complements mutable work-state layers (e.g. LoopX): they carry the work, this makes what happened non-repudiable.

## Install

From the plugin market, or `dsh plugin --profile web add dsh-evidence-plugin`.

**Deployment notes** (learned the hard way on live nodes):

- The web app runs the **web profile** — a plain `dsh plugin add` installs into `default` and never loads. Use `--profile web` (or install from the market inside the web UI).
- Port 3080 is often taken; start with `dsh web --port <n>`.
- Node ≥ 22.22.3 / 24 (the harness's own engines floor).

## Configure

| Option | Meaning | Default |
|---|---|---|
| `repo` | absolute path to the evidence git repo | — (disabled when empty) |
| `commitEvery` | cadence hint for auto-commit sweep | `50` |

## Maintainer verification checklist

1. ~~Cordis catalog check~~ **RESOLVED 2026-11-12**: contract verified (see agentdiary README note) — `inject: []`, two-arg `(session, event)` handlers, schemastery `Schema.object` Config, `dsh.bundle` layer manifest. Headless boot activates both entries with zero warnings.
2. ~~Live smoke~~ **PASSED 2026-11-18** (win11, real web session): 126-row chain verified intact, 3 auto-commits landed. Deployment potholes documented above.

MIT
