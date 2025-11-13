# User 機能 テスト仕様書

本仕様書は、User 機能に対して作成済みの単体/統合/E2E テストの確認観点と手順を整理したものです。ドメイン/ユースケース/API/画面（ログイン・ユーザーマスタ）の正常系・異常系を含みます。

## 対象範囲
- ドメイン/アプリケーション
  - `src/modules/user/domain/entities/user.entity.ts`
  - `src/modules/user/domain/value-objects/password.vo.ts`
  - `src/modules/user/application/use-cases/*`
- インフラ/リポジトリ
  - `src/modules/user/infrastructure/repositories/prisma-user.repository.ts`
- 画面（E2E 試験の観点）
  - ログイン `/login`
  - ユーザーマスタ `/users`

## 前提条件 / 環境
- Node/Next.js、Vitest、Playwright、Prisma の実行環境
- E2E 用 DB セットアップ済み（テストユーザー投入）
  - `npm run db:setup-e2e`
  - 管理者: `admin@example.com` / `password123`
  - 一般: `player@example.com` / `password123`
- 実行コマンド
  - 単体（全体）: `npm run test:unit`
  - 統合: `npm run test:integration`
  - E2E: `npm run test:e2e`

## 単体テスト（ドメイン）
ファイル: `tests/unit/user/domain/entities/user.entity.test.ts`

- USR-D01: create 正常
  - 期待: 渡した値でエンティティが作成される
- USR-D02: isAdmin 判定
  - 期待: role=admin のみ true
- USR-D03: isOperator 判定
  - 期待: role=operator のみ true
- USR-D04: canManageUsers 判定
  - 期待: admin/operator は true, その他 false
- USR-D05: toPublicData 変換
  - 期待: パスワード等の秘匿情報は含まれない

ファイル: `tests/unit/user/domain/value-objects/password.vo.test.ts`

- USR-D06: createFromPlainText 正常
  - 期待: 8 文字以上の平文からハッシュを生成
- USR-D07: createFromPlainText 異常（短すぎる）
  - 期待: 「パスワードは8文字以上必要です」で例外
- USR-D08: fromHash / compare
  - 期待: 既存ハッシュからの生成・比較が機能する
- USR-D09: getValue
  - 期待: 内部ハッシュ値を取得できる

## 単体テスト（ユースケース）
ファイル: `tests/unit/user/application/use-cases/create-user.use-case.test.ts`

- USR-UC01: 正常作成（メールあり）
- USR-UC02: パスワードがハッシュ化されて保存
- USR-UC03: 重複ユーザーIDでエラー（このユーザーIDは既に使用されています）
- USR-UC04: 重複メールでエラー（このメールアドレスは既に使用されています）
- USR-UC05: パスワード短すぎるでエラー（8 文字未満）
- USR-UC06: メールなしで作成可能
- USR-UC07: 役割（player/coach/operator/admin）いずれでも作成可能

ファイル: `tests/unit/user/application/use-cases/update-user.use-case.test.ts`

- USR-UU01: 対象なしでエラー（ユーザーが見つかりません）
- USR-UU02: 基本項目更新（userId/name/email/role）
- USR-UU03: userId 重複でエラー
- USR-UU04: email 重複でエラー
- USR-UU05: password 指定でハッシュ更新（DTO には露出しない）
- USR-UU06: 既存と同じ userId/email 指定は重複扱いしない

ファイル: `tests/unit/user/application/use-cases/get-user-by-id.use-case.test.ts`

- USR-UGB01: ID で取得できる（DTO 変換）
- USR-UGB02: 存在しない場合エラー（ユーザーが見つかりません）

ファイル: `tests/unit/user/application/use-cases/get-users.use-case.test.ts`

- USR-UG01: 全件取得→DTO 配列

ファイル: `tests/unit/user/application/use-cases/delete-user.use-case.test.ts`

- USR-UD01: 対象なしでエラー（ユーザーが見つかりません）
- USR-UD02: 自分自身は削除できない（自分自身を削除することはできません）
- USR-UD03: 別ユーザーは削除できる

## 統合テスト（Prisma リポジトリ）
ファイル: `tests/integration/user/infrastructure/repositories/prisma-user.repository.integration.test.ts`

- USR-IT01: create で DB へ保存
- USR-IT02: findAll（0 件は空配列 / 複数件取得）
- USR-IT03: findById（存在/非存在）
- USR-IT04: findByUserId（存在/非存在）
- USR-IT05: findByEmail（存在/非存在）
- USR-IT06: update で項目更新
- USR-IT07: delete で物理削除

前処理/後処理: `tests/helpers/db-helper.ts` によるクリーンアップ・切断。

## E2E テスト（画面）
ファイル: `tests/e2e/login.spec.ts`

- USR-E01: ログインページ表示（各入力・ボタン可視）
- USR-E02: 有効な認証情報でログイン→`/users` へ遷移
- USR-E03: 無効メールでエラー表示、URL は `/login` のまま
- USR-E04: 無効パスワードでエラー表示
- USR-E05: 空送信で遷移しない
- USR-E06: メールのみ入力で遷移しない
- USR-E07: 未ログインで `/users` アクセス→`/login` にリダイレクト
- USR-E08: 未ログインで `/users` → ログイン後に元ページへリダイレクト

ファイル: `tests/e2e/users.spec.ts`

- USR-E09: ユーザー一覧表示（ヘッダ・「新規作成」ボタン・既存ユーザー）
- USR-E10: 新規ユーザー作成ダイアログを開ける
- USR-E11: 新規ユーザー作成（ユニーク ID/メール、作成後に一覧へ反映）
- USR-E12: バリデーションエラー（パスワード 8 文字未満）
- USR-E13: ユーザー編集（名前更新→一覧へ反映）
- USR-E14: ユーザー削除（確認ダイアログ→削除）
- USR-E15: 新規作成→削除（行が非表示になること）

## 備考
- DTO にはパスワードハッシュ等の秘匿情報は含まれない前提で検証
- 役割/権限は `admin`/`operator` を管理権限として扱う
- 画面文言/ロケール変更時は E2E の期待値を更新する
- 追加観点: 検索/フィルター、ページネーションの境界、重複登録の UI 側提示など
