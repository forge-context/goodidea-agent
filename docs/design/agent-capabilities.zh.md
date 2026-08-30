# Agent 能力：每一项在哪里，边界划在哪里

[English](agent-capabilities.md) | [日本語](agent-capabilities.ja.md) | [中文](agent-capabilities.zh.md)

这是 GoodIdea 的 Agent 由什么构成的地图。每一行说明一项能力、实现它的代码、防止它越界的约束，以及目前做到哪一步。新增能力就是新增一行。

贯穿整张表的主题：**模型负责语言，代码保留权限。** 下面每一条边界都在回答同一个问题——模型出错时会发生什么。

## 能力

| 能力 | 位置 | 边界 | 现状 |
| --- | --- | --- | --- |
| 模型调用 | [`model/adapter.py`](../../src/goodidea_agent/model/adapter.py)、[`openai_compatible.py`](../../src/goodidea_agent/model/openai_compatible.py) | 一个供应商中立的端口。厂商特有的写法留在适配器内部，换供应商是改配置。错误映射到封闭集合，且不携带上游返回体。 | 已实装 |
| 结构化输出 | [`model/structured.py`](../../src/goodidea_agent/model/structured.py) | 要 JSON，在本地用 Pydantic 校验，失败修复一次。不依赖任何厂商专有的 Schema 功能，因此换供应商不会削弱契约。 | 已实装 |
| 理解想法 | [`model/interpreter.py`](../../src/goodidea_agent/model/interpreter.py) | 场景是封闭集合：模型只在已实现的路径之间路由，不能发明路径。判为不支持时必须说明产品目前做不到什么。 | 已实装 |
| Web 检索 | [`tools/web_search.py`](../../src/goodidea_agent/tools/web_search.py) | 模型写检索式，workflow 负责发出。单条查询无结果是常态；整体不可用才停止这一步。 | 已实装 |
| 证据分级 | [`workflow/evidence.py`](../../src/goodidea_agent/workflow/evidence.py) | 可信度由 URL 判定，不由页面判定，也不由模型判定。无法承担署名的页面不会成为来源。 | 已实装 |
| 撰写回答 | [`model/composer.py`](../../src/goodidea_agent/model/composer.py) | 每条结论必须引用已留存的来源。引用清单之外的内容会被退回修正，仍不合格则拒绝采用。 | 已实装 |
| 读取用户 | [`model/answer_reader.py`](../../src/goodidea_agent/model/answer_reader.py) | 没有做出选择的同意，在到达模型之前就被拦下。模型无法判定的回答不记录任何东西。 | 已实装 |
| 产品边界 | [`model/proposer.py`](../../src/goodidea_agent/model/proposer.py) | 用户的决定是既定输入，不重新讨论。同一项出现在边界两侧会被拒绝。生成提案不构成批准。 | 已实装 |
| 人类权限 | [`workflow/guidance.py`](../../src/goodidea_agent/workflow/guidance.py)、[`domain/state.py`](../../src/goodidea_agent/domain/state.py) | 只有用户批准了那一份提案，交接包才存在。外部副作用在类型层面恒为 `False`。 | 已实装 |
| 记忆：事实层 | [`memory/sqlite.py`](../../src/goodidea_agent/memory/sqlite.py) | 证据、决定、批准只由 workflow 转移写入。模型没有任何路径可以修改它们。 | 已实装 |
| 记忆：用户层 | [`memory/working.py`](../../src/goodidea_agent/memory/working.py)、[`model/note_taker.py`](../../src/goodidea_agent/model/note_taker.py) | 模型可以提议记录用户说过的话，用户可以撤回。笔记没有来源，因此能影响下一个问题，但永远不能变成被引用的事实。 | 已实装 |
| 沙箱：预览 | [`tools/sandbox.py`](../../src/goodidea_agent/tools/sandbox.py) | 禁止脚本、网络和持久化，只使用模拟数据。 | 已实装 |
| 沙箱：执行 | [`tools/sandbox_exec.py`](../../src/goodidea_agent/tools/sandbox_exec.py)、[`model/sandbox_author.py`](../../src/goodidea_agent/model/sandbox_author.py) | 每次运行都带着它要回答的问题，并声明它没有回答什么。容器不给网络、只读文件系统、无任何 capability，并限制内存、进程数和时间。无法启动容器时拒绝运行，而不是用更弱的隔离代替。两次运行结果不一致，就等于什么都没有确定。 | 已实装 |
| 评估 | [`evaluation/offline.py`](../../src/goodidea_agent/evaluation/offline.py)、[`model_output.py`](../../src/goodidea_agent/evaluation/model_output.py) | 状态迁移做确定性检查。真实录制的模型文本被回放并按产品规则检查，无需 key 也无需网络。 | 已实装 |

## 决定其余一切的三个选择

**模型不掌握工具。** 它写检索式，workflow 负责发出。这是与常见 tool-calling Agent 最明显的分歧，而且是刻意的：一个要在正确位置停下来的产品，不能同时让模型自己决定查几次、什么时候算查够了。代价是真实存在的——Agent 无法自主追查一条意外线索。如果日后评估显示固定调研确实漏掉了自由 Agent 能找到的东西，工具调用应该放在调研接口之后，而不是散落进 workflow。

**模型不能写事实层。** 存在两套记忆只有一个原因：用户对自己的描述可以修改，产品对外断言的事实不可以。放进同一个存储，早晚会有一句有说服力的话变成引用。

**模型不能批准自己的产出。** 生成提案不产生批准、不产生交接包、也不推进状态。反复的同意永远不会累积成确定性。这正是这个产品的全部主张——鼓励行动，但不假装未经验证的想法是安全的——它被写成类型约束，而不是写在 prompt 里。

## 尚未实装

子 Agent、长任务规划、上下文卸载都没有实装。当前的调研任务只需要为一个决定取得足够的证据，这三者今天都不会让答案更好。等到有可量化的缺口需要它们时，再作为新的行加进这张表。
