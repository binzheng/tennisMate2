# E2Eテストガイド

このディレクトリには、Playwrightを使用したE2E（End-to-End）テストが含まれています。

## クイックスタート

### 1. 初回セットアップ（初回のみ）

```bash
# Playwrightブラウザをインストール
npx playwright install
```

### 2. テストの実行

```bash
# E2Eテストを実行（データベースは自動セットアップされます）
npm run test:e2e

# UIモードで実行（デバッグに便利）
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug
```

## データベースセットアップについて

### 自動セットアップ（推奨）

E2Eテストを実行すると、**自動的に**以下が行われます：

1. データベース全体をクリーンアップ
2. テストユーザーを作成

**手動での準備は不要です！**

### セットアップの仕組み

```
npm run test:e2e
  ↓
Playwright実行
  ↓
tests/global-setup.ts（自動実行）
  ↓
tsx経由でscripts/setup-e2e-db.tsを実行
  ↓
1. DB全体をクリーンアップ
2. テストユーザーを作成
```

**技術詳細:**
- globalSetupは`execSync("npx tsx scripts/setup-e2e-db.ts")`を使用
- これにより、ESモジュール/CommonJSの競合を回避
- セットアップスクリプトは独立したプロセスで実行

### 手動セットアップ（必要な場合のみ）

データベースを手動でリセットしたい場合：

```bash
npm run db:setup-e2e
```

## テストユーザー

E2Eテストでは以下のテストユーザーが自動的に作成されます：

| ロール | メールアドレス | パスワード |
|--------|---------------|------------|
| 管理者 | admin@example.com | password123 |
| オペレーター | operator@example.com | password123 |
| コーチ | coach@example.com | password123 |
| プレイヤー | player@example.com | password123 |

## テストファイル

- `login.spec.ts` - ログイン機能のテスト
- `users.spec.ts` - ユーザーマスタのテスト

## トラブルシューティング

### テストが失敗する

1. **データベース接続エラー**
   - PostgreSQLが起動しているか確認
   - `.env` の `DATABASE_URL` が正しいか確認

2. **テストユーザーが見つからない**
   - グローバルセットアップが正常に実行されたか確認
   - 手動で `npm run db:setup-e2e` を実行

3. **ブラウザが起動しない**
   - `npx playwright install` を再実行

### レポートの確認

テスト実行後、HTMLレポートが生成されます：

```bash
# レポートを開く
npx playwright show-report
```

## CI/CD

GitHub ActionsのCIでは、E2Eテストが自動実行されます。
グローバルセットアップも自動的に実行されるため、特別な設定は不要です。

詳細は `.github/workflows/ci.yml` を参照してください。
