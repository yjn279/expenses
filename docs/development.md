# 開発ガイド

## ディレクトリ構成

```
expenses/
├── public/
├── src/
│   ├── api/
│   │   └── household.ts            # API クライアント
│   ├── components/
│   │   ├── TotalAssetsChart.tsx    # 総資産推移グラフ
│   │   ├── IncomeExpenseChart.tsx  # 収支・利益グラフ
│   │   ├── CategoryExpenseChart.tsx # カテゴリ別支出グラフ
│   │   ├── BulkTransactionForm.tsx  # 一括取引入力フォーム
│   │   └── CategoryAmountInput.tsx   # カテゴリ別金額入力コンポーネント
│   ├── hooks/
│   │   └── useHouseholdData.ts     # データ取得フック
│   ├── types/
│   │   └── index.ts                # 型定義
│   ├── utils/
│   │   ├── format.ts               # フォーマット関数
│   │   ├── month.ts                # 月関連のユーティリティ
│   │   └── typeGuards.ts           # 型ガード
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── worker/
│   └── index.ts                    # Cloudflare Worker
├── gas/
│   └── Code.gs                     # Google Apps Script
├── .dev.vars
├── .dev.vars.example
├── package.json
├── vite.config.ts
└── wrangler.jsonc
```

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

## テスト戦略

### 方針

[t_wadaのTDDアプローチ](https://speakerdeck.com/twada/working-with-legacy-code-the-true-record)に基づき、以下の方針でテストを構築します。

- テストは**開発支援ツール**として活用（品質保証は実装自体の課題）
- **リクエスト/レスポンスレベル**でテストし、実装詳細への依存を避ける
- 粗いテストから始め、段階的に精度を上げる

### テストレベル

| レベル | 対象 | 優先度 |
|-------|------|--------|
| 統合テスト | Worker API（`/api/`） | 高 |
| ユニットテスト | バリデーション、データ変換 | 高 |
| コンポーネントテスト | Reactコンポーネント | 低（必要時） |

### テスト実行

```bash
# ユニットテスト・統合テスト
pnpm test

# ウォッチモード
pnpm test:watch

# カバレッジ
pnpm test:coverage
```

### TDDサイクル

新機能追加・バグ修正時は以下のサイクルで進めます：

1. **Red**: 失敗するテストを先に書く
2. **Green**: テストが通る最小限の実装
3. **Refactor**: コードを整理（テストが通ることを確認しながら）

## 開発時の注意点

### 環境変数

- `.dev.vars` ファイルは `.gitignore` に含まれているため、コミットされません
- 本番環境では `wrangler secret put` を使用して環境変数を設定します

### TypeScript型定義

- 型定義は `src/types/index.ts` に集約されています
- Cloudflare Workerの型定義は `pnpm cf-typegen` で生成されます

### コードスタイル

- ESLintを使用してコードスタイルを統一
- `pnpm lint` でリントを実行

### デプロイ

- `pnpm deploy` でCloudflare Workersにデプロイ
- デプロイ前に `pnpm build` でビルドが成功することを確認
