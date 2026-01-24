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

## Data Flow

1. **transactions シート**: 月・カテゴリ・金額を記録（手入力またはPOST API経由）
2. **settings シート**: 初期残高（手入力）と開始月（関数で自動取得）を管理
3. **Google Apps Script**: スプレッドシートデータを集計してJSON APIとして公開
4. **Worker**: GAS APIへのプロキシ、将来的にはキャッシュ層としても機能
5. **Frontend**: データを取得してグラフ表示、フォームから新規データ追加

## API Design

### GET - データ取得
```
GET /api/
```
monthlyData, yearlyData, categories, settings を含むJSONを返します。

### POST - レコード追加
```
POST /api/
{
  "month": "2025-01",
  "category": "食費",
  "type": "expense",
  "amount": 3500
}
```

## Implementation Status

現在のコードはCloudflare Workersのボイラープレート状態です：
- Worker (`worker/index.ts`): `/api/` に対して `{name: "Cloudflare"}` を返すサンプル実装
- Frontend (`src/App.tsx`): カウンターとAPI呼び出しのデモUI

次の実装が必要です：
1. Google Apps Scriptの実装とデプロイ
2. Workerに GAS API プロキシ機能を追加
3. Recharts を使ったグラフコンポーネント（TotalAssetsChart, IncomeExpenseChart, CategoryExpenseChart）
4. TransactionForm コンポーネント
5. データ取得カスタムフック（useHouseholdData）

## Deployment

`pnpm deploy` により以下が実行されます：
1. TypeScript のビルド
2. Vite による静的アセットのバンドル
3. Wrangler によるCloudflare Workersへのデプロイ

デプロイ先は `wrangler.jsonc` の `name: "expenses"` で指定されたWorker名になります。
