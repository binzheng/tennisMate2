# GitHub Actions Guide

このドキュメントでは、プロジェクトのGitHub Actionsワークフローの使用方法を説明します。

## ワークフロー一覧

### 1. CI Workflow (`.github/workflows/ci.yml`)

**目的:** 継続的インテグレーション - コードの品質とテストを自動チェック

**自動実行:**
- `master` または `main` ブランチへのプッシュ
- `master` または `main` ブランチへのプルリクエスト

**手動実行:**
```bash
# GitHub Web UI: Actions → CI → Run workflow
# GitHub CLI:
gh workflow run ci.yml
```

**ジョブ構成:**
1. **Lint and Type Check**
   - Biomeによるコードスタイルチェック
   - TypeScript型チェック

2. **Unit Tests**
   - 単体テスト実行

3. **Integration Tests** ⚙️
   - PostgreSQLコンテナを起動
   - データベーススキーマをプッシュ
   - 統合テスト実行

4. **E2E Tests** ⚙️
   - PostgreSQLコンテナを起動
   - Playwrightブラウザをインストール
   - データベースをセットアップ
   - E2Eテスト実行
   - Playwrightレポートをアップロード（30日間保持）

⚙️ = 手動実行時にスキップ可能

**手動実行オプション:**
```bash
# すべてのテストを実行
gh workflow run ci.yml

# E2Eテストをスキップ（時間短縮）
gh workflow run ci.yml -f run_e2e=false

# 統合テストをスキップ
gh workflow run ci.yml -f run_integration=false

# Lint + 単体テストのみ（最速）
gh workflow run ci.yml -f run_e2e=false -f run_integration=false
```

### 2. Manual Test Run (`.github/workflows/manual-test.yml`)

**目的:** 柔軟なテスト実行 - 特定のテストタイプのみを実行

**自動実行:** なし（手動実行専用）

**手動実行:**
```bash
# GitHub Web UI: Actions → Manual Test Run → Run workflow
# GitHub CLI:
gh workflow run manual-test.yml -f test_type=<type>
```

**ジョブ構成:**
1. **Lint and Type Check** (常に実行)
   - Biomeチェック
   - TypeScriptチェック
   - ビルドチェック

2. **Unit Tests** (条件付き)
3. **Integration Tests** (条件付き)
4. **E2E Tests** (条件付き)
5. **Test Summary** (常に実行)
   - 各ジョブの結果をサマリー表示

**テストタイプオプション:**
- `all`: すべてのテスト（デフォルト）
- `unit`: 単体テストのみ
- `integration`: 統合テストのみ
- `e2e`: E2Eテストのみ
- `lint-only`: Lint/Type Check/Buildのみ

**使用例:**
```bash
# すべてのテストを実行
gh workflow run manual-test.yml -f test_type=all

# 単体テストのみ実行（最速）
gh workflow run manual-test.yml -f test_type=unit

# 統合テストのみ実行
gh workflow run manual-test.yml -f test_type=integration

# E2Eテストのみ実行
gh workflow run manual-test.yml -f test_type=e2e

# Lintと型チェックのみ
gh workflow run manual-test.yml -f test_type=lint-only

# Node.jsバージョンを指定
gh workflow run manual-test.yml -f test_type=all -f node_version=18
```

## 実行時間の目安

| ジョブ | 実行時間 | 備考 |
|--------|---------|------|
| Lint and Type Check | 1-2分 | ビルド含む |
| Unit Tests | 30秒-1分 | データベース不要 |
| Integration Tests | 2-3分 | PostgreSQL起動含む |
| E2E Tests | 3-5分 | Playwright起動含む |
| **合計（すべて）** | **7-11分** | 並列実行 |

**時短テクニック:**
- 単体テストのみ: 約1-2分
- Lint onlyのみ: 約1-2分
- E2Eスキップ: 約4-6分

## ワークフロー実行の確認

### GitHub Web UI

1. **実行中のワークフローを確認:**
   - リポジトリの「Actions」タブ
   - 黄色のドット = 実行中
   - 緑のチェックマーク = 成功
   - 赤のバツマーク = 失敗

2. **詳細ログを確認:**
   - ワークフローをクリック
   - 各ジョブをクリックして展開
   - ステップをクリックしてログを表示

3. **Playwrightレポートをダウンロード:**
   - E2Eテストジョブの「Artifacts」セクション
   - `playwright-report` をダウンロード

### GitHub CLI

```bash
# 最近のワークフロー実行を一覧表示
gh run list

# 特定のワークフローのみ表示
gh run list --workflow=ci.yml

# 実行中のワークフローを監視
gh run watch

# 特定の実行の詳細を確認
gh run view <run-id>

# ログを直接表示
gh run view <run-id> --log

# 失敗したジョブのログのみ表示
gh run view <run-id> --log-failed

# Artifactをダウンロード
gh run download <run-id>
```

## トラブルシューティング

### ワークフローが失敗した場合

1. **エラーログを確認:**
   ```bash
   gh run view --log-failed
   ```

2. **よくある原因:**
   - **型エラー:** `npm run typecheck` をローカルで実行
   - **コードスタイル:** `npm run check:write` で自動修正
   - **テスト失敗:** `npm run test:unit` でローカル確認
   - **データベース問題:** `npm run db:generate` でマイグレーション

3. **再実行:**
   ```bash
   # GitHub Web UI: ワークフロー画面の「Re-run jobs」
   # GitHub CLI:
   gh run rerun <run-id>

   # 失敗したジョブのみ再実行
   gh run rerun <run-id> --failed
   ```

### E2Eテストが不安定な場合

E2Eテストは環境依存で失敗することがあります:

```bash
# E2Eのみ再実行
gh workflow run manual-test.yml -f test_type=e2e

# ローカルでデバッグモードで実行
npm run test:e2e:debug
```

### Secrets/環境変数の問題

ワークフローで使用される環境変数:
- `DATABASE_URL`: テスト用データベース接続文字列
- `AUTH_SECRET`: NextAuth認証シークレット
- `AUTH_DISCORD_ID`: Discord OAuth ID（ダミー値）
- `AUTH_DISCORD_SECRET`: Discord OAuth Secret（ダミー値）

※ これらはワークフロー内でハードコードされています（テスト用）

## ベストプラクティス

### コミット前

```bash
# ローカルでレビュースクリプトを実行
npm run review

# 問題があれば修正
npm run check:write

# コミット（pre-commit hookが自動実行）
git commit -m "feat: add feature"
```

### プッシュ前

```bash
# ビルドチェック
npm run build

# すべてのテスト
npm run test:all
```

### プルリクエスト前

```bash
# 手動でCIを実行して確認
gh workflow run ci.yml

# または特定のテストのみ
gh workflow run manual-test.yml -f test_type=unit
```

### マージ前

- [ ] すべてのCIチェックが成功
- [ ] コードレビュー承認
- [ ] Conflictがない
- [ ] PRの説明が明確

## カスタマイズ

### ワークフローを編集する

1. **ファイルを編集:**
   - `.github/workflows/ci.yml`
   - `.github/workflows/manual-test.yml`

2. **変更をコミット:**
   ```bash
   git add .github/workflows/
   git commit -m "ci: update workflow"
   git push
   ```

3. **動作確認:**
   ```bash
   gh workflow run ci.yml
   ```

### 新しいワークフローを追加する

```yaml
# .github/workflows/my-workflow.yml
name: My Custom Workflow

on:
  workflow_dispatch:
    inputs:
      my_option:
        description: 'My option'
        required: true
        type: string

jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Hello ${{ inputs.my_option }}"
```

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub CLI Actions](https://cli.github.com/manual/gh_workflow)
- [コードレビューガイド](./CODE_REVIEW_GUIDE.md)
