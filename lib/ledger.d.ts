export declare const GENESIS: string;
export interface LedgerRow {
    id: number;
    ts: string;
    kind: string;
    payload: string;
    prevHash: string;
    entryHash: string;
}
export declare class EvidenceLedger {
    private readonly file;
    private readonly headFile;
    constructor(root: string);
    head(): string;
    rows(): LedgerRow[];
    /** Append one transition. Called synchronously with the state change it describes. */
    emit(kind: string, payload?: Record<string, unknown>): LedgerRow;
    /** Recompute the whole chain + check the head anchor. Returns the first broken row. */
    verify(): {
        ok: true;
        count: number;
    } | {
        ok: false;
        count: number;
        reason: string;
    };
}
//# sourceMappingURL=ledger.d.ts.map