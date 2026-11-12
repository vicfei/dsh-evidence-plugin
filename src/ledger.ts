// Hash-chained, append-only evidence ledger — a faithful port of the v1.5 ledger from
// dsh-super-agent (src/ledger.ts, MIT) into a standalone, git-backed form:
//   evidence/ledger.jsonl   one JSON row per transition:
//     { id, ts, kind, payload, prevHash, entryHash }
//   evidence/head           the last entryHash (tail-truncation anchor)
// entryHash = sha256(kind + "\u241f" + payload + "\u241f" + prevHash); genesis prev = 64 zeros.

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const GENESIS = "0".repeat(64);
const SEP = "\u241f";

export interface LedgerRow {
  id: number;
  ts: string;
  kind: string;
  payload: string;
  prevHash: string;
  entryHash: string;
}

function hashOf(kind: string, payload: string, prev: string): string {
  return createHash("sha256").update(`${kind}${SEP}${payload}${SEP}${prev}`).digest("hex");
}

export class EvidenceLedger {
  private readonly file: string;
  private readonly headFile: string;

  constructor(root: string) {
    this.file = join(root, "evidence", "ledger.jsonl");
    this.headFile = join(root, "evidence", "head");
    mkdirSync(join(root, "evidence"), { recursive: true });
  }

  head(): string {
    return existsSync(this.headFile) ? readFileSync(this.headFile, "utf8").trim() : GENESIS;
  }

  rows(): LedgerRow[] {
    if (!existsSync(this.file)) return [];
    return readFileSync(this.file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l: string) => JSON.parse(l) as LedgerRow);
  }

  /** Append one transition. Called synchronously with the state change it describes. */
  emit(kind: string, payload: Record<string, unknown> = {}): LedgerRow {
    const body = JSON.stringify(payload);
    const prev = this.head();
    const id = this.rows().length + 1;
    const row: LedgerRow = { id, ts: new Date().toISOString(), kind, payload: body, prevHash: prev, entryHash: hashOf(kind, body, prev) };
    appendFileSync(this.file, JSON.stringify(row) + "\n");
    writeFileSync(this.headFile, row.entryHash + "\n");
    return row;
  }

  /** Recompute the whole chain + check the head anchor. Returns the first broken row. */
  verify(): { ok: true; count: number } | { ok: false; count: number; reason: string } {
    const rows = this.rows();
    const anchor = this.head();
    if (rows.length === 0 && anchor !== GENESIS) {
      return { ok: false, count: 0, reason: `head anchor ${anchor.slice(0, 12)}… points past an EMPTY ledger — truncated` };
    }
    let prev = GENESIS;
    for (const r of rows) {
      if (r.prevHash !== prev) return { ok: false, count: rows.length, reason: `row ${r.id}: prevHash does not chain` };
      if (hashOf(r.kind, r.payload, r.prevHash) !== r.entryHash) return { ok: false, count: rows.length, reason: `row ${r.id}: entry_hash mismatch — edited after the fact` };
      prev = r.entryHash;
    }
    if (prev !== anchor) return { ok: false, count: rows.length, reason: "head anchor ahead of last row — tail truncated" };
    return { ok: true, count: rows.length };
  }
}
