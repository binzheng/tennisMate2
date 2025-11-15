% ユーザー 基本設計書

本ドキュメントは Tennis Mate 2 における「ユーザー」機能の基本設計を、実務で使いやすい8項目の構成で記載します。

## 1. 機能概要

- 認証（メール/パスワード）とセッション管理（NextAuth）により、ユーザーとしてログインできること
- 管理者/オペレーターがユーザー情報を一覧・作成・編集・削除できること
- レッスン機能から参照する「コーチ一覧」を提供すること

## 2. 前提条件／関連機能

- 関連画面
  - ログイン: `/login`
  - ユーザーマスタ: `/users`
- 関連API（tRPC）: `src/server/api/routers/user.ts`（getAll, getCoaches, getById, create, update, delete）
- 認証/認可: `next-auth`（JWT strategy）、`src/middleware.ts` によるルート保護
- 関連マスタ/他機能
  - Prisma `User` テーブル（ユーザー基本情報）
  - レッスン機能（コーチ=User.role=coach を参照）

## 3. 処理フロー

- ログイン
  1) `/login` でメール/パスワード入力
  2) NextAuth Credentials authorize → UserRepository.findByEmail → Password.compare
  3) 成功時にセッションへ `id, role` を付与し、保護ページへ遷移
- ユーザー一覧表示
  1) `/users` で `user.getAll` を呼び出し（admin/operator のみ）
  2) GetUsersUseCase → PrismaUserRepository.findAll → DTO 配列返却
- ユーザー作成
  1) UI から「新規作成」→ ダイアログ入力
  2) `user.create`（Zod 検証→重複チェック→Password ハッシュ化→保存）
  3) 成功時: ダイアログ閉・テーブル再取得、失敗時: メッセージ表示
- ユーザー編集
  1) 行の「編集」→ ダイアログで変更
  2) `user.update`（存在確認→重複チェック→必要時ハッシュ更新→保存）
  3) 成功時: ダイアログ閉・再取得、失敗時: メッセージ表示
- ユーザー削除
  1) 行の「削除」→ 確認ダイアログ
  2) `user.delete`（存在確認→自分自身は不可→削除）
  3) 成功時: テーブル更新、失敗時: メッセージ表示

## 4. 画面設計（UI仕様）

- ログイン
  - 項目: メールアドレス（必須）, パスワード（必須）
  - ボタン: ログイン
  - メッセージ例: 「メールアドレスまたはパスワードが正しくありません」
  - 遷移: 成功時 `/users`、失敗時 同ページにエラー
- ユーザーマスタ
  - 一覧列: userId, 名前, メール, ロール, 操作（編集/削除）
  - 操作
    - 新規作成: ダイアログ（userId, name, email?, password, role）
    - 編集: ダイアログ（userId?, name?, email?, password?, role?）
    - 削除: 確認ダイアログ（キャンセル/削除）
  - メッセージ: Zod バリデーション文言、ユースケース由来の業務エラー

## 5. 入出力仕様

- 入力（作成）: `createUserSchema`
  - userId: string(3..50), 必須
  - name: string(1..100), 必須
  - email: email or 空文字, 任意
  - password: string(8+), 必須
  - role: enum(player|coach|operator|admin), 必須
- 入力（更新）: `updateUserSchema`
  - id: string, 必須
  - userId/name/email/role: 任意、各制約は作成時と同等
  - password: 任意（空文字許容、指定時は8+）
- 出力（DTO: UserResponseDto）
  - id, userId, name, email, role（passwordHash は含めない）
- ログイン入力
  - email（必須, email 形式）, password（必須, 8+）

### API一覧（ユーザー機能）

区分: tRPC（`src/server/api/routers/user.ts`）


| API名           | 種別     | 権限           | 入力             | 出力                   | 主なエラー                                  |
| --------------- | -------- | -------------- | ---------------- | ---------------------- | ------------------------------------------- |
| user.getAll     | query    | admin/operator | なし             | UserResponseDto[]      | FORBIDDEN                                   |
| user.getCoaches | query    | admin/operator | なし             | { id, userId, name }[] | FORBIDDEN                                   |
| user.getById    | query    | admin/operator | { id: string }   | UserResponseDto        | NOT_FOUND, FORBIDDEN                        |
| user.create     | mutation | admin/operator | createUserSchema | UserResponseDto        | BAD_REQUEST(重複/検証), FORBIDDEN           |
| user.update     | mutation | admin/operator | updateUserSchema | UserResponseDto        | BAD_REQUEST(重複/検証), FORBIDDEN           |
| user.delete     | mutation | admin/operator | { id: string }   | { success: true }      | BAD_REQUEST(自分自身不可/未存在), FORBIDDEN |

区分: NextAuth（`/api/auth/[...nextauth]`）


| API名                | 種別 | エンドポイント                   | 入力                | 出力/動作                                       |
| -------------------- | ---- | -------------------------------- | ------------------- | ----------------------------------------------- |
| SignIn (Credentials) | POST | `/api/auth/callback/credentials` | { email, password } | 認証成功でセッション発行、失敗で 401/画面エラー |
| SignOut              | POST | `/api/auth/signout`              | -                   | セッション破棄                                  |
| Session              | GET  | `/api/auth/session`              | -                   | セッションJSON（id, role を含む）               |

## 6.データ設計

詳細なテーブル定義・制約・ER 図は「DB 設計書」を参照してください。

- DB 設計書: `docs/dbdesign/db-design.md`
- 実装スキーマ: `prisma/schema.prisma` の `User`, `Session`, `Facility`, `LessonReservation` 等

## 7. 例外・エラーハンドリング

- バリデーション（Zod）
  - ユーザーIDは3文字以上で入力してください／名前は必須です／有効なメールアドレスを入力してください／パスワードは8文字以上…
- 業務エラー
  - 重複: 「このユーザーIDは既に使用されています」「このメールアドレスは既に使用されています」
  - 存在なし: 「ユーザーが見つかりません」
  - 削除禁止: 「自分自身を削除することはできません」
- 認可
  - 未認証: UNAUTHORIZED → `/login` へ
  - 権限不足: FORBIDDEN（「管理者権限が必要です」）
- 再試行・UI 表示
  - 入力エラーはフィールド下に表示、ユースケース/認可エラーはダイアログで表示

## 8. 備考・テスト観点

- 主な確認観点
  - 役割ごとの認可（admin/operator のみ CRUD 可）
  - 重複・形式・長さの各検証とメッセージ表示
  - パスワードハッシュ化と DTO 非露出
  - 自分自身の削除不可
- 参照資料
  - テスト仕様書: `docs/tests/user-test-spec.md`
  - バリデーション: `src/lib/validations/user.schema.ts`
  - API: `src/server/api/routers/user.ts`
  - ドメイン/UC: `src/modules/user/domain/*`, `src/modules/user/application/*`
