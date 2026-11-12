import type { Context } from "@deepseek-ai/cordis";
export declare const name = "dsh-evidence-plugin";
export declare const inject: string[];
export interface Config {
    /** Absolute path to the evidence git repo. */
    repo: string;
    /** Commit after every N transitions (0 = no auto-commit). */
    commitEvery: number;
}
export declare const Config: Config;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map