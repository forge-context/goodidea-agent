# Vertical Slice 02: 人の判断から Coding Handoff まで

[English](vertical-slice-02.md) | [日本語](vertical-slice-02.ja.md) | [中文](vertical-slice-02.zh.md)

Status: Offline Contract 実装済み

## 目的

最初の人の判断から再開し、制約付きの実現可能性 Path、MVP 境界の提案を作り、利用者がその提案を承認した場合だけ Coding Agent への引き渡しを作れることを証明する。

## 必須 Flow

1. 曖昧な同意では Product Path を選択しない。
2. 明示された Strategy Source だけを `decided_by=user` として保存する。
3. 選択された Path から実現可能性 Artifact と MVP 提案を作る。
4. 提案では Included、Excluded、前提、User Flow、Acceptance Criteria を分ける。
5. 修正要求では未承認のままにし、Handoff を作らない。
6. 人の承認を Proposal ID に結び付ける。
7. その後だけ Coding Handoff を作り、Stage を `handoff` にする。

## 安全境界

どちらの自動売買 Path も実資金注文と収益保証を禁止する。実行 Path は利用者が用意した一つのルールと Paper Order だけを扱う。探索 Path は固定された透明な候補だけを比較し、戦略を推奨しない。

## Acceptance Criteria

- 根拠、Product 判断、未解決の問い、承認を別々に扱う。
- SQLite から完全な結果を復元し、現在の判断と承認を照会できる。
- API は順序を飛ばした遷移を拒否する。
- Handoff は Acceptance Criteria、Evidence ID、制約、人の承認を保持する。
- 外部への副作用は無効のままである。
- 英語、日本語、中国語で同じ意味の Stage と境界を作る。

## 公開 Demo の境界

LP Demo は同じ Flow を Browser 内の固定データで再現する。明確に固定 Demo と表示し、API、Tavily、LLM、Broker、Coding Agent を呼ばない。
