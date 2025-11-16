# DB 設計書

本書は Tennis Mate 2 のデータモデル（Prisma 準拠）に関する統合ドキュメントです。ユーザー／認証、施設・コート、レッスン、マッチング・スコア記録といった領域を横断的に記載し、機能別の基本設計書から参照されます。

## 1. 前提
- 実装スキーマ: `prisma/schema.prisma`
- OR/M: Prisma（生成物は `generated/prisma`）
- 文字列型は Prisma の `String`、日時は `DateTime`、数値は `Int`、真偽値は `Boolean`、JSON は `Json`

## 2. テーブル定義

### 2.1 User
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | cuid() | 内部ID |
| name | String | No | - | - | - | 表示名 |
| email | String | No | - | Unique | - | ログイン用（NULL許容） |
| emailVerified | DateTime | No | - | - | - | メール認証日時 |
| image | String | No | - | - | - | アイコンURL等 |
| passwordHash | String | No | - | - | - | bcrypt ハッシュ |
| role | Role(enum) | Yes | - | - | player | player/coach/operator/admin |
| userId | String | No | - | Unique | - | 表示用ユーザーID（NULL許容） |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| User_pkey | PK | id | - |
| User_email_key | Unique | email | NULL許容 |
| User_userId_key | Unique | userId | NULL許容 |

関連
- 1 — * Account
- 1 — * Session
- 1 — * Post（createdBy）
- 1 — * LessonSlot（coachId, optional）
- 1 — * LessonReservation
- 1 — * Reservation
- 1 — 1 PlayerProfile
- 1 — * MatchGamePlayer（optional）
- 1 — * MatchRequest
- 1 — * ScoreRecord（player/opponent として）

### 2.2 Account（NextAuth）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | cuid() | - |
| userId | String | Yes | FK | - | - | - | → User.id（onDelete: Cascade） |
| type | String | Yes | - | - | - | provider の種別 |
| provider | String | Yes | - | - | - | "google" など |
| providerAccountId | String | Yes | - | - | - | 複合Unique対象 |
| refresh_token | String | No | - | - | - | - |
| access_token | String | No | - | - | - | - |
| expires_at | Int | No | - | - | - | - |
| token_type | String | No | - | - | - | - |
| scope | String | No | - | - | - | - |
| id_token | String | No | - | - | - | - |
| session_state | String | No | - | - | - | - |
| refresh_token_expires_in | Int | No | - | - | - | - |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| Account_pkey | PK | id | - |
| Account_provider_providerAccountId_key | Unique | (provider, providerAccountId) | 複合Unique |

### 2.3 Session（NextAuth）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | cuid() | - |
| sessionToken | String | Yes | - | Unique | - | - |
| userId | String | Yes | FK | - | - | - | → User.id（onDelete: Cascade） |
| expires | DateTime | Yes | - | - | - | - |

### 2.4 VerificationToken（NextAuth）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| identifier | String | Yes | - | - | - | メールアドレスなど |
| token | String | Yes | - | Unique | - | トークン |
| expires | DateTime | Yes | - | - | - | 有効期限 |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| VerificationToken_identifier_token_key | Unique | (identifier, token) | 複合Unique |
| VerificationToken_token_key | Unique | token | - |

### 2.5 Post（サンプル/汎用投稿）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | Int | Yes | PK | - | autoincrement() | 内部ID |
| name | String | Yes | - | - | - | タイトル |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| updatedAt | DateTime | Yes | - | - | updatedAt | 更新日時 |
| createdById | String | Yes | FK | - | - | → User.id |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| Post_pkey | PK | id | - |
| Post_name_idx | Index | name | 検索用 |

---

### 2.6 Facility
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 施設ID |
| name | String | Yes | - | - | - | 施設名 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| updatedAt | DateTime | Yes | - | - | - | 更新日時 |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| Facility_pkey | PK | id | - |
| Facility_name_idx | Index | name | 検索用 |

### 2.7 Court
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | コートID |
| name | String | Yes | - | - | - | コート名 |
| facilityId | String | Yes | FK | - | - | → Facility.id（onDelete: Cascade） |

制約/インデックス
| 名称 | 種別 | 対象 | 備考 |
|---|---|---|---|
| Court_pkey | PK | id | - |
| Court_facilityId_name_idx | Index | (facilityId, name) | 検索用 |

関連
- Facility 1 — * Court
- Court 1 — * LessonSlot
- Court 1 — * Reservation

### 2.8 ImportJob（インポート実行履歴）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | ジョブID |
| type | String | Yes | - | - | - | ジョブ種別 |
| source | String | No | - | - | - | インポート元 |
| status | String | Yes | - | - | "pending" | pending/running/done 等 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| finishedAt | DateTime | No | - | - | - | 完了日時 |
| added | Int | Yes | - | - | 0 | 追加件数 |
| updated | Int | Yes | - | - | 0 | 更新件数 |
| removed | Int | Yes | - | - | 0 | 削除件数 |

### 2.9 LessonPolicy（レッスン方針・料金）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | ポリシーID |
| lessonType | String | Yes | - | Unique | - | レッスン種別 |
| priceYen | Int | No | - | - | - | 料金（円） |
| cancelDeadlineHours | Int | No | - | - | - | キャンセル締切（h） |
| penaltyApplicable | Boolean | Yes | - | - | false | キャンセルペナルティ対象か |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

### 2.10 LessonSlot（レッスンスロット）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | スロットID |
| courtId | String | Yes | FK | 複合Unique | - | → Court.id |
| coachId | String | No | FK | - | - | → User.id（NULL許容） |
| capacity | Int | Yes | - | - | 1 | 定員（>=1） |
| dayOfWeek | String | Yes | - | 複合Unique | - | "monday".."sunday" |
| startTime | String | Yes | - | 複合Unique | - | HH:mm |
| endTime | String | Yes | - | - | - | HH:mm（start+duration） |
| duration | String | Yes | - | - | - | "60"/"90"/"120"（分） |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- 複合ユニーク: (courtId, dayOfWeek, startTime)
- 複合インデックス: (courtId, dayOfWeek, startTime)

### 2.11 LessonReservation（レッスン予約）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 予約ID |
| slotId | String | Yes | FK | - | - | → LessonSlot.id（onDelete: Cascade） |
| userId | String | Yes | FK | - | - | → User.id |
| status | String | Yes | - | - | "confirmed" | 予約ステータス |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

関連
- LessonSlot 1 — * LessonReservation
- User 1 — * LessonReservation

### 2.12 PlayerProfile（プレイヤープロファイル）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | プロファイルID |
| userId | String | Yes | FK | Unique | - | → User.id（onDelete: Cascade） |
| level | Int | Yes | - | - | 3 | レベル（3を基準） |
| area | String | No | - | - | - | 活動エリア |
| available | Json | No | - | - | - | 利用可能時間帯など |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- Unique: userId（1ユーザー1プロファイル）

### 2.13 MatchRequest（対戦募集）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | リクエストID |
| userId | String | Yes | FK | - | - | → User.id（onDelete: Cascade） |
| start | DateTime | Yes | - | - | - | 希望開始日時 |
| end | DateTime | Yes | - | - | - | 希望終了日時 |
| levelMin | Int | No | - | - | - | 最低レベル |
| levelMax | Int | No | - | - | - | 最高レベル |
| area | String | No | - | - | - | 希望エリア |
| status | String | Yes | - | - | "open" | open/matched/closed 等 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- Index: (start, end)

### 2.14 MatchProposal（対戦提案）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 提案ID |
| fromUser | String | Yes | - | - | - | 提案元ユーザーID |
| toUser | String | Yes | - | - | - | 提案先ユーザーID |
| start | DateTime | Yes | - | - | - | 提案開始日時 |
| end | DateTime | Yes | - | - | - | 提案終了日時 |
| message | String | No | - | - | - | メッセージ |
| status | String | Yes | - | - | "pending" | pending/accepted/rejected 等 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- Index: (toUser, status)

### 2.15 Reservation（コート予約）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 予約ID |
| courtId | String | Yes | FK | - | - | → Court.id（onDelete: Cascade） |
| userId | String | Yes | FK | - | - | → User.id（onDelete: Cascade） |
| start | DateTime | Yes | - | - | - | 予約開始 |
| end | DateTime | Yes | - | - | - | 予約終了 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- Index: (courtId, start, end)
- Index: (userId, start, end)

### 2.16 ScoreRecord（スコア記録）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 記録ID |
| playerId | String | Yes | FK | - | - | → User.id |
| opponentId | String | Yes | FK | - | - | → User.id |
| date | DateTime | Yes | - | - | - | 試合日 |
| result | String | Yes | - | - | - | 勝敗・スコア等 |
| createdAt | DateTime | Yes | - | - | now() | 記録日時 |

制約/インデックス
- Index: (playerId, date)

---

### 2.17 MatchSession（マッチングセッション）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | セッションID |
| name | String | Yes | - | - | - | セッション名 |
| date | DateTime | Yes | - | - | - | 実施日 |
| playerCount | Int | Yes | - | - | - | 参加プレイヤー数 |
| createdBy | String | Yes | - | - | - | 作成者 User.id |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| updatedAt | DateTime | Yes | - | - | updatedAt | 更新日時 |

制約/インデックス
- Index: (date)
- Index: (createdBy)

関連
- MatchSession 1 — * MatchGame

### 2.18 MatchGame（セッション内ゲーム）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | ゲームID |
| sessionId | String | Yes | FK | - | - | → MatchSession.id（onDelete: Cascade） |
| gameNumber | Int | Yes | - | - | - | セッション内通し番号 |
| status | String | Yes | - | - | "scheduled" | scheduled/in_progress/completed 等 |
| winner | Int | No | - | - | - | 勝者チーム（1 or 2） |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| updatedAt | DateTime | Yes | - | - | updatedAt | 更新日時 |

制約/インデックス
- Index: (sessionId, gameNumber)

関連
- MatchGame 1 — * MatchGamePlayer

### 2.19 MatchGamePlayer（ゲーム参加プレイヤー）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 行ID |
| gameId | String | Yes | FK | - | - | → MatchGame.id（onDelete: Cascade） |
| userId | String | No | FK | - | - | → User.id（NULL許容, onDelete: SetNull） |
| playerName | String | Yes | - | - | - | 表示名（ダミー可） |
| team | Int | Yes | - | - | - | 0=休み, 1/2=チーム番号 |
| position | Int | Yes | - | 複合Unique | - | ゲーム内ポジション |
| score | Int | No | - | - | - | 個人スコア |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

制約/インデックス
- Unique: (gameId, position)
- Index: (gameId)

関連
- MatchGame 1 — * MatchGamePlayer
- User 1 — * MatchGamePlayer（任意）

## 3. 更新内容（概要）

- ユーザー関連
  - 作成: User 1 行挿入、`passwordHash` にハッシュ化済パスワードを保存
  - 更新: 差分更新（password 指定時は `passwordHash` 再計算）
  - 削除: User 物理削除（Account/Session/関連レコードは onDelete 設定に従う）

- レッスン関連
  - LessonSlot 作成: 1 行挿入（`endTime` は `startTime + duration` で算出）
  - LessonReservation 作成: Slot/User を参照して 1 行挿入
  - 削除: LessonSlot, LessonReservation は原則物理削除（ビジネス要件に応じて制御）

- マッチング関連
  - MatchSession 作成: `CreateMatchSessionUseCase` により 1 セッションと複数 MatchGame/MatchGamePlayer をまとめて作成
  - スコア更新: `UpdateGameResultUseCase` により MatchGame.status/winner と MatchGamePlayer.score を更新
  - MatchSession 削除: セッション削除時に紐づく MatchGame/MatchGamePlayer を onDelete: Cascade で削除

- 予約/スコア記録
  - Reservation: Court/User を参照してコート予約を追加・削除
  - ScoreRecord: 対戦結果を 1 行として履歴保存（プレイヤー別にインデックス）

## 4. ER 図（テキスト概要）

- User 1 — * Account, User 1 — * Session, User 1 — 1 PlayerProfile
- User 1 — * LessonSlot（coachId, optional）、LessonSlot 1 — * LessonReservation
- Facility 1 — * Court, Court 1 — * LessonSlot, Court 1 — * Reservation
- User 1 — * Reservation
- User 1 — * MatchRequest, User 1 — * MatchGamePlayer
- MatchSession 1 — * MatchGame, MatchGame 1 — * MatchGamePlayer
- User 1 — * ScoreRecord（player/opponent として）
