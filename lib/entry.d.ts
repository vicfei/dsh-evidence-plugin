export interface Transition {
    kind: string;
    payload: Record<string, unknown>;
}
export declare function toTransition(ev: Record<string, unknown>): Transition | null;
//# sourceMappingURL=entry.d.ts.map