# Match 機能 テスト仕様書

本仕様書は、Match（ゲームマッチング）機能に対して実施すべき単体/統合/E2E テストの観点・手順をまとめたものです。UI・ドメイン・ユースケース・API・画面遷移・PDF 出力の正常/異常系を対象とします。

## 対象範囲
- フロントエンド（画面/コンポーネント）
  - `src/app/match/page.tsx`（セッション一覧）
  - `src/app/match/new/page.tsx`（セッション新規作成）
  - `src/app/match/[id]/page.tsx`（セッション詳細・スコア入力）
- ドメイン/アプリケーション
  - `src/modules/match/domain/entities/match-session.entity.ts`
  - `src/modules/match/domain/entities/match-game.entity.ts`
  - `src/modules/match/application/utils/match-generator.ts`
  - `src/modules/match/application/use-cases/create-match-session.use-case.ts`
  - `src/modules/match/application/use-cases/get-all-sessions.use-case.ts`
  - `src/modules/match/application/use-cases/get-match-session.use-case.ts`
  - `src/modules/match/application/use-cases/update-game-result.use-case.ts`
  - `src/modules/match/application/use-cases/delete-match-session.use-case.ts`
- API（tRPC ルーター）
  - `src/server/api/routers/match.ts`

## 前提条件 / 環境
- Node/Next.js、Vitest、Playwright、Prisma の実行環境がセットアップ済み
- 認証
  - 一般ユーザー: `player@example.com` / `password123`
  - （必要に応じて）別ユーザー: `player2@example.com` など
- DB
  - Prisma スキーマに基づきマイグレーション実施済み
  - Match 機能用のデータはテストごとにセットアップ（テスト専用 DB またはトランザクションロールバック）
- 実行コマンド
  - 単体（全体）: `npm run test:unit`
  - 統合: `npm run test:integration`
  - E2E: `npm run test:e2e`

## テスト観点（概略）
- セッション一覧表示・遷移・削除
- セッション新規作成（プレイヤー生成・オートコンプリート・入力バリデーション）
- ゲーム組み合わせの自動生成（`match-generator`）と休みローテーション
- スコア入力と勝者集計（プレイヤー別勝利数）
- PDF 出力（一覧/個別）のレスポンス形式とダウンロード処理
- API エラー時のメッセージ表示

---

## 単体テスト（フロント）

### 1. セッション一覧画面（`src/app/match/page.tsx`）
ファイル例: `tests/unit/match/page.test.tsx`

- MAT-U01: ローディング表示
  - 手順: `api.match.getAll.useQuery` を `isLoading: true` でモックして描画
  - 期待: Backdrop + CircularProgress が表示される

- MAT-U02: エラー表示
  - 手順: `useQuery` を `error: new Error("failed")` でモック
  - 期待: Alert に「セッションの取得に失敗しました」相当のメッセージが表示される

- MAT-U03: 一覧表示と行クリックでの詳細遷移
  - 手順: 2件のセッション（name/date/playerCount/createdAt 異なるデータ）をモック
  - 期待:
    - テーブルに2行表示され、各列がモック値通りに表示される
    - 行クリックで `router.push("/match/{id}")` が呼ばれる

- MAT-U04: 削除ダイアログと削除処理
  - 手順: 1件のセッションをモックし、削除アイコンをクリック
  - 期待:
    - 削除確認ダイアログが開く
    - 「削除する」クリックで `match.delete.mutate({ id })` が呼ばれ、成功時 `match.getAll.invalidate()` が実行される

- MAT-U05: 「PDF出力」ボタンの状態とハンドラ
  - 手順:
    - セッションなしの場合とありの場合をモック
  - 期待:
    - セッションが0件のときは `PDF出力` ボタンが disabled
    - fetch をモックし、成功時に `Blob` 生成と `a` タグ click が行われることを spy で確認（`URL.createObjectURL` / `URL.revokeObjectURL` 含む）

### 2. 新規作成画面（`src/app/match/new/page.tsx`）
ファイル例: `tests/unit/match/new-page.test.tsx`

- MAT-U06: デフォルトセッション名の生成
  - 手順: `useSession` を `user.name="山田太郎"` でモックし描画
  - 期待: セッション名入力欄に `YYYYMMDDHHMM_山田太郎` が自動設定される

- MAT-U07: プレイヤー人数入力と「プレイヤー生成」
  - 手順:
    - `playerCount` に 6 を入力
    - 「プレイヤー生成」をクリック
  - 期待:
    - players state に 6 行分のプレイヤーが作成され、表示も 6 行になる

- MAT-U08: プレイヤーオートコンプリートの振る舞い
  - 手順:
    - `match.getSelectablePlayers` を2ユーザー（A,B）でモック
    - 1行目でユーザー A を選択
  - 期待:
    - players[0] に `{ name: "A", userId: "id-of-A" }` が入る
    - freeSolo 入力では `userId: null` になる

- MAT-U09: バリデーションエラー（セッション名未入力/プレイヤー数不足）
  - 手順:
    - セッション名空、players 配列長3で「作成」クリック
  - 期待:
    - 「セッション名を入力してください」「最低4人のプレイヤーが必要です」などのメッセージが表示され、mutation は呼ばれない

- MAT-U10: 作成成功時の遷移
  - 手順:
    - `createSessionMutation` を成功でモックし、`data.id="session-1"` を返す
  - 期待:
    - 「作成」クリックで `api.match.create.mutate` が呼ばれ、成功時 `router.push("/match/session-1")` が呼ばれる

### 3. 詳細画面（`src/app/match/[id]/page.tsx`）
ファイル例: `tests/unit/match/detail-page.test.tsx`

- MAT-U11: ローディング・未存在時の表示
  - 手順:
    - `match.getById` を `isLoading: true` → `data: undefined` などでモック
  - 期待:
    - ローディング中は Backdrop + CircularProgress
    - 取得結果無しの場合は「セッションが見つかりません」表示

- MAT-U12: ゲーム一覧表示
  - 手順:
    - 1セッション・2ゲームのデータをモック（チーム1/2/休みのプレイヤーを含む）
  - 期待:
    - 各ゲーム行にゲーム番号・チーム1/2のプレイヤー名・休みプレイヤーがテキストとして表示される

- MAT-U13: スコア入力と `updateGameResult` 呼び出し
  - 手順:
    - 特定のゲーム行でチーム1スコア=60, チーム2スコア=30, 勝者=1 を選択し、「結果保存」クリック
  - 期待:
    - `updateGameMutation.mutate` が呼ばれ、引数 `playerScores` にチームごとに均等割りされたスコアが入っていることを確認
    - `winner: 1` が渡されている

- MAT-U14: プレイヤー別勝利数（小計）の集計表示
  - 手順:
    - `status="completed"` のゲームが複数あるセッションをモックし、チーム1/2 勝敗が混在
  - 期待:
    - 勝利数に応じたプレイヤー一覧がソートされて表示される（勝利数 desc, 名前 asc）

- MAT-U15: 「PDF出力」ボタンの動作
  - 手順:
    - `api.match.generateSessionPDF.useQuery` を `enabled:false` でモックし、`refetch` 結果に `{ pdf, filename }` を返す
  - 期待:
    - 「PDF出力」クリックで `refetch` が呼ばれ、レスポンスをもとに Blob/リンク生成 → click → revoke が実行される

---

## 単体テスト（ドメイン/ユースケース）

### 5. ドメインエンティティ・マッチングロジック

- MatchSession エンティティ: `tests/unit/match/domain/entities/match-session.entity.test.ts`
  - MAT-D01: create 正常（各プロパティが保持される）
  - MAT-D02: createdAt/updatedAt 未指定時に現在時刻が設定される
  - MAT-D03: toPublicData でシリアライズ可能な形に変換される

- MatchGame エンティティ: `tests/unit/match/domain/entities/match-game.entity.test.ts`
  - MAT-D04: create 正常（players を含む）
  - MAT-D05: ステータスと winner の更新ロジック（必要に応じて）

- match-generator: `tests/unit/match/application/utils/match-generator.test.ts`
  - MAT-G01: プレイヤー数 < 4 でエラー
  - MAT-G02: 4人のとき 3 通りのゲームが生成され、休みがいない
  - MAT-G03: 5人以上のとき、各ゲームに休みプレイヤーが含まれる
  - MAT-G04: 同じプレイヤーが連続で休みにならない（ローテーションの基本性質）

### 6. ユースケース

- CreateMatchSessionUseCase: `tests/unit/match/application/use-cases/create-match-session.use-case.test.ts`
  - MAT-UC01: 正常作成（入力プレイヤー数>=4）でセッションと複数ゲームが作成される
  - MAT-UC02: セッション名空でエラー
  - MAT-UC03: プレイヤー数 < 4 でエラー

- GetAllSessionsUseCase: `tests/unit/match/application/use-cases/get-all-sessions.use-case.test.ts`
  - MAT-UG01: repository.findAll の結果が SessionSummary 配列にマッピングされる

- GetMatchSessionUseCase: `tests/unit/match/application/use-cases/get-match-session.use-case.test.ts`
  - MAT-UG02: 存在する ID でセッション詳細が返る
  - MAT-UG03: 存在しない ID で null（または例外）になる

- UpdateGameResultUseCase: `tests/unit/match/application/use-cases/update-game-result.use-case.test.ts`
  - MAT-UU01: 指定ゲームが存在しない場合にエラー
  - MAT-UU02: playerScores のスコアがゲームのプレイヤーに正しく割り当てられる
  - MAT-UU03: winner が 1 or 2 以外の値の場合にエラー

- DeleteMatchSessionUseCase: `tests/unit/match/application/use-cases/delete-match-session.use-case.test.ts`
  - MAT-UD01: 存在しない ID でエラー
  - MAT-UD02: 正常削除（セッションとゲーム/プレイヤーが削除される）

---

## 統合テスト（API）

ファイル例: `tests/integration/match/server/api/routers/match.router.integration.test.ts`

- MAT-IT01: セッション作成〜一覧取得
  - 手順:
    - テストユーザーでログインしたコンテキストで `match.create` を呼ぶ
    - その後 `match.getAll` を呼び出す
  - 期待:
    - create の戻り値にセッション情報が含まれる
    - getAll に create したセッションが含まれ、playerCount / date などが一致する

- MAT-IT02: セッション詳細取得
  - 手順: 事前に DB 上に MatchSession/MatchGame/MatchGamePlayer を作成 → `match.getById({ id })`
  - 期待:
    - セッション情報とゲーム配列が取得できる
    - 各ゲームに players 配列が存在し、team/position/score が正しく返る

- MAT-IT03: ゲーム結果更新
  - 手順: 既存ゲームに対し `match.updateGameResult` を呼び、score/winner を更新
  - 期待:
    - 戻り値 `{ success: true }`
    - 再度 `match.getById` したとき、該当ゲームの status が completed、winner と各プレイヤーの score が更新されている

- MAT-IT04: セッション削除
  - 手順:
    - セッションを作成 → `match.delete({ id })` → `match.getAll`
  - 期待:
    - delete 後に getAll で対象セッションが存在しない

- MAT-IT05: PDF 出力（一覧/個別）
  - 手順:
    - テスト用セッションを作成
    - `match.generatePDF()` / `match.generateSessionPDF({ id })` を呼ぶ
  - 期待:
    - `{ pdf: string, filename: string }` 形式で返る（pdf は base64 文字列）
    - pdf が空文字列でないことを簡易チェック（サイズやヘッダバイトの検査は任意）

- MAT-IT06: 認証エラー
  - 手順: 未ログインコンテキストで `match.getAll` などを呼ぶ
  - 期待: `UNAUTHORIZED` エラーが返る

---

## E2E テスト（画面）

ファイル例: `tests/e2e/match.spec.ts`

- MAT-E01: セッション一覧表示
  - 手順:
    - `player@example.com` でログイン
    - `/match` にアクセス
  - 期待:
    - タイトル「ゲームマッチング一覧」が表示される
    - 既存のセッションがあれば一覧に表示される

- MAT-E02: セッション新規作成〜一覧反映
  - 手順:
    - `/match` → 「新規作成」クリック → `/match/new`
    - セッション名・プレイヤー人数・プレイヤー名を入力して「作成」
  - 期待:
    - 作成後 `/match/[id]` に遷移し、新しいセッション名が表示される
    - `/match` に戻ると一覧に新規セッションが1行追加されている

- MAT-E03: スコア入力と勝利数集計
  - 手順:
    - 新規セッション作成後、`/match/[id]` で1ゲーム以上に対してスコアと勝者を入力し、「結果保存」
  - 期待:
    - 入力したスコア・勝者が画面に反映される
    - 「プレイヤー別 勝利数（小計）」に勝利プレイヤーが1勝として表示される

---

## 補足
- 本仕様書は観点ベースであり、実際のテストケース実装時には入力値のバリエーション（プレイヤー数・名前の文字種・日付の境界など）を追加して網羅度を高めることを推奨する。
- PDF の内容自体の画面比較は難しいため、E2E では主に「エラーにならず処理が完了すること」「レスポンス形式が正しいこと」にフォーカスする。***
