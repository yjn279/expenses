# セットアップガイド

## 前提条件

- Node.js 18以上
- pnpm
- Googleアカウント（スプレッドシート作成用）
- Cloudflareアカウント（デプロイ用）

## 1. Google Spreadsheet の準備

1. 新規スプレッドシートを作成
1. シート名を `P/L` と `B/S` に変更
1. `P/L` シートの1行目に `月 | カテゴリ | 金額` を入力
1. `B/S` シートに以下を入力:
   - A1: `初期残高`, B1: `500000`（手入力、任意の金額）
   - A2: `開始月`, B2: `=TEXT(MIN('P/L'!A:A),"YYYY-MM")`（関数で自動取得）
   - A3以降: 月ごとの残高を記録（`月 | 残高` 形式、手入力 または API経由）

## 2. Google Apps Script のデプロイ

1. スプレッドシートのメニューから「拡張機能 → Apps Script」を選択
1. `Code.gs` に GAS コードを貼り付け
1. スプレッドシートIDをPropertiesServiceに登録:
   - Apps Scriptエディタで「プロジェクトの設定」を開く
   - 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
   - プロパティ: `SPREADSHEET_ID`、値: スプレッドシートのID（URLの `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit` の部分）
   - 「保存」をクリック
1. 「デプロイ → 新しいデプロイ」をクリック
1. 種類: 「ウェブアプリ」を選択
1. アクセスできるユーザー: 「全員」を選択
1. 「デプロイ」をクリックし、発行されたURLを控える

## 3. フロントエンドのセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd expenses

# 依存パッケージのインストール
pnpm install

# 環境変数の設定
cp .dev.vars.example .dev.vars
# .dev.vars を編集して実際の値を設定
```

`.dev.vars` ファイルの設定例：

```
BASIC_AUTH_USERS=user1:password1,user2:password2
GAS_API_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

## 4. Basic認証の設定

Cloudflare Workers の環境変数（シークレット）として認証情報を設定します。

### ローカル開発時

`.dev.vars` ファイルを使用します：

```bash
echo 'BASIC_AUTH_USERS=testuser:testpass' > .dev.vars
```

**注意**: `.dev.vars` ファイルは `.gitignore` に追加し、リポジトリにコミットしないでください。

### 本番環境

```bash
# 認証ユーザーの設定（複数ユーザーはカンマ区切り）
wrangler secret put BASIC_AUTH_USERS
# プロンプトに以下の形式で入力:
# user1:password1,user2:password2
```

## 5. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:8787` にアクセスします。

## 6. ビルドとデプロイ

```bash
# ビルド
pnpm build

# デプロイ
pnpm deploy
```

デプロイ先は `wrangler.jsonc` の `name: "expenses"` で指定されたWorker名になります。

## トラブルシューティング

### GAS API に接続できない

- スプレッドシートIDが正しく設定されているか確認
- GASのデプロイが完了しているか確認
- アクセス権限が「全員」に設定されているか確認

### Basic認証が機能しない

- `.dev.vars` ファイルの形式が正しいか確認（`user:pass` 形式、カンマ区切り）
- 本番環境では `wrangler secret put` で設定されているか確認

### ビルドエラー

- Node.jsのバージョンが18以上であることを確認
- `pnpm install` を再実行
- `pnpm cf-typegen` を実行して型定義を更新
