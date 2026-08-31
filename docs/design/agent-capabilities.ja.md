# Agent の能力：どこにあり、境界はどこか

[English](agent-capabilities.md) | [日本語](agent-capabilities.ja.md) | [中文](agent-capabilities.zh.md)

GoodIdea の Agent が何でできているかの地図です。各行は、能力、それを実装する Code、越境を防ぐ境界、そして現在どこまで作られているかを示します。新しい能力は新しい行になります。

表全体を貫く主題：**言語の仕事は Model が行い、権限は Code が持つ。** 以下の境界はすべて「Model が間違えたとき何が起きるか」への答えです。

## 能力

| 能力 | 場所 | 境界 | 状態 |
| --- | --- | --- | --- |
| Model 呼び出し | [`model/adapter.py`](../../src/goodidea_agent/model/adapter.py)、[`openai_compatible.py`](../../src/goodidea_agent/model/openai_compatible.py) | Provider 非依存の Port が一つ。Provider 固有の事情は Adapter の内側に留まるため、交換は設定変更で済む。Error は閉じた集合に対応づけられ、上流の Body を持ち出さない。 | 実装済み |
| 構造化出力 | [`model/structured.py`](../../src/goodidea_agent/model/structured.py) | JSON を要求し、Pydantic Schema でこちら側が検証し、一度だけ修復する。Provider 固有の Schema 機能に依存しないので、Provider を替えても契約は弱くならない。 | 実装済み |
| アイデアの理解 | [`model/interpreter.py`](../../src/goodidea_agent/model/interpreter.py) | Scenario は閉じた集合で、Model は既存の Path を選ぶだけで新設はできない。対象外と判断した場合は、この Product が今できないことを述べる必要がある。 | 実装済み |
| Web 検索 | [`tools/web_search.py`](../../src/goodidea_agent/tools/web_search.py) | Query は Model が書き、発行は Workflow が行う。1 件の Query が空になるのは通常のことで、全体の停止だけが Step を止める。 | 実装済み |
| 根拠の格付け | [`workflow/evidence.py`](../../src/goodidea_agent/workflow/evidence.py) | 信頼度は URL から決まる。Page 自身でも Model でもない。帰属を持てない Page は Source にならない。 | 実装済み |
| 回答の執筆 | [`model/composer.py`](../../src/goodidea_agent/model/composer.py) | すべての主張は保持済み Source を引用しなければならない。それ以外を引用した回答は差し戻され、直らなければ採用しない。 | 実装済み |
| 利用者を読む | [`model/answer_reader.py`](../../src/goodidea_agent/model/answer_reader.py) | 選択を伴わない同意は Model に届く前に止まる。Model が判断できない回答は何も記録しない。 | 実装済み |
| Product 境界 | [`model/proposer.py`](../../src/goodidea_agent/model/proposer.py) | 利用者の判断は確定した入力であり、蒸し返さない。境界の両側に同じ項目があれば拒否する。提案の生成は承認ではない。 | 実装済み |
| 人の権限 | [`workflow/guidance.py`](../../src/goodidea_agent/workflow/guidance.py)、[`domain/state.py`](../../src/goodidea_agent/domain/state.py) | まさにその提案を利用者が承認したときだけ Handoff が存在する。外部への副作用は型のレベルで `False`。 | 実装済み |
| Memory：記録 | [`memory/sqlite.py`](../../src/goodidea_agent/memory/sqlite.py) | 根拠・判断・承認は Workflow の遷移だけが書く。Model からの経路は存在しない。 | 実装済み |
| Memory：人 | [`memory/working.py`](../../src/goodidea_agent/memory/working.py)、[`model/note_taker.py`](../../src/goodidea_agent/model/note_taker.py) | 利用者が語ったことについて Model は Note を提案でき、利用者は撤回できる。Note に Source は無いので、次の問いには影響できても引用された事実にはならない。 | 実装済み |
| Sandbox：Preview | [`tools/sandbox.py`](../../src/goodidea_agent/tools/sandbox.py) | Script も Network も Storage も無く、Mock Data のみ。 | 実装済み |
| Sandbox：実行 | [`tools/sandbox_exec.py`](../../src/goodidea_agent/tools/sandbox_exec.py)、[`model/sandbox_author.py`](../../src/goodidea_agent/model/sandbox_author.py) | 実行は「何を確かめるか」を伴い、「何は分からないか」も述べます。Container に Network は無く、File System は読み取り専用、Capability は全て外し、Memory・Process 数・時間に上限を置きます。Container を起動できない環境では、弱い隔離で代替せず実行を拒否します。二回の実行が食い違えば、何も確定していません。 | 実装済み |
| Evaluation | [`evaluation/offline.py`](../../src/goodidea_agent/evaluation/offline.py)、[`model_output.py`](../../src/goodidea_agent/evaluation/model_output.py) | 状態遷移は決定的に検査する。記録した実際の Model 出力を再生し、Key も Network も無しで Product 規則に照らして検査する。 | 実装済み |

LP には別の記録があります。[LP Visual System](lp-visual-system.ja.md) が First View、Motion、Layout の制約を扱います。

## 残りを決めた三つの選択

**Model は Tool を持たない。** Query は Model が書き、発行は Workflow が行います。一般的な Tool-calling Agent との最も目立つ違いであり、意図的なものです。正しい場所で止まる Product が、同時に「何回調べるか」「もう十分か」を Model に決めさせることはできません。代償は実在します。予想外の手がかりを Agent が自力で追えません。固定的な Research が自由な Agent なら見つけるものを取り逃していると Evaluation が示したときは、Tool 呼び出しは Research Interface の内側に置くべきで、Workflow 全体に散らすべきではありません。

**Model は記録を書けません。** Memory が二つある理由は一つです。利用者が自分について語ったことは訂正できるが、Product が主張する事実は訂正で済ませられません。同じ Store に置けば、いずれ説得力のある一文が引用に変わります。

**Model は自分の成果物を承認できません。** 提案を生成しても、承認も Handoff も状態の前進も生じません。同意の反復が確実性に変わることもありません。これはこの Product の主張そのもの——行動を後押しするが、未検証のアイデアが安全であるかのようには扱わない——を、Prompt ではなく型の制約として書いたものです。

## 未実装

Sub-agent、長期計画、Context の退避は実装していません。現在の Research が必要とするのは、一つの判断に足る最小限の根拠であり、今日この三つがその答えを良くすることはありません。測定可能な不足が現れたときに、この表の行として加えます。
