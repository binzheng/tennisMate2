# 作成済み機能一覧（Implemented Features）

本ドキュメントは、現時点で実装済みの主要機能と関連ソースの位置、利用方法の要点をまとめたものです。詳細な実装パターンは CLAUDE.md を参照してください。

- ランタイム/ビルド: Next.js App Router, TypeScript Strict, tRPC, Prisma, NextAuth.js, MUI
- パスエイリアス: `~/*`
- 主要コマンド: `npm run dev` / `build` / `start`、テストは `npm run test:*`

## 認証・認可（AuthN/Z）
- 認証基盤: NextAuth（JWT セッション + PrismaAdapter）
  - 設定: `src/server/auth/config.ts:1`（Credentials/Discord Provider, `Session.user` に `id`/`role` 拡張）
  - エントリ: `src/app/api/auth/[...nextauth]/route.ts:1`、ユーティリティ: `src/server/auth/index.ts:1`
  - ロール: `player | coach | operator | admin`（Prisma `Role`）
- ログインページ（MUI フォーム + ダーク/ライト切替）
  - 画面: `src/app/login/page.tsx:1`, `src/app/login/LoginPage.tsx:1`
  - 成功時リダイレクト: `callbackUrl`（デフォルト `/users`）
- ルート保護（ミドルウェア）
  - 実装: `src/middleware.ts:1`
  - 未認証で `/users` `/facilities` `/lessons` へアクセス → `/login?callbackUrl=...` にリダイレクト
  - ログイン済みで `/login` にアクセス → `/users` へリダイレクト
- tRPC の認可（管理系）
  - `adminProcedure`: `admin` または `operator` のみ許可（`src/server/api/routers/user.ts:14`）

## ユーザー管理（User Master）
- 画面（一覧・作成/編集・削除）
  - 一覧ページ: `src/app/users/page.tsx:1`
  - 一覧テーブル: `src/app/users/_components/user-table.tsx:1`
    - 機能: ページネーション、行選択、ロール表示（Chip）、削除確認ダイアログ
  - 入力ダイアログ: `src/app/users/_components/user-dialog.tsx:1`
    - `react-hook-form` + `zod` バリデーション（新規/編集でスキーマ切替）
- バリデーションスキーマ
  - `src/lib/validations/user.schema.ts:1`
    - 作成: `createUserSchema`（必須: userId/name/password/role、email 任意）
    - 更新: `updateUserSchema`（id 必須、他は任意・重複/長さチェック）
- ドメイン/ユースケース/リポジトリ
  - エンティティ: `src/modules/user/domain/entities/user.entity.ts:1`（`toPublicData()` で安全出力）
  - パスワードVO: `src/modules/user/domain/value-objects/password.vo.ts:1`（bcrypt で hash/compare）
  - ユースケース:
    - 一覧取得: `GetUsersUseCase`（`getAll`）`src/modules/user/application/use-cases/get-users.use-case.ts:1`
    - 詳細取得: `GetUserByIdUseCase`（`getById`）`src/modules/user/application/use-cases/get-user-by-id.use-case.ts:1`
    - 作成: `CreateUserUseCase`（重複チェック + ハッシュ化）`src/modules/user/application/use-cases/create-user.use-case.ts:1`
    - 更新: `UpdateUserUseCase`（差分更新 + 重複チェック + 任意パスワード）`src/modules/user/application/use-cases/update-user.use-case.ts:1`
    - 削除: `DeleteUserUseCase`（自己削除禁止）`src/modules/user/application/use-cases/delete-user.use-case.ts:1`
  - リポジトリ（Prisma 実装）: `src/modules/user/infrastructure/repositories/prisma-user.repository.ts:1`
- tRPC API
  - ルータ: `src/server/api/routers/user.ts:1`
    - `getAll`/`getById`/`create`/`update`/`delete`（いずれも `adminProcedure` 経由）
  - ルート統合: `src/server/api/root.ts:1`（`user`）
  - 共通初期化/コンテキスト: `src/server/api/trpc.ts:1`（`session`/`db` 付与 + dev タイミング計測）
- クライアント（tRPC + React Query）
  - Provider/クライアント生成: `src/trpc/react.tsx:1`（`api.user.*`、開発用 loggerLink）
  - RSC 用 Hydration: `src/trpc/server.ts:1`

## レイアウト/テーマ
- レイアウト
  - メインレイアウト: `src/components/layout/main-layout.tsx:1`（ヘッダー/サイドバー/レスポンシブ）
  - ヘッダー: `src/components/layout/header.tsx:1`（テーマ切替、通知、アカウントメニュー、サインアウト）
  - サイドバー: `src/components/layout/sidebar.tsx:1`（ホーム/マスタ[ユーザー]）
  - ルートレイアウト: `src/app/layout.tsx:1`（`SessionProvider`/`ThemeProvider`/`TRPCReactProvider`）
- テーマ
  - Provider/Hook: `src/providers/theme-provider.tsx:1`（`useThemeMode`、localStorage 永続化）
  - ダーク/ライトテーマ: `src/theme/theme.ts:1`（表/行/ペーパーの MUI スタイル調整）

## データベース（Prisma）
- スキーマ: `prisma/schema.prisma:1`（出力先: `generated/prisma`）
  - User/Account/Session/VerificationToken に加え、コート/施設/レッスン/マッチ/予約/スコア等を定義済み
  - 現時点の UI/API はユーザー管理にフォーカス（他モデルは今後拡張余地）
- Prisma クライアント: `src/server/db.ts:1`

## テスト（Vitest + Playwright）
- Unit
  - User エンティティ: `tests/unit/user/domain/entities/user.entity.test.ts:1`
  - Password VO: `tests/unit/user/domain/value-objects/password.vo.test.ts:1`
  - CreateUser ユースケース: `tests/unit/user/application/use-cases/create-user.use-case.test.ts:1`
- E2E（Playwright）
  - ログイン: `tests/e2e/login.spec.ts:1`
  - ユーザー管理: `tests/e2e/users.spec.ts:1`
- 実行
  - Unit: `npm run test:unit`、E2E: `npm run test:e2e`
  - カバレッジ: `npm run test:coverage`、UI デバッグ: `npm run test:ui` / `test:e2e:ui`
  - ガイド: `docs/TESTING.md:1`

## スクリプト
- テストユーザー投入: `npm run db:seed`（`scripts/create-test-users.ts:1`）
- E2E 用 DB セットアップ: `npm run db:setup-e2e`（`scripts/setup-e2e-db.ts:1`）
- レビュー一括実行: `npm run review`（スタイル/型/ビルド/テスト）

## 開発のヒント
- 環境変数: `.env.example` を `.env.local` にコピーし、`DATABASE_URL`, `AUTH_*` を設定（`src/env.js:1`）
- API 追加: `src/server/api/routers/*` にルータ追加 → `src/server/api/root.ts` に手動登録
- フロントからの呼び出し: `src/trpc/react.tsx` の `api.<router>.<procedure>` を利用
- 認可要件: 管理系は `adminProcedure` の適用を検討（ロール: admin/operator）
- UI: MUI + RHF + zod の組み合わせでフォーム実装（既存実装を踏襲）

---
このファイルは作成済み機能の俯瞰を提供します。更新・追加を行った場合は、本書も随時更新してください。
