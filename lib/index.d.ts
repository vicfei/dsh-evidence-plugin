import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
export declare const name = "dsh-evidence-plugin";
export declare const inject: readonly string[];
export declare const Config: Schema<Schemastery.ObjectS<NoInfer<{
    repo: Schema<string, string, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    repo: Schema<string, string, "defined">;
}>>, "plain">;
export interface Config {
    repo: string;
}
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map