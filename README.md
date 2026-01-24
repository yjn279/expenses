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

## 要件定義

### 機能要件

|ID  |要件             |詳細                               |
|----|---------------|---------------------------------|
|F-01|総資産推移の表示       |初期残高と累積収支から算出した総資産を時系列で表示（面グラフ）   |
|F-02|収支・利益の表示       |収入（正の棒）、支出（負の棒）、利益（折れ線）を同一グラフに表示 |
|F-03|カテゴリ別支出の表示     |**支出のみ**をカテゴリごとに色分けした積み上げ面グラフで表示  |
|F-04|表示期間の切り替え      |月別表示と年別表示をボタンで切り替え可能             |
|F-05|デフォルト表示期間      |**直近12ヶ月**（月別）/ **直近5年**（年別）をデフォルト表示|
|F-06|データ入力（スプレッドシート）|Google Spreadsheet に月・カテゴリ・金額を手入力|
|F-07|データ入力（フロントエンド） |画面上のフォームから月・種別・カテゴリ・金額を入力し**追加のみ**可能（編集・削除はスプシで直接行う）|
|F-08|Basic認証         |URLへのアクセスにBasic認証を要求。家族等複数ユーザー対応 |

### 非機能要件

|ID   |要件     |詳細                              |
|-----|-------|--------------------------------|
|NF-01|可用性   |Google Spreadsheet / GAS の可用性に依存|
|NF-02|保守性   |スプレッドシートのみでデータ管理可能、DB不要         |
|NF-03|拡張性   |カテゴリは選択式（既存カテゴリから選択 + 新規追加）、マスタ管理不要|
|NF-04|セキュリティ|Basic認証によるアクセス制限。認証情報はCloudflare環境変数で管理|

### 認証設計

```
┌─────────────────────────────────────┐
│  Cloudflare Worker                  │
│  ┌───────────────────────────────┐  │
│  │  Basic認証ミドルウェア          │  │
│  │  - 環境変数: BASIC_AUTH_USERS  │  │
│  │  - 形式: user1:pass1,user2:pass2 │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

- 認証情報は `wrangler secret` で設定
- 未認証アクセスは 401 Unauthorized を返却
- 複数ユーザー（家族など）に対応可能

### エラーハンドリング

|状況         |挙動                                |
|------------|----------------------------------|
|GAS API通信失敗|エラーメッセージを表示し、リトライボタンを提供      |
|認証失敗      |401を返却、ブラウザの認証ダイアログを表示       |
|無効なデータ入力 |フォームバリデーションでブロック、エラーメッセージ表示|

## 設計

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Spreadsheet                       │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │         P/L         │    │         B/S         │        │
│  │  月次収入・支出データ  │    │  初期残高・開始月     │        │
│  └─────────────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌─────────────────────────────────────────────────────────────┐
│                  Google Apps Script                         │
│              Webアプリとしてデプロイ                          │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ fetch (server-to-server)
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Worker                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Basic認証     │─▶│  /api/* 処理  │─▶│  GAS プロキシ  │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│              静的アセット配信（それ以外のパス）                │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React SPA)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               入力フォーム                             │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │  総資産推移    │ │  収支・利益    │ │ カテゴリ別支出 │     │
│  │   (面グラフ)   │ │ (棒+折れ線)   │ │  (積み上げ面)  │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### データ設計

#### シート1: P/L（損益計算書 - 手入力 または API経由で追加）

月次の収入・支出を記録するシートです。

|カラム |型     |説明              |
|----|------|----------------|
|月   |String|対象月（YYYY-MM形式）  |
|カテゴリ|String|収支のカテゴリ（給与、食費など）|
|金額  |Number|正: 収入 / 負: 支出   |

#### シート2: B/S（貸借対照表 - スプレッドシート関数で自動集計）

初期残高と開始月を管理するシートです。

|カラム |型     |説明              |設定方法   |
|----|------|----------------|-------|
|初期残高|Number|記録開始時点の総資産      |手入力    |
|開始月 |String|記録開始月（YYYY-MM形式）|関数で自動取得|

##### B/S シートの設定例

|A列  |B列                                |
|----|----------------------------------|
|初期残高|`500000`（手入力）                     |
|開始月 |`=TEXT(MIN('P/L'!A:A),"YYYY-MM")` |

開始月は `P/L` シートの最小月を自動取得します。

### API設計

#### Worker API（フロントエンドから呼び出し）

フロントエンドはCloudflare Worker経由でAPIにアクセスします。

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/` | GAS APIからデータ取得してプロキシ |
| POST | `/api/` | GAS APIへデータ追加をプロキシ |
| * | `/*` | 静的アセット配信（SPA対応） |

##### 認証フロー

```
1. リクエスト受信
2. Authorization ヘッダー検証
3. 未認証 → 401 + WWW-Authenticate ヘッダー
4. 認証OK → GAS APIへプロキシ
5. レスポンス返却
```

##### エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

#### GAS API（Worker から呼び出し）

##### GET - データ取得

```
GET https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

###### レスポンス

```json
{
  "success": true,
  "data": {
    "settings": {
      "initialBalance": 500000,
      "startMonth": "2025-01"
    },
    "monthlyData": [
      {
        "month": "2025-01",
        "income": 250000,
        "expense": 120000,
        "profit": 130000,
        "totalAssets": 630000,
        "categoryExpense": {
          "食費": 35000,
          "光熱費": 15000,
          "交通費": 10000
        }
      }
    ],
    "yearlyData": [
      {
        "year": "2025",
        "income": 3000000,
        "expense": 1800000,
        "profit": 1200000,
        "totalAssets": 1700000,
        "categoryExpense": {
          "食費": 420000,
          "光熱費": 180000,
          "交通費": 120000
        }
      }
    ],
    "categories": ["食費", "光熱費", "交通費", "娯楽"]
  }
}
```

##### POST - レコード追加

```
POST https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

###### リクエスト

```json
{
  "month": "2025-01",
  "category": "食費",
  "type": "expense",
  "amount": 3500
}
```

|フィールド   |型     |説明                           |
|--------|------|-----------------------------|
|month   |String|対象月（YYYY-MM形式）               |
|category|String|カテゴリ名（既存カテゴリから選択 または 新規入力）  |
|type    |String|`income`（収入）または `expense`（支出）|
|amount  |Number|金額（正の数で指定、typeに応じて符号が付与される）  |

###### レスポンス

```json
{
  "success": true,
  "data": {
    "month": "2025-01",
    "category": "食費",
    "amount": -3500
  }
}
```

#### バリデーションルール

| フィールド | ルール |
|-----------|--------|
| month | 必須、YYYY-MM形式、未来の月は不可 |
| category | 必須、既存カテゴリから選択 または 新規入力（1-50文字） |
| type | 必須、`income` または `expense` |
| amount | 必須、正の整数、上限10億 |

### TypeScript型定義

```typescript
// === API Types ===
interface Settings {
  initialBalance: number;
  startMonth: string; // YYYY-MM
}

interface MonthlyData {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  profit: number;
  totalAssets: number;
  categoryExpense: Record<string, number>;
}

interface YearlyData {
  year: string; // YYYY
  income: number;
  expense: number;
  profit: number;
  totalAssets: number;
  categoryExpense: Record<string, number>;
}

interface HouseholdData {
  settings: Settings;
  monthlyData: MonthlyData[];
  yearlyData: YearlyData[];
  categories: string[];  // 選択肢として使用
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

// === Form Types ===
interface TransactionInput {
  month: string;      // YYYY-MM
  category: string;   // 既存カテゴリから選択
  type: 'income' | 'expense';
  amount: number;     // 正の数
}
```

## セットアップ

### 1. Google Spreadsheet の準備

1. 新規スプレッドシートを作成
1. シート名を `P/L` と `B/S` に変更
1. `P/L` シートの1行目に `月 | カテゴリ | 金額` を入力
1. `B/S` シートに以下を入力:
   - A1: `初期残高`, B1: `500000`（手入力、任意の金額）
   - A2: `開始月`, B2: `=TEXT(MIN('P/L'!A:A),"YYYY-MM")`（関数で自動取得）

### 2. Google Apps Script のデプロイ

1. スプレッドシートのメニューから「拡張機能 → Apps Script」を選択
1. `Code.gs` に GAS コードを貼り付け
1. `SHEET_ID` をスプレッドシートのIDに変更
- URLの `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit` の部分
1. 「デプロイ → 新しいデプロイ」をクリック
1. 種類: 「ウェブアプリ」を選択
1. アクセスできるユーザー: 「全員」を選択
1. 「デプロイ」をクリックし、発行されたURLを控える

### 3. フロントエンドのセットアップ

```bash
# プロジェクト作成
npm create vite@latest household-app -- --template react
cd household-app

# 依存パッケージのインストール
npm install recharts

# 環境変数の設定
cp .env.example .env
# .env を編集し、GAS の URL を設定
# VITE_GAS_API_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec

# 開発サーバー起動
npm run dev
```

### 4. Basic認証の設定

Cloudflare Workers の環境変数（シークレット）として認証情報を設定します。

```bash
# 認証ユーザーの設定（複数ユーザーはカンマ区切り）
wrangler secret put BASIC_AUTH_USERS
# プロンプトに以下の形式で入力:
# user1:password1,user2:password2

# ローカル開発時は .dev.vars ファイルを使用
echo 'BASIC_AUTH_USERS=testuser:testpass' > .dev.vars
```

**注意**: `.dev.vars` ファイルは `.gitignore` に追加し、リポジトリにコミットしないでください。

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
│   │   └── TransactionForm.tsx     # 収支入力フォーム
│   ├── hooks/
│   │   └── useHouseholdData.ts     # データ取得フック
│   ├── types/
│   │   └── index.ts                # 型定義
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── worker/
│   └── index.ts                    # Cloudflare Worker
├── .env
├── .env.example
├── package.json
├── vite.config.ts
└── wrangler.jsonc
```

## 技術スタック

|領域     |技術                            |
|-------|------------------------------|
|データストア |Google Spreadsheet            |
|API     |Google Apps Script (ES6)      |
|エッジランタイム|Cloudflare Workers            |
|フロントエンド|Vite + React + TypeScript     |
|グラフ描画  |Recharts                      |

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

## 運用

### データ入力

#### スプレッドシートから入力

`P/L` シートに直接データを追加できます。

|月      |カテゴリ|金額    |
|-------|----|------|
|2025-01|給与  |250000|
|2025-01|食費  |-3500 |
|2025-01|交通費 |-500  |

#### フロントエンドから入力

画面上部の入力フォームから、月・種別・カテゴリ・金額を入力して「追加」ボタンをクリックすると、スプレッドシートにデータが追加されます。

- 種別で「収入」「支出」を選択すると、金額の符号が自動で付与されます
- 既存カテゴリの選択、または新規カテゴリの追加が可能です
- 追加後、グラフは自動的に更新されます

### カテゴリの追加

マスタ管理は不要です。入力フォームでは既存カテゴリから選択できますが、新規カテゴリの追加も可能です。追加したカテゴリは自動的にグラフに反映され、次回以降は選択肢として表示されます。

選択式にすることで表記ゆれ（「食費」と「食品」など）を防止できます。

### GASの再デプロイ

GASのコードを更新した場合は、新しいバージョンとしてデプロイが必要です。

1. Apps Script エディタで「デプロイ → デプロイを管理」を選択
1. 鉛筆アイコンをクリック
1. バージョンで「新しいバージョン」を選択
1. 「デプロイ」をクリック

※ URLは変わりません

## ライセンス

MIT
