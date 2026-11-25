import type { EvidenceCore } from "../core.js";
export interface OarEvent {
    seq?: number;
    agentPath?: unknown;
    kind?: string;
    text?: string;
    tool?: string;
    outcome?: string;
    [key: string]: unknown;
}
export interface OarSessionLike {
    events(callback: (ev: OarEvent) => void): unknown;
}
export interface AttachOarOptions {
    sessionId?: string;
}
/** Attach an OAR session to an EvidenceCore. Returns an unsubscribe handle. */
export declare function attachOar(session: OarSessionLike, core: EvidenceCore, opts?: AttachOarOptions): () => void;
//# sourceMappingURL=oar.d.ts.map