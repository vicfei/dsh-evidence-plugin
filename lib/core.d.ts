export interface EvidenceEvent {
    sessionId: string;
    phase: "created" | "event" | "disposed";
    /** The harness event type (e.g. "turn/end"); adapters may pass raw events for mapping. */
    type?: string;
    data?: Record<string, unknown>;
}
export interface EvidenceCoreOptions {
    repo: string;
    log?: {
        info?: (m: string) => void;
        warn?: (m: string) => void;
    };
    /** Commit cadence (ms) for the dirty-flush timer; default 60s. */
    flushMs?: number;
}
export declare class EvidenceCore {
    private readonly opts;
    private readonly ledger;
    private dirty;
    private timer;
    constructor(opts: EvidenceCoreOptions);
    private startFlushTimer;
    /** Periodic + on-demand commit of accumulated transitions. */
    flush(): void;
    /** The one entry point adapters feed. */
    handle(e: EvidenceEvent): void;
    verify(): {
        ok: true;
        count: number;
    } | {
        ok: false;
        count: number;
        reason: string;
    };
    close(): void;
}
//# sourceMappingURL=core.d.ts.map