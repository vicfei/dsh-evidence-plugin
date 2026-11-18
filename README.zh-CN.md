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

插件市场，或 `dsh plugin --profile web add dsh-evidence-plugin`。

**部署注意事项**（真机踩坑得来）：

- web 应用跑在 **web profile** 上——直接 `dsh plugin add` 装进 `default`，永远不加载。用 `--profile web`（或在 web UI 的插件市场里装）；
- 3080 端口常被占用，用 `dsh web --port <n>` 起服务；
- Node ≥ 22.22.3 / 24（harness 自身的 engines 下限）。

## 配置

| 项 | 含义 | 默认 |
|---|---|---|
| `repo` | 证据 git 仓绝对路径 | —（为空停用） |
| `commitEvery` | 自动提交节奏提示 | `50` |

## 维护者验证清单

1. ~~`session/event`、`agent/*` 签名核对~~ **2026-11-12 已解决**：`inject: []`、两参 `(session, event)` handler、schemastery `Schema.object` Config、`dsh.bundle` manifest；headless 启动零告警激活。
2. ~~真机冒烟~~ **2026-11-18 通过**（win11，真实 web 会话）：126 行链验证完好，3 次自动提交落地。踩坑记录见上文部署注意事项。

MIT
