// EvidenceCore — the harness-agnostic evidence engine (v0.3 P1, EventSource seam).
// Receives normalized session events, appends hash-chained transitions to the ledger,
// and owns the dirty-tracking/flush cycle. Knows nothing about Cordis or OAR — adapters
// normalize their host's stream into EvidenceEvents.
import { EvidenceLedger } from "./ledger.js";
import { toTransition } from "./entry.js";
import { commitEvidence } from "./git.js";
export class EvidenceCore {
    opts;
    ledger;
    dirty = false;
    timer = null;
    constructor(opts) {
        this.opts = opts;
        this.ledger = new EvidenceLedger(opts.repo);
        const v = this.ledger.verify();
        opts.log?.info?.(v.ok ? `evidence: ledger intact (${v.count} rows)` : `evidence: ledger BROKEN: ${v.reason}`);
        this.startFlushTimer();
    }
    startFlushTimer() {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.flush(), this.opts.flushMs ?? 60_000);
    }
    /** Periodic + on-demand commit of accumulated transitions. */
    flush() {
        if (!this.dirty)
            return;
        this.dirty = false;
        commitEvidence(this.opts.repo).catch((e) => this.opts.log?.warn?.(`evidence: commit failed: ${e}`));
    }
    /** The one entry point adapters feed. */
    handle(e) {
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
        if (!t)
            return;
        this.ledger.emit(t.kind, { session: e.sessionId, ...t.payload });
        this.dirty = true;
    }
    verify() {
        return this.ledger.verify();
    }
    close() {
        this.flush();
        if (this.timer)
            clearInterval(this.timer);
        this.timer = null;
    }
}
//# sourceMappingURL=core.js.map