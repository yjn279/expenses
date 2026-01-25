# 家計簿ダッシュボード

Google Spreadsheet をデータベースとして活用し、家計の収支を可視化するWebアプリケーションです。

## サービス概要

日々の収支をスプレッドシートに記録するだけで、資産推移や支出傾向を自動でグラフ化します。複雑なアプリを使わず、慣れ親しんだスプレッドシートで家計管理を行いたい方に最適です。

### 主な機能

- 総資産額の推移を面グラフで表示
- 月ごとの収入・支出を正負の棒グラフ、利益を折れ線グラフで表示
- 支出のカテゴリ別内訳を積み上げ面グラフで表示
- 月別 / 年別の表示切り替え
- フロントエンドから収支データを直接入力
- **PWA対応**: オフライン動作、ホーム画面へのインストール、スタンドアロンモードでの表示

## クイックスタート

### 前提条件

- Node.js 18以上
- pnpm
- Googleアカウント（スプレッドシート作成用）

### セットアップ

1. リポジトリをクローン
   ```bash
   git clone <repository-url>
   cd expenses
   ```

2. 依存パッケージのインストール
   ```bash
   pnpm install
   ```

3. 環境変数の設定
   ```bash
   cp .dev.vars.example .dev.vars
   # .dev.vars を編集して実際の値を設定
   ```

4. 開発サーバーの起動
   ```bash
   pnpm dev
   ```

詳細なセットアップ手順は [docs/setup.md](./docs/setup.md) を参照してください。

## ドキュメント

- [要件定義](./docs/requirements.md) - 機能要件・非機能要件
- [アーキテクチャ](./docs/architecture.md) - システム設計、データフロー
- [API仕様](./docs/api.md) - API設計の詳細
- [セットアップガイド](./docs/setup.md) - 詳細なセットアップ手順
- [運用ガイド](./docs/usage.md) - データ入力方法、運用方法
- [開発ガイド](./docs/development.md) - 実装詳細、テスト戦略

## 技術スタック

| 領域 | 技術 |
|------|------|
| データストア | Google Spreadsheet |
| API | Google Apps Script (ES6) |
| エッジランタイム | Cloudflare Workers |
| フロントエンド | Vite + React + TypeScript |
| グラフ描画 | Recharts |
| PWA | vite-plugin-pwa (Workbox) |

## ライセンス

MIT
