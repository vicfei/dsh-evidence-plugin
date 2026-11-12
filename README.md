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

From the plugin market, or `dsh plugin add vicfei/dsh-evidence-plugin`.

## Configure

| Option | Meaning | Default |
|---|---|---|
| `repo` | absolute path to the evidence git repo | — (disabled when empty) |
| `commitEvery` | cadence hint for auto-commit sweep | `50` |

## Maintainer verification checklist

1. ~~Cordis catalog check~~ **RESOLVED 2026-11-12**: contract verified (see agentdiary README note) — `inject: []`, two-arg `(session, event)` handlers, schemastery `Schema.object` Config, `dsh.bundle` layer manifest. Headless boot activates both entries with zero warnings.
2. Live smoke under Node ≥22.22.3 with a real session; then npm publish + dsh-plugin.org listing.

MIT
