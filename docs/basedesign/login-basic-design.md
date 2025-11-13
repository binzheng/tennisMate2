# ログイン 基本設計書

本ドキュメントは Tennis Mate 2 における「ログイン」機能の基本設計を、実務で使いやすい8項目の構成で記載します。

## 1. 機能概要
- メールアドレス/パスワードによる認証とセッション確立（NextAuth / Credentials）
- 未認証時は保護ページへアクセスすると `/login` へリダイレクト

## 2. 前提条件／関連機能
- 関連画面: ログイン `/login`
- 関連API: NextAuth `/api/auth/[...nextauth]`（Credentials, Session, SignOut）
- 関連マスタ: `User`（メール/パスワード/ロール）
- ルート保護: `src/middleware.ts`（未認証→/login、認証済→/users）

## 3. 処理フロー
- 入力 → 認証
  1) `/login` で email/password 入力
  2) Credentials authorize: PrismaUserRepository.findByEmail → Password.compare
  3) 成功: JWT に `id, role` を格納しセッション確立、元ページまたは `/users` へ遷移
  4) 失敗: 画面上にエラーメッセージ表示（HTTP 401 相当）
- リダイレクト
  - 未認証で保護ページアクセス → `/login?callbackUrl=...`
  - 認証済で `/login` アクセス → `/users`

## 4. 画面設計（UI仕様）
- 項目
  - メールアドレス（必須, email 形式）
  - パスワード（必須, 8+）
- ボタン
  - ログイン
- メッセージ
  - 「メールアドレスまたはパスワードが正しくありません」
- 遷移
  - 成功時: `/users`（または callbackUrl）
  - 失敗時: 同ページにエラー表示

## 5. 入出力仕様
- 入力
  - email: string（必須, email 形式）
  - password: string（必須, 8+）

### API一覧（詳細）

| 名称 | メソッド/URL | 認可 | リクエスト | レスポンス | ステータス/エラー |
|---|---|---|---|---|---|
| SignIn (Credentials) | POST `/api/auth/callback/credentials` | 未認証 | body: `{ email: string, password: string }` | 成功時はリダイレクト or JSON（実装に依存） | 200/302: 成功, 401: 認証失敗, 400: 入力不備 |
| Session | GET `/api/auth/session` | 任意 | なし（Cookie により判定） | `{ user: { id: string, role: "player"|"coach"|"operator"|"admin", name?: string, email?: string }, expires: string }` | 200: セッション情報, 200: `{ user: null }` 未認証 |
| SignOut | POST `/api/auth/signout` | 認証済 | なし | 成功時はリダイレクト or 200 | 200/302: 成功 |

- 備考
  - 認証成功時の遷移は `callbackUrl`（クエリ）を優先、なければ `/users`
  - ヘッダは通常のフォーム送信（`application/x-www-form-urlencoded`）または JSON でも可（フロント実装に依存）
  - Session の `user.role` は NextAuth のコールバックで付与（`src/server/auth/config.ts`）

## 6. データ設計（参照）
- 詳細は「DB 設計書」参照: `docs/dbdesign/db-design.md`

## 7. 例外・エラーハンドリング
- 入力検証エラー（email 形式、空）: フィールド下に表示
- 認証失敗: 「メールアドレスまたはパスワードが正しくありません」
- セッション未確立: middleware で `/login` へ誘導

## 8. 備考・テスト観点
- E2E テスト: `tests/e2e/login.spec.ts`
- 想定追加事項: アカウントロック/2FA/パスワードリセット/メール検証
