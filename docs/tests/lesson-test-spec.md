# Lesson 機能 テスト仕様書

本仕様書は、Lesson 機能に対して追加した単体/統合/E2Eテストの確認観点・手順をまとめたものです。UI・ドメイン・ユースケース・API・画面の一連の正常/異常系を対象とします。

## 対象範囲
- フロントエンド（画面/コンポーネント）
  - `src/app/lessons/page.tsx`
  - `src/app/lessons/_components/lesson-table.tsx`
  - `src/app/lessons/_components/lesson-dialog.tsx`
  - `src/app/lessons/_components/lesson-calendar.tsx`
- ドメイン/アプリケーション
  - `src/modules/lesson/domain/entities/lesson.entity.ts`
  - `src/modules/lesson/application/use-cases/*`
- API（tRPC ルーター）
  - `src/server/api/routers/lesson.ts`

## 前提条件 / 環境
- Node/Next.js、Vitest、Playwright、Prisma の実行環境
- E2E用DBセットアップを事前に実施（テストユーザー/施設/コート）
  - `npm run db:setup-e2e`
  - 管理者: `admin@example.com` / `password123`
  - 一般: `player@example.com` / `password123`
  - コート: `コート1 (court1)`, `コート2 (court2)`
- 実行コマンド
  - 単体（全体）: `npm run test:unit`
  - 統合: `npm run test:integration`
  - E2E: `npm run test:e2e`

## テスト観点（概略）
- UI表示/遷移/ダイアログ操作
- バリデーション（Zod）とエラーハンドリング
- ビジネス制約（時間帯重複不可、定員、終了時刻の自動計算）
- 権限（admin/operator のみ操作可）
- API経由のデータ取得/整形（`courtName` 付与）

---

## 単体テスト（フロント）
ファイル: `tests/unit/lessons/page.test.tsx`

- LES-U01: ローディング表示
  - 手順: `api.lesson.getAll.useQuery` を `isLoading: true` でモック → 画面描画
  - 期待: プログレス（role=progressbar）が表示される

- LES-U02: 一覧表示と新規作成/編集ダイアログ
  - 手順: 2件のレッスンをモック → ヘッダ/テーブルの表示確認 → 「新規作成」クリックで新規作成ダイアログ表示 → キャンセルで閉じる → 1行目「編集」クリックで編集ダイアログ表示
  - 期待: 文言「レッスン新規作成」/「レッスン編集」が正しく表示される

備考: `MainLayout` と `~/trpc/react` の hooks をモックし、UIにフォーカス。

## 単体テスト（バックエンド）
- エンティティ: `tests/unit/lesson/domain/entities/lesson.entity.test.ts`
  - LES-D01: create 正常（値保持）
  - LES-D02: capacity < 1 はエラー
  - LES-D03: startTime >= endTime はエラー
  - LES-D04: canBeBooked 判定（予約数 < capacity で true）
  - LES-D05: toPublicData 変換

- Create ユースケース: `tests/unit/lesson/application/use-cases/create-lesson.use-case.test.ts`
  - LES-UC01: 重複なしで作成・endTime自動計算（09:00 + 90 → 10:30）
  - LES-UC02: 同一コート/曜日で時間帯重複はエラー

- Update ユースケース: `tests/unit/lesson/application/use-cases/update-lesson.use-case.test.ts`
  - LES-UU01: 対象なしでエラー
  - LES-UU02: capacityのみ更新（endTime据え置き）
  - LES-UU03: startTime変更でendTime再計算
  - LES-UU04: 他レッスンと重複でエラー

- GetAll ユースケース: `tests/unit/lesson/application/use-cases/get-all-lessons.use-case.test.ts`
  - LES-UG01: findAll→DTO配列にマッピング

- Delete ユースケース: `tests/unit/lesson/application/use-cases/delete-lesson.use-case.test.ts`
  - LES-UD01: 対象なしでエラー
  - LES-UD02: 削除成功

## 統合テスト（API）
ファイル: `tests/integration/lesson/server/api/routers/lesson.router.integration.test.ts`

- LES-IT01: getCourts でシード済みのコート一覧取得
  - 手順: 施設/コートをシード → admin セッションで `lesson.getCourts()` 呼び出し
  - 期待: 2件のコートが取得でき、IDが一致

- LES-IT02: CRUD フロー（create → getAll → update → delete）
  - 期待:
    - create: endTime自動計算（09:00 + 90 → 10:30）
    - getAll: `courtName` が付与されている（例: Aコート）
    - update: startTime 変更で endTime 再計算（10:00 + 90 → 11:30）
    - delete: 一覧が空になる

- LES-IT03: 権限（player）は getAll で FORBIDDEN
  - 期待: 例外（管理者権限が必要です / FORBIDDEN）

## E2Eテスト（画面）
ファイル: `tests/e2e/lessons.spec.ts`

- LES-E01: 一覧表示と新規作成ダイアログ表示
  - 手順: admin でログイン → `/lessons` → 「新規作成」クリック
  - 期待: ヘッダ「レッスンマスタ」、ダイアログ「レッスン新規作成」表示

- LES-E02: 作成→編集→削除の正常フロー
  - 手順: 新規作成（曜日:火曜、定員:2、時刻デフォルト）→ 行表示確認 → 編集（定員を5）→ 行更新確認 → 削除→確認→削除
  - 期待: 各操作成功、該当行が削除される

- LES-E03: バリデーション（定員1未満）
  - 手順: 定員0で作成
  - 期待: 「定員は1以上である必要があります」表示、ダイアログは閉じない

- LES-E04: 重複エラー（作成時）
  - 手順: 月曜09:00/60分を作成 → 月曜09:30/60分で作成
  - 期待: エラーダイアログ「重複しています」表示、作成されない

- LES-E05: 削除キャンセル
  - 手順: 行の削除→確認ダイアログ→キャンセル
  - 期待: 行は残る

- LES-E06: 編集時の重複
  - 手順: 09:00/60分 と 10:00/60分 を用意 → 後者を 09:30 に変更
  - 期待: エラーダイアログ「重複しています」表示

- LES-E07: 開始時刻フォーマットエラー
  - 手順: 「25:00」で作成
  - 期待: 「HH:mm形式で入力してください」表示

- LES-E08: 未ログインアクセス
  - 手順: `/lessons` へ直接アクセス
  - 期待: `/login` へリダイレクト、ログイン画面表示

- LES-E09: 権限不足（player）
  - 手順: player でログイン → `/lessons` → 作成
  - 期待: エラーダイアログ「管理者権限が必要です」表示

## 備考
- UI単体は hooks/レイアウトをモックし、UI状態遷移に集中
- 重複判定は `(start1 < end2) AND (end1 > start2)` を採用
- 文言・ロケールが変わる場合はE2E期待値の更新が必要
- 追加観点例: カレンダービューでのイベントクリック動作/フィルター操作/エクスポート操作
