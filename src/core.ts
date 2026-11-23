// EvidenceCore — the harness-agnostic evidence engine (v0.3 P1, EventSource seam).
// Receives normalized session events, appends hash-chained transitions to the ledger,
// and owns the dirty-tracking/flush cycle. Knows nothing about Cordis or OAR — adapters
// normalize their host's stream into EvidenceEvents.

import { EvidenceLedger } from "./ledger.js";
import { toTransition } from "./entry.js";
import { commitEvidence } from "./git.js";

export interface EvidenceEvent {
  sessionId: string;
  phase: "created" | "event" | "disposed";
  /** The harness event type (e.g. "turn/end"); adapters may pass raw events for mapping. */
  type?: string;
  data?: Record<string, unknown>;
}

export interface EvidenceCoreOptions {
  repo: string;
  log?: { info?: (m: string) => void; warn?: (m: string) => void };
  /** Commit cadence (ms) for the dirty-flush timer; default 60s. */
  flushMs?: number;
}

export class EvidenceCore {
  private readonly ledger: EvidenceLedger;
  private dirty = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly opts: EvidenceCoreOptions) {
    this.ledger = new EvidenceLedger(opts.repo);
    const v = this.ledger.verify();
    opts.log?.info?.(v.ok ? `evidence: ledger intact (${v.count} rows)` : `evidence: ledger BROKEN: ${v.reason}`);
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.opts.flushMs ?? 60_000);
  }

  /** Periodic + on-demand commit of accumulated transitions. */
  flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    commitEvidence(this.opts.repo).catch((e) => this.opts.log?.warn?.(`evidence: commit failed: ${e}`));
  }

  /** The one entry point adapters feed. */
  handle(e: EvidenceEvent): void {
    if (e.phase === "created") {
      this.ledger.emit("dsh/session-created", { session: e.sessionId });
      this.dirty = true;
      return;
    }
    if (e.phase === "disposed") {
      this.ledger.emit("dsh/session-disposed", { session: e.sessionId });
      this.dirty = true;
      this.flush();
      return;
    }
    const t = toTransition({ type: e.type, ...(e.data ?? {}) });
    if (!t) return;
    this.ledger.emit(t.kind, { session: e.sessionId, ...t.payload });
    this.dirty = true;
  }

  verify() {
    return this.ledger.verify();
  }

  close(): void {
    this.flush();
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

