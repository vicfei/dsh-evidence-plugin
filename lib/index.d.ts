import type { Context } from "@deepseek-ai/cordis";
export declare const name = "dsh-evidence-plugin";
export declare const inject: readonly string[];
export interface Config {
    /** Absolute path to the evidence git repo. */
    repo: string;
}
export declare const Config: Config;
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map