# Repository Guidelines

以下は本リポジトリのコントリビューションガイドです。詳細な背景・実装パターンは CLAUDE.md を参照してください。

## プロジェクト構成 / モジュール配置
- UI/アプリ: `src/app`, `src/components`, `src/theme`, `src/styles`
- サーバ/API: `src/server`, `src/trpc`, `src/lib`, `src/providers`, `src/middleware.ts`
- データ: `prisma/schema.prisma`（生成物は `generated/prisma`）
- テスト: `tests/unit`, `tests/integration`, `tests/e2e`（Playwright）
- 資料/資産: `docs/`, `design/`, `public/`
- スクリプト: `scripts/`（例: `scripts/code-review.sh`）
- パスエイリアス: `~/*`（`tsconfig.json`）

## ビルド・テスト・開発コマンド
- `npm run dev` 開発サーバー（Next.js App Router）
- `npm run build` / `npm start` 本番ビルド/起動、`npm run preview` 一括実行
- `npm run typecheck` 型チェック（出力なし）
- `npm run check` / `check:write` / `check:unsafe` Biomeチェックと自動修正
- `npm run lint` / `format` 個別のLint/Format
- `npm run test` / `test:unit` / `test:integration` / `test:coverage` Vitest
- `npm run test:e2e` / `test:e2e:ui` / `test:e2e:debug` Playwright（devサーバー起動）
- DB: `db:generate`（開発マイグレーション）、`db:migrate`（デプロイ）、`db:push`、`db:studio`、`db:seed`

## コーディング規約・命名
- TypeScript Strict。ルート import は `~` を使用。
- Lint/Format は Biome。原則2スペース、シングルクォート、末尾カンマ推奨。
- React: ファイル名はケバブケース（例 `main-layout.tsx`）、エクスポートはPascalCase。
- tRPC ルーターは CLAUDE.md のパターン（ユースケース + リポジトリ）に従う。

## テスト方針
- 対象: `tests/**/*.{test,spec}.{ts,tsx}`。Vitest + V8カバレッジ（text/json/html）。
- E2E: Playwright（`tests/e2e`）。`playwright.config.ts` で `baseURL` を管理。
- 不安定なケースは `npm run test:ui` で調査。新規ロジックは要テスト。

## コミット・PR ガイドライン
- コミットは Conventional Commits 推奨（例: `feat:`, `fix:`, `ci:`）。1コミット1関心。
- プッシュ前に `npm run review`（スタイル/型/ビルド/テスト）を実行。
- PR: 目的/変更点、関連Issue、UI変更のスクショ、DB変更と手順、テスト計画、影響範囲を記載。

## セキュリティ・設定
- `.env.example` を `.env.local` にコピーし `DATABASE_URL`, `AUTH_*` 等を設定。検証は `src/env.js`。
- シークレットや生成物（`generated/`, `coverage/`, `playwright-report/`）はコミット禁止。
