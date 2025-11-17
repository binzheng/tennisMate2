# マッチング（MatchSession） 基本設計書

本ドキュメントは Tennis Mate 2 における「マッチング（MatchSession）」機能の基本設計を、実務で使いやすい構成で記載します。テーブル定義等の DB 詳細は別ドキュメントへ分離します。

## 1. 機能概要
- テニス練習会などの「マッチセッション」を作成し、参加プレイヤーの組み合わせ（ダブルス＋休み）を自動生成する
- セッションごとに複数ゲームの結果（チームスコア・勝者）を登録し、プレイヤー別の勝利数を集計する
- セッション一覧／個別セッションの内容を PDF として出力し、帳票として共有できるようにする

## 2. 前提条件／関連機能
- 関連画面
  - セッション一覧: `/match`
  - セッション新規作成: `/match/new`
  - セッション詳細・スコア入力: `/match/[id]`
- 関連 API（tRPC）: `src/server/api/routers/match.ts`
  - `match.create`, `match.getAll`, `match.getSelectablePlayers`, `match.getById`
  - `match.updateGameResult`, `match.delete`
  - `match.generatePDF`, `match.generateSessionPDF`
- 関連ドメインモジュール
  - `src/modules/match/domain/entities/match-session.entity.ts`
  - `src/modules/match/domain/entities/match-game.entity.ts`
  - `src/modules/match/domain/repositories/match-session.repository.interface.ts`
  - `src/modules/match/application/use-cases/*.use-case.ts`
  - `src/modules/match/application/utils/match-generator.ts`
- 認証/認可
  - すべての match ルーターは `protectedProcedure`（要ログイン）
  - 現状は「作成者のみ編集」などの厳密な権限制御は行っていない（今後の拡張余地）
- 関連マスタ/他機能
  - `User`（role=player の利用者が主な対象）
  - `PlayerProfile`, `ScoreRecord`, `Reservation` との連携は将来拡張対象

## 3. 処理フロー

### 3.1 セッション一覧表示
1. `/match` 初期表示時に `match.getAll` を呼び出し、認証ユーザーがアクセス可能な全セッションを取得する
2. 取得結果をテーブル表示し、列クリックで `/match/[id]` へ遷移できるようにする
3. 行の「削除」アイコン押下で削除確認ダイアログを表示する

### 3.2 セッション新規作成
1. `/match/new` でフォームを表示
   - セッション名（デフォルト: 日時＋ユーザー名）
   - プレイヤー人数（4〜20）
   - プレイヤー一覧（オートコンプリート＋フリーテキスト）
2. 「プレイヤー生成」押下で指定人数分の行を生成する
   - 既存のプレイヤー入力は維持し、不足分のみ追加する
3. 各行で以下を入力/選択
   - 既存ユーザー（`match.getSelectablePlayers` の結果）を選択
   - 自由入力（ダミー名）
   - 「プレイヤー追加」「削除」で行数を調整
4. 「作成」押下時に以下を実行
   - クライアント側バリデーション（セッション名必須／プレイヤー数 >= 4）
   - `match.create` を呼び出し、サーバ側で `CreateMatchSessionUseCase` を実行
   - サーバ側で `generateMatches` によりゲームの組み合わせ（チーム1/2＋休み）を自動生成し、`MatchSession`／`MatchGame`／`MatchGamePlayer` を登録
5. 成功時は新規セッションの詳細ページ `/match/[id]` に遷移する

### 3.3 セッション詳細表示・スコア入力
1. `/match/[id]` で `match.getById` を呼び出し、セッションと紐づくゲーム一覧・プレイヤー情報を取得する
2. 画面上部にセッション情報を表示
   - セッション名、日付、プレイヤー数、ゲーム数
3. ゲーム一覧テーブルを表示
   - 各行にゲーム番号・チーム1/2のプレイヤー名・休みのプレイヤーを表示
   - スコア入力欄として、チーム1／チーム2の合計スコア（プリセット: 0,15,30,45,60,75）を選択可能にする
   - 勝者チーム（1 or 2）を Select で選択
4. 「結果保存」押下時に以下を実行
   - チームごとの合計スコアをチームに所属するプレイヤー数でほぼ均等に分配し、プレイヤー別スコア配列を構成する
   - `match.updateGameResult` を呼び出し、`UpdateGameResultUseCase` で MatchGame／MatchGamePlayer を更新する
   - 成功時は `match.getById` を再取得して画面を更新する
5. 画面下部に「プレイヤー別 勝利数（小計）」を表示
   - 完了済みゲーム（status=completed）の winner チームに属するプレイヤーごとに勝利数を加算し、ソートして表示する

### 3.5 セッション削除
1. `/match` の一覧テーブルで、行の削除アイコン押下 → 確認ダイアログ表示
2. 「削除する」押下で `match.delete` を呼び出し、`DeleteMatchSessionUseCase` によりセッションと紐づくゲーム／プレイヤーを削除する
3. 成功時は `match.getAll` を再取得して一覧を更新する

### 3.6 PDF 出力
1. セッション一覧 PDF
   - `/match` の「PDF出力」ボタン押下時に `/api/trpc/match.generatePDF` を呼び出す
   - サーバ側で全セッションを取得し、`generateMatchSessionsPDF` により一覧 PDF（Uint8Array）を生成
   - base64 文字列に変換して返却し、フロント側で Blob → ダウンロードリンク生成 → 自動クリックで保存する
2. 個別セッション PDF
   - `/match/[id]` の「PDF出力」ボタン押下時に `match.generateSessionPDF` を tRPC クライアントから呼び出す
   - サーバ側で対象セッションを取得し、`generateSessionDetailPDF` により詳細 PDF を生成
   - 一覧 PDF と同様に base64 → Blob → ダウンロードリンクとして保存する

## 4. 画面設計（UI仕様）

### 4.1 `/match`（セッション一覧）
- ヘッダ
  - タイトル「ゲームマッチング一覧」
  - 右側にボタン: `PDF出力`, `新規作成`
- セッション一覧テーブル
  - 列: セッション名／日付／プレイヤー数／作成日／操作（詳細, 削除）
  - 行クリック: `/match/[id]` へ遷移
  - 操作列
    - 「詳細」ボタン: `/match/[id]`
    - 削除アイコン: 削除ダイアログ表示
- 空状態
  - 「マッチングセッションがまだありません。」メッセージ
  - 「最初のセッションを作成」ボタン

### 4.2 `/match/new`（セッション新規作成）
- セッション設定
  - セッション名 TextField（初期値: 日時＋ログインユーザー名）
  - プレイヤー人数 TextField（最小4、最大20）
  - 「プレイヤー生成」ボタンでプレイヤー行生成
- プレイヤー一覧
  - 各行: Autocomplete（ユーザー一覧＋「プレイヤーN」ダミー）＋ freeSolo 入力
  - 行末に削除アイコンで行削除
  - ヘッダに「プレイヤー追加」ボタン
- メッセージ
  - 入力エラー（セッション名未入力／プレイヤー数不足）や API エラーを Alert で表示
- フッタ
  - 「作成」ボタン
  - 「一覧に戻る」ボタン

### 4.3 `/match/[id]`（セッション詳細・スコア入力）
- ヘッダ
  - 左: セッション名
  - 右: 「戻る」(`/match`)、`PDF出力`
- セッション情報
  - 日付、プレイヤー数、ゲーム数を表示
- ゲーム一覧
  - 各行に以下を表示
    - ゲーム番号
    - チーム1／チーム2のプレイヤー名の一覧
    - 休みプレイヤー（team=0）の一覧（いなければ「-」）
    - チーム1スコア／チーム2スコア（Select: 0,15,30,45,60,75）
    - 勝者チーム（Select: 1/2）
    - 「結果保存」ボタン
- プレイヤー別 勝利数（小計）
  - Chip 形式で `[プレイヤー名]: [勝利数]勝` を一覧表示

## 5. 入出力仕様

### 5.1 tRPC 入力スキーマ（概略）
- `createSessionSchema`（`~/lib/validations/match.schema`）
  - name: string（必須）
  - date: Date（必須）
  - players: { id: string; name: string; userId: string | null }[]（必須, 長さ>=4）
- `updateGameResultSchema`
  - gameId: string（必須）
  - playerScores: { playerId: string; score: number }[]（必須）
  - winner: 1 | 2（必須）

### 5.2 API一覧（マッチング機能）

| API名 | 種別 | 権限 | 入力 | 出力 | 主なエラー |
|---|---|---|---|---|---|
| match.create | mutation | 要ログイン | createSessionSchema | { id, name, date, playerCount, gameCount, createdBy, createdAt, updatedAt } | BAD_REQUEST(検証/業務エラー) |
| match.getAll | query | 要ログイン | なし | MatchSession の公開情報リスト | INTERNAL_SERVER_ERROR |
| match.getSelectablePlayers | query | 要ログイン | なし | { id, name, userId }[]（role=player のみ、name 非空） | - |
| match.getById | query | 要ログイン | { id: string } | セッション＋ゲーム＋プレイヤーの詳細 | NOT_FOUND, INTERNAL_SERVER_ERROR |
| match.updateGameResult | mutation | 要ログイン | updateGameResultSchema | { success: true } | BAD_REQUEST(検証/業務エラー) |
| match.delete | mutation | 要ログイン | { id: string } | { success: true } | BAD_REQUEST(未存在/業務エラー) |
| match.generatePDF | query | 要ログイン | なし | { pdf: base64 string, filename: string } | INTERNAL_SERVER_ERROR |
| match.generateSessionPDF | query | 要ログイン | { id: string } | { pdf: base64 string, filename: string } | NOT_FOUND, INTERNAL_SERVER_ERROR |

## 6. データ設計（参照）
詳細なテーブル定義・制約・ER 図は「DB 設計書」を参照してください。

- DB 設計書: `docs/dbdesign/db-design.md`
- 実装スキーマ: `prisma/schema.prisma` の `MatchSession`, `MatchGame`, `MatchGamePlayer` 等

## 7. 例外・エラーハンドリング

- バリデーション（Zod）
  - セッション名: 非空チェック
  - プレイヤー配列: 4人以上、name 非空（サーバ／クライアント両方で検証）
  - `updateGameResultSchema`: gameId 必須、playerScores の存在・型を確認
- 業務エラー
  - セッション作成時: プレイヤー数不足などで Error を投げ、tRPC では BAD_REQUEST として返却
  - セッション取得時: 見つからない場合は NOT_FOUND を返却
  - PDF 生成時: 例外発生時は INTERNAL_SERVER_ERROR とし、「PDFの生成に失敗しました」をメッセージとして返却
- UI 側
  - API エラー時は Alert または `alert()` でエラーメッセージを表示
  - スコア更新・PDF生成中はローディング状態（Backdrop/CircularProgress やボタンの disabled 表示）を行う

