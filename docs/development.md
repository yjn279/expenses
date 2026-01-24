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
│   ├── constants/
│   │   └── chartColors.ts          # チャートカラーパレット定義
│   ├── hooks/
│   │   └── useHouseholdData.ts     # データ取得フック
│   ├── types/
│   │   └── index.ts                # 型定義
│   ├── utils/
│   │   ├── format.ts               # フォーマット関数
│   │   ├── format.test.ts          # フォーマット関数のテスト
│   │   ├── month.ts                # 月関連のユーティリティ
│   │   ├── month.test.ts           # 月関連ユーティリティのテスト
│   │   ├── typeGuards.ts           # 型ガード
│   │   └── typeGuards.test.ts      # 型ガードのテスト
│   ├── App.tsx
│   ├── index.css                   # グローバルスタイル（Tailwind + グラスモーフィズム）
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
- **Plain Old Object（POO）のテスト**: フレームワークに依存しない純粋関数のテストを優先（高速で決定性が高い）

### テストレベル

| レベル | 対象 | 優先度 | 実装状況 |
|-------|------|--------|----------|
| ユニットテスト | ユーティリティ関数（`src/utils/`） | 高 | ✅ 実装済み |
| 統合テスト | Worker API（`/api/`） | 高 | 未実装 |
| コンポーネントテスト | Reactコンポーネント | 低（必要時） | 未実装 |

### 実装済みテスト

#### ユーティリティ関数のテスト

以下のユーティリティ関数に対してテストが実装されています：

- **`src/utils/month.ts`** - `normalizeMonth`関数
  - YYYY-MM形式の正規化
  - Date文字列のパース
  - 無効な入力の処理
  - エッジケース（空文字列、ISO形式など）

- **`src/utils/format.ts`** - `formatCurrency`、`formatAxisLabel`関数
  - 通貨フォーマット（正の値、負の値、ゼロ、大きな値）
  - 軸ラベルフォーマット（億単位、万単位、千単位未満、負の値）

- **`src/utils/typeGuards.ts`** - 型ガード関数
  - `isMonthlyData`、`isYearlyData`、`isNumber`、`isString`
  - 正しい型と間違った型の判定
  - エッジケース（null、undefinedなど）

テストファイルは各ユーティリティファイルと同じディレクトリに配置され、`.test.ts`拡張子を使用しています。

### テスト実行

```bash
# ユニットテスト・統合テスト
pnpm test

# UIモード（ブラウザでテスト結果を確認）
pnpm test:ui

# ウォッチモード（ファイル変更を監視して自動実行）
pnpm test:watch

# カバレッジレポート
pnpm test:coverage
```

### テストフレームワーク

- **Vitest**: Viteベースの高速なテストランナー
- **設定**: `vite.config.ts`にテスト設定を含む
- **環境**: Node.js環境で実行（Cloudflareプラグインはテスト時には無効化）

### TDDサイクル

新機能追加・バグ修正時は以下のサイクルで進めます：

1. **Red**: 失敗するテストを先に書く
2. **Green**: テストが通る最小限の実装
3. **Refactor**: コードを整理（テストが通ることを確認しながら）

### テストの品質基準

t_wada流の原則に従い、以下の基準を満たすテストを書きます：

- **決定性（Deterministic）**: ランダム性や時間依存性がない
- **高速性（Fast）**: Plain Old Objectのテストなので非常に高速
- **独立性（Independent）**: テスト間で状態を共有しない
- **明確性（Clear）**: テスト名で何をテストしているか明確
- **保守性（Maintainable）**: 実装の詳細に依存しない

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

### デザインシステム

#### カラーパレットの統一

すべてのチャートコンポーネントは `src/constants/chartColors.ts` で定義された統一カラーパレットを使用します。

**使用方法:**

```typescript
import { PRIMARY_CHART_COLOR, DUAL_PALETTE, GRADIENT_PALETTE } from '@/constants/chartColors';

// 単一系列チャート（総資産推移など）
<Area stroke={PRIMARY_CHART_COLOR} />

// 2色チャート（収支推移など）
<Bar fill={DUAL_PALETTE.positive} />  // 収入
<Bar fill={DUAL_PALETTE.negative} />  // 支出
<Line stroke={DUAL_PALETTE.neutral} /> // 収支

// マルチカテゴリチャート（カテゴリ別支出など）
{categories.map((category, index) => (
  <Area fill={GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]} />
))}
```

**カラーパレット変更時の注意:**
- `chartColors.ts` のみを更新すればすべてのチャートに反映されます
- 新しい色を追加する場合は、デザインコンセプト「陽だまりの窓」との調和を考慮してください

#### グラスモーフィズム

`src/index.css` で定義されたグラスモーフィズムクラスを使用:

- `.glass-card`: チャートカードやモーダルコンテナ
- `.glass-header`: ページヘッダー
- `.glass`: 汎用グラス効果

**カスタマイズ:**
- `backdrop-filter` の blur 値を調整して透明度を変更
- `background` のグラデーションで色合いを調整
- `box-shadow` で浮遊感を調整

#### チャートコンポーネントの設計原則

新しいチャートコンポーネントを追加する際は、以下の原則に従ってください:

1. **カラーパレットの統一**: `chartColors.ts` から色をインポート
2. **Tooltipのglass効果**: 統一されたTooltip contentStyleを使用
3. **視覚的調整**: strokeWidth 2.5、grid opacity 0.4
4. **型安全性**: 型ガード関数を使用してデータの妥当性を検証

### デプロイ

- `pnpm deploy` でCloudflare Workersにデプロイ
- デプロイ前に `pnpm build` でビルドが成功することを確認
