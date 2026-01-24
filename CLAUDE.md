# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

家計簿ダッシュボード - Google Spreadsheetをデータベースとして活用し、家計の収支を可視化するWebアプリケーションです。

## Architecture

このプロジェクトは **Cloudflare Workers + Vite + React** のフルスタック構成です：

```
┌─────────────────────────────────────┐
│  Frontend (Vite + React)            │
│  - src/App.tsx (React components)   │
│  - src/main.tsx (entry point)       │
└─────────────────────────────────────┘
              ↓ API calls to /api/*
┌─────────────────────────────────────┐
│  Cloudflare Worker (Edge Runtime)   │
│  - worker/index.ts                  │
│  - Handles /api/* routes            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Google Apps Script API             │
│  - Data from Spreadsheet            │
└─────────────────────────────────────┘
```

### Key Points

- **Single deployable unit**: フロントエンドとWorkerは単一のCloudflare Workersプロジェクトとしてデプロイされます
- **Development**: `@cloudflare/vite-plugin` により、Vite開発サーバーがWorkerを統合して動作します
- **Routing**: Worker (`worker/index.ts`) が `/api/*` パスを処理し、それ以外は静的アセットとして配信されます
- **SPA mode**: `wrangler.jsonc` の `not_found_handling: "single-page-application"` により、クライアントサイドルーティングに対応しています

## Common Commands

```bash
# Development server (Vite + Worker統合)
pnpm dev

# Build (TypeScript compile + Vite build)
pnpm build

# Preview built application locally
pnpm preview

# Deploy to Cloudflare Workers
pnpm deploy

# Lint code
pnpm lint

# Generate Cloudflare Worker TypeScript types
pnpm cf-typegen
```

## Environment Setup

1. `.dev.vars.example` を `.dev.vars` にコピー
2. 環境変数を設定:
   - `BASIC_AUTH_USERS`: Basic認証の認証情報（`user:pass` 形式、カンマ区切りで複数指定可）
   - `GAS_API_URL`: デプロイ済みGoogle Apps ScriptのURL

```bash
cp .dev.vars.example .dev.vars
# .dev.vars を編集して実際の値を設定
```

## Data Flow

1. **P/L シート**: 月次の収入・支出を記録（手入力またはPOST API経由、0円も可）
2. **B/S シート**: 初期残高（手入力）、開始月（関数で自動取得）、月ごとの残高（手入力またはPOST API経由）を管理
3. **Google Apps Script**: スプレッドシートデータを集計してJSON APIとして公開
   - カテゴリは出現順を保持（アルファベット順ではない）
   - DateオブジェクトはYYYY-MM形式の文字列に変換
   - 総資産はB/Sシートの残高データを優先表示、未設定の月は初期残高と累積収支から算出
4. **Worker**: GAS APIへのプロキシ（Basic認証付き）、将来的にはキャッシュ層としても機能
5. **Frontend**: データを取得してグラフ表示、モーダルフォームから新規データ追加
   - 選択可能な月は開始月から先々月まで、既存データがない月のみ
   - Date文字列を正規化して処理（GASから返されるDate文字列に対応）
   - すべての入力フィールド（カテゴリ別金額、残高）は必須で初期値は0

## API Design

### GET - データ取得
```
GET /api/
```
monthlyData, yearlyData, categories, settings を含むJSONを返します。

### POST - レコード追加（バッチ対応）および残高更新

複数のトランザクションを一度に追加可能です。また、月ごとの残高も同時に更新できます。

```
POST /api/
{
  "transactions": [
    {
      "month": "2025-01",
      "category": "食費",
      "type": "expense",
      "amount": 3500
    },
    {
      "month": "2025-01",
      "category": "交通費",
      "type": "expense",
      "amount": 5000
    }
  ]
}
```

残高更新は別のリクエストとして送信されます：

```
POST /api/
{
  "balance": {
    "month": "2025-01",
    "balance": 630000
  }
}
```

**注意**: 
- 単一トランザクションの形式（`transactions`配列なし）も後方互換性のためサポートされています
- 金額（`amount`）と残高（`balance`）は0以上の整数で、0円も許可されています

## Project Structure

```
src/
├── App.tsx              # メインアプリ（ダッシュボードUI）
├── api/household.ts     # API呼び出し関数
├── hooks/useHouseholdData.ts  # データ取得フック
├── components/
│   ├── TotalAssetsChart.tsx    # 総資産推移グラフ
│   ├── IncomeExpenseChart.tsx  # 収入・支出比較グラフ
│   ├── CategoryExpenseChart.tsx # カテゴリ別支出グラフ
│   ├── BulkTransactionForm.tsx  # 一括取引入力フォーム（モーダル表示）
│   └── CategoryAmountInput.tsx # カテゴリ別金額入力コンポーネント
└── types/index.ts       # 型定義

worker/
└── index.ts             # Cloudflare Worker（GAS APIプロキシ）

gas/
└── Code.gs              # Google Apps Script
```

## Deployment

`pnpm deploy` により以下が実行されます：
1. TypeScript のビルド
2. Vite による静的アセットのバンドル
3. Wrangler によるCloudflare Workersへのデプロイ

デプロイ先は `wrangler.jsonc` の `name: "expenses"` で指定されたWorker名になります。

## 実装の詳細

### フォーム入力の制限

- **選択可能な月の計算**: `App.tsx`の`selectableMonths`で、開始月から先々月までの範囲で、既存データがない月のみを選択可能にしています
- **モーダル表示**: フォームはモーダルで表示され、ヘッダーの「入力」ボタンで開閉します（選択可能な月がない場合はボタン非表示）
- **一括入力**: `BulkTransactionForm`コンポーネントで、複数のカテゴリを一度に入力可能です
- **必須フィールド**: すべての入力フィールド（カテゴリ別金額、残高）は必須項目で、初期値は0です
- **0円の許可**: 金額と残高は0円以上で、0円のレコードも追加可能です
- **残高入力**: 月ごとの残高もフォームから入力・更新できます

### Date文字列の正規化

Google Apps Scriptから返されるDateオブジェクトが文字列化される場合があるため、`App.tsx`の`normalizeMonth`関数で正規化処理を行っています：

- `YYYY-MM`形式の場合はそのまま返す
- Date文字列（`'Mon Sep 01 2025...'`形式など）の場合は`new Date()`でパースして`YYYY-MM`形式に変換
- `monthlyData`の各`month`フィールドと`settings.startMonth`の両方を正規化

### カテゴリ順序の保持

`gas/Code.gs`の`extractCategoriesByType`関数で、カテゴリはアルファベット順ではなく、スプレッドシートでの出現順を保持します。これにより、ユーザーが入力した順序でカテゴリが表示されます。

### 残高管理と総資産計算

- **B/Sシートの構造**: B/Sシートには初期残高、開始月、および月ごとの残高が記録されます
- **残高の優先表示**: `aggregateMonthlyData`関数で、B/Sシートに残高が設定されている月はその残高を直接使用します
- **自動計算**: 残高が設定されていない月は、初期残高と累積収支から自動計算されます
- **残高の更新**: フロントエンドの入力フォームから残高を追加・更新できます
