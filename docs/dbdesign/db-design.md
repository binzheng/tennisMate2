# DB 設計書

本書は Tennis Mate 2 のデータモデル（Prisma 準拠）に関する統合ドキュメントです。ユーザー領域とレッスン領域の設計を一つに集約し、機能別の基本設計書から参照されます。

## 1. 前提
- 実装スキーマ: `prisma/schema.prisma`
- OR/M: Prisma（生成物は `generated/prisma`）
- 文字列型は Prisma の `String`、日時は `DateTime`、数値は `Int`

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

### 2.2 Account（NextAuth）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | cuid() | - |
| userId | String | Yes | FK | - | - | - | → User.id（onDelete: Cascade） |
| type | String | Yes | - | - | - | - |
| provider | String | Yes | - | - | - | - |
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

### 2.4 Facility
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 施設ID |
| name | String | Yes | - | - | - | 施設名 |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |
| updatedAt | DateTime | Yes | - | - | - | 更新日時 |

### 2.5 Court
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | コートID |
| name | String | Yes | - | - | - | コート名 |
| facilityId | String | Yes | FK | - | - | → Facility.id（onDelete: Cascade） |

### 2.6 LessonSlot（レッスンスロット）
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

制約/インデックス（LessonSlot）
- 複合ユニーク: (courtId, dayOfWeek, startTime)
- 複合インデックス: (courtId, dayOfWeek, startTime)

### 2.7 LessonReservation（参考）
| 名称 | 型 | 必須 | 主キー | ユニーク | 既定値 | 備考 |
|---|---|---|---|---|---|---|
| id | String | Yes | PK | - | - | 予約ID |
| slotId | String | Yes | FK | - | - | → LessonSlot.id |
| userId | String | Yes | FK | - | - | → User.id |
| status | String | Yes | - | - | "confirmed" など |
| createdAt | DateTime | Yes | - | - | now() | 作成日時 |

## 3. 更新内容
- ユーザー関連
  - 作成: User 1 行挿入、`passwordHash` にハッシュ化済パスワードを保存
  - 更新: 差分更新（password 指定時は `passwordHash` 再計算）
  - 削除: User 物理削除（Account/Session は onDelete: Cascade、LessonSlot.coachId は NULL 許容）
- レッスン関連
  - 作成: LessonSlot 1 行挿入（endTime は startTime + duration で算出）
  - 更新: 差分更新（start/duration 変更時は endTime 再計算）
  - 削除: LessonSlot 物理削除（予約がある場合は要件に応じた制御を検討）

## 4. ER 図（参考）
- User 1 — * Account, User 1 — * Session
- Facility 1 — * Court
- Court 1 — * LessonSlot
- User 1 — * LessonSlot（coachId, optional）
- LessonSlot 1 — * LessonReservation

