# DeepSeek Harness 证据账本

**每次会话转换都落进你自己 git 仓里的哈希链账本——只追加、可验证。**

把 [dsh-super-agent](https://github.com/vicfei/dsh-super-agent) v1.5 的证据账本移植进官方 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：信任不是主张，是一条你能验证的链。

```text
evidence/ledger.jsonl   每次转换一行 JSON：{ id, ts, kind, payload, prevHash, entryHash }
evidence/head           最后一个 entryHash（截尾锚）
```

`entryHash = sha256(kind ⟟ payload ⟟ prevHash)`，创世值为 64 个零。改任何一行链即断；截掉尾部则锚即报。链的承诺是：没有*静默*的部分篡改。

与可变工作状态层（如 LoopX）互补：他们 carry the work，这里让发生过的事不可抵赖。

## 安装

插件市场，或 `dsh plugin add vicfei/dsh-evidence-plugin`。

## 配置

| 项 | 含义 | 默认 |
|---|---|---|
| `repo` | 证据 git 仓绝对路径 | —（为空停用） |
| `commitEvery` | 自动提交节奏提示 | `50` |

## 维护者验证清单

1. 以 `@deepseek-ai/dsh` 生成目录核对 `session/event`、`agent/*` 签名——缝隙在 `src/entry.ts`；
2. Node ≥22.22.3 真机会话冒烟；随后 npm 发布 + dsh-plugin.org 收录。

MIT
