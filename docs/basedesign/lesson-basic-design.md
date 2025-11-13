# レッスン 基本設計書

本ドキュメントは Tennis Mate 2 における「レッスン（レッスンスロット・マスタ）」機能の基本設計を、実務で使いやすい8項目の構成で記載します。テーブル定義等のDB詳細は別ドキュメントへ分離します。

## 1. 機能概要
- 週次のレッスンスロット（曜日/時刻/コート/コーチ/定員/時間枠）を管理（一覧・作成・更新・削除）
- 一覧はテーブル表示とカレンダー表示を切替可能
- 作成/更新時は時間帯の重複を許容しない（同一コート・同曜日）

## 2. 前提条件／関連機能
- 関連画面
  - レッスンマスタ: `/lessons`
- 関連API（tRPC）: `src/server/api/routers/lesson.ts`（getAll, getCourts, create, update, delete）
- 認証/認可: `next-auth`（JWT strategy）、`src/middleware.ts` による保護（admin/operator のみ操作可）
- 関連マスタ/他機能
  - `Court`（コート一覧）／`User`（コーチ: role=coach）
  - カレンダー表示: FullCalendar（timeGrid / dayGrid）

## 3. 処理フロー
- 一覧取得
  1) `/lessons` で `lesson.getAll` を呼び出し（admin/operator のみ）
  2) GetAllLessonsUseCase → PrismaLessonRepository.findAll → DTO配列
  3) 取得結果に `courtName` を付与（ルーター内で Court 参照）
- 作成
  1) 「新規作成」→ ダイアログ表示（コート/コーチ/定員/曜日/開始時刻/時間枠）
  2) `lesson.create`（Zod検証→同一コート・同曜日の重複検査→endTime自動算出→保存）
  3) 成功: ダイアログ閉→一覧再取得、失敗: エラー表示
- 更新
  1) 行「編集」またはカレンダーイベントクリック
  2) `lesson.update`（存在確認→必要時endTime再算出→重複検査→保存）
  3) 成功: ダイアログ閉→一覧再取得、失敗: エラー表示
- 削除
  1) 行「削除」→ 確認ダイアログ
  2) `lesson.delete`（存在確認→削除）
  3) 成功: 一覧更新、失敗: エラー表示

## 4. 画面設計（UI仕様）
- ヘッダ
  - タイトル「レッスンマスタ」、表示切替（テーブル/カレンダー）、新規作成、（将来）フィルタ/エクスポート
- テーブル表示
  - 列: コート／曜日／開始時刻／時間枠（1時間/1時間半/2時間）／定員／操作（編集/削除）
  - ページング: 20/50/100 行
  - 複数選択（将来拡張用）
- カレンダー表示
  - 週表示（timeGridWeek）・月/日切替可、イベントクリックで編集ダイアログ
- 作成/編集ダイアログ
  - 入力: コート（必須）／コーチ（任意）／定員（1以上）／曜日（必須）／開始時刻（HH:mm）／時間枠（60/90/120）
  - ボタン: 作成/更新、キャンセル
  - メッセージ: 入力エラー、重複エラー、一般エラー
- 削除確認
  - メッセージ: 「このレッスンを削除してもよろしいですか?」

## 5. 入出力仕様
- 入力（作成）: `createLessonSchema`
  - courtId: string(必須)
  - coachId: string|null（任意）
  - capacity: number(int, >=1)
  - dayOfWeek: enum(monday..sunday)
  - startTime: string(HH:mm)
  - duration: enum("60"|"90"|"120")
- 入力（更新）: `updateLessonSchema`
  - id: string(必須)
  - courtId/coachId/capacity/dayOfWeek/startTime/duration: 任意（指定時は上記と同制約）
- 出力（DTO: LessonDto）
  - id, courtId, coachId, capacity, dayOfWeek, startTime, endTime, duration, createdAt（ルーターで courtName 付与）

### API一覧（レッスン機能）

| API名 | 種別 | 権限 | 入力 | 出力 | 主なエラー |
|---|---|---|---|---|---|
| lesson.getAll | query | admin/operator | なし | LessonDto[]（+courtName） | FORBIDDEN |
| lesson.getCourts | query | admin/operator | なし | { id, name }[] | FORBIDDEN |
| lesson.create | mutation | admin/operator | createLessonSchema | LessonDto | BAD_REQUEST(重複/検証), FORBIDDEN |
| lesson.update | mutation | admin/operator | updateLessonSchema | LessonDto | BAD_REQUEST(重複/検証), FORBIDDEN |
| lesson.delete | mutation | admin/operator | { id: string } | { success: true } | BAD_REQUEST(未存在), FORBIDDEN |

## 6. データ設計（参照）
詳細なテーブル定義・制約・ER 図は「DB 設計書」を参照してください。

- DB 設計書: `docs/dbdesign/db-design.md`
- 実装スキーマ: `prisma/schema.prisma` の `LessonSlot`, `Court`, `Facility`, `LessonReservation` 等

## 7. 例外・エラーハンドリング
- バリデーション（Zod）
  - コート: 必須、定員: 1以上、開始時刻: HH:mm、時間枠: 60/90/120
- 業務エラー
  - 重複: 「同じコート、同じ曜日の時間帯が既存のレッスンと重複しています」
  - 存在なし: 「レッスンが見つかりません」
- 認可
  - 未認証/権限不足: FORBIDDEN（「管理者権限が必要です」）
- UI 表示
  - 入力エラーはフィールド下に表示、業務/認可エラーはダイアログで表示

## 8. 備考・テスト観点
- 主な確認観点
  - 時間帯重複検知（start1 < end2 かつ end1 > start2）
  - endTime 自動算出（start+duration）
  - カレンダー表示の整合（週起点・ロケール）
  - 権限（admin/operator のみ）
- 参照資料
  - テスト仕様書: `docs/tests/lesson-test-spec.md`
  - バリデーション: `src/lib/validations/lesson.schema.ts`
  - API: `src/server/api/routers/lesson.ts`
  - ドメイン/UC: `src/modules/lesson/domain/*`, `src/modules/lesson/application/*`
