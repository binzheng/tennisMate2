# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Tennis Mate 2は、テニス施設管理のためのフルスタックTypeScriptアプリケーションです。T3スタックとクリーンアーキテクチャの原則に基づいて構築されています。ユーザー、施設、コート、予約、レッスン、プレイヤーマッチングを管理します。

**技術スタック:** Next.js 15 (App Router), tRPC, Prisma (PostgreSQL), NextAuth, Material-UI, Tailwind CSS

## 開発コマンド

### アプリケーションの起動
```bash
npm run dev          # Turbopack開発サーバーを起動 (http://localhost:3000)
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバーを起動
npm run preview      # ビルドしてプロダクションサーバーを起動
npm run typecheck    # ファイル出力なしで型チェック
```

### コード品質
```bash
npm run check              # Biomeでリントとフォーマットをチェック
npm run check:write        # フォーマットの問題を自動修正
npm run check:unsafe       # 安全でない変換も含めて自動修正
```

### データベース操作
```bash
npm run db:push            # スキーマをデータベースにプッシュ（マイグレーションなし）
npm run db:generate        # 新しいマイグレーションを作成して適用
npm run db:migrate         # マイグレーションを本番環境にデプロイ
npm run db:studio          # Prisma Studio GUIを開く (http://localhost:5555)
```

**注意:** `prisma generate` は postinstall フックにより `npm install` 時に自動実行されます。

## アーキテクチャ

### クリーンアーキテクチャの構造

このコードベースは、明確な関心の分離を持つ**クリーンアーキテクチャ**に従っています。新機能は `src/modules/[feature-name]/` 配下にモジュールとして整理してください：

```
src/modules/[feature-name]/
├── domain/
│   ├── entities/          # ドメインロジックを持つビジネスエンティティ
│   ├── repositories/      # リポジトリインターフェース（契約）
│   └── value-objects/     # バリデーション付きイミュータブルな値オブジェクト
├── application/
│   ├── use-cases/         # ビジネスユースケース（オーケストレーション層）
│   └── dto/               # データ転送オブジェクト
└── infrastructure/
    └── repositories/      # リポジトリ実装（Prismaなど）
```

**例:** `user` モジュールがこのパターンを完全に示しています。

### 依存関係ルール

1. **Domain層** は何にも依存しない（純粋なビジネスロジック）
2. **Application層** はドメインインターフェースのみに依存
3. **Infrastructure層** はドメインインターフェースを実装
4. **API層 (tRPC)** はユースケースとリポジトリをインスタンス化

### tRPCルーターの統合

tRPCプロシージャを作成する際は、以下のパターンに従ってください：

```typescript
// src/server/api/routers/feature.ts
export const featureRouter = createTRPCRouter({
  action: adminProcedure
    .input(z.object({ /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaFeatureRepository(ctx.db);
      const useCase = new ActionUseCase(repository);
      try {
        return await useCase.execute(input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "エラーが発生しました",
        });
      }
    }),
});
```

次に `src/server/api/root.ts` に登録します：

```typescript
export const appRouter = createTRPCRouter({
  feature: featureRouter,
});
```

## データベーススキーマ

**データベース:** PostgreSQL
**ORM:** Prisma

### コアドメインモデル

- **ユーザー管理:** User, Account, Session, VerificationToken
- **施設:** Facility, Court, Reservation
- **レッスン:** LessonSlot, LessonReservation, LessonPolicy
- **プレイヤーマッチング:** PlayerProfile, MatchRequest, MatchProposal, ScoreRecord
- **管理:** Post, ImportJob

### ユーザーロール

`User` モデルには4つの値を持つ `role` フィールドがあります：
- `player` - 一般プレイヤー
- `coach` - テニスコーチ
- `operator` - 施設オペレーター
- `admin` - システム管理者

### スキーマの変更方法

1. `prisma/schema.prisma` を編集
2. `npm run db:generate` を実行してマイグレーションを作成
3. マイグレーションファイルが `prisma/migrations/` に作成される
4. Prisma Clientが自動再生成される

**開発時のみ:** マイグレーションを作成せずにスキーマを同期するには `npm run db:push` を使用してください。

## 認証と認可

### NextAuth設定

- **プロバイダー:** Discord OAuth (`AUTH_DISCORD_ID` と `AUTH_DISCORD_SECRET` で設定)
- **セッション:** Prisma Adapterによるデータベースバックセッション
- **カスタムフィールド:** セッションには `user.id` と `user.role` が含まれます

### 環境変数

`.env.local` に必須の設定：
```
AUTH_SECRET=<生成方法: npx auth secret>
AUTH_DISCORD_ID=<Discord Developer Portalから取得>
AUTH_DISCORD_SECRET=<Discord Developer Portalから取得>
DATABASE_URL=postgresql://postgres:password@localhost:5432/tennis_mate_2
```

### プロシージャタイプ

認証要件に基づいて以下のtRPCプロシージャタイプを使用してください：

- **`publicProcedure`** - 認証不要
- **`protectedProcedure`** - 有効なセッションが必要（未ログイン時はUNAUTHORIZEDをスロー）
- **`adminProcedure`** - adminまたはoperatorロールが必要（ルーター内のカスタムミドルウェア）

**重要:** カスタムミドルウェアでプロパティにアクセスする前に、必ず `ctx.session?.user` がnullでないかチェックしてください。`publicProcedure` は未認証アクセスを許可します。

## フロントエンドパターン

### コンポーネントの構成

- **サーバーコンポーネント (RSC):** 全ページのデフォルト
- **クライアントコンポーネント:** 以下の場合は `"use client"` ディレクティブでマークする：
  - フック（useState、useEffectなど）を使用する場合
  - tRPCのミューテーション/クエリを使用する場合
  - ユーザーインタラクションを処理する場合

### tRPCクライアントの使用方法

```typescript
// クライアントコンポーネント内で
import { api } from "~/trpc/react";

// クエリ
const { data, isLoading } = api.user.getAll.useQuery();

// キャッシュ無効化を伴うミューテーション
const utils = api.useUtils();
const mutation = api.user.create.useMutation({
  onSuccess: () => {
    void utils.user.getAll.invalidate();
  },
});
```

### UIライブラリ

**プライマリ:** Material-UI (MUI) - 新しいUI開発にはMUIコンポーネントを使用
**セカンダリ:** Tailwind CSS - カスタムユーティリティとスペーシングに使用

よく使うMUIパターン：
- `Container maxWidth="lg"` - ページレイアウト用
- `Box sx={{ ... }}` - flexレイアウト用
- `Dialog` - モーダル用
- `Table` コンポーネント - データテーブル用
- `Chip` - バッジとタグ用

## コードスタイルと規約

### 言語

- **UIテキスト:** 日本語
- **コード:** 英語（変数名、関数名、コメント）
- **エラーメッセージ:** 日本語

### TypeScript

- 厳格な型チェックを使用（デフォルトで有効）
- オブジェクトの型にはinterfaceを優先
- ユニオンとプリミティブにはtypeを優先
- tRPC入力のランタイムバリデーションにはZodを使用

### インポートエイリアス

クリーンなインポートには `~/*` エイリアスを使用：
```typescript
import { db } from "~/server/db";
import { User } from "~/modules/user/domain/entities/user.entity";
```

### フォーマット

- **ツール:** Biome（PrettierやESLintではない）
- **自動フォーマット:** `npm run check:write`
- **ルール:** インポート整理、属性ソート、推奨チェック

## パスワードセキュリティ

パスワードは `src/modules/user/domain/value-objects/password.vo.ts` の `Password` 値オブジェクトで管理されます：

- **ハッシュ化:** bcryptjs、コストファクター10
- **パスワードを返さない:** DTOやAPIレスポンスには含めない
- **常に使用:** 新しいパスワードには `Password.createFromPlainText()` を使用
- **使用方法:** データベースから読み込む際は `Password.fromHash()` を使用

## 共通パターン

### 新しいユースケースの作成

1. `src/modules/[feature]/application/use-cases/[action].use-case.ts` に定義
2. コンストラクタ経由でリポジトリインターフェースを注入
3. `execute()` メソッドでビジネスロジックを実装
4. ドメインエンティティではなくDTOを返す
5. 説明的なエラーをスロー（`Error` またはカスタムエラークラスを使用）

### 新しいエンティティの作成

1. `src/modules/[feature]/domain/entities/[entity].entity.ts` に定義
2. ビジネスロジックメソッドを含める（例：`canPerformAction()`）
3. 静的ファクトリーメソッド `create()` を提供
4. DTO変換用に `toPublicData()` を含める
5. エンティティをフレームワーク非依存に保つ（Prisma型を使わない）

### 新しいルート/ページの追加

1. `src/app/[route]/page.tsx` にページを作成
2. デフォルトでサーバーコンポーネントを使用
3. インタラクティブなページの場合：
   - クライアントコンポーネントとしてマーク（`"use client"`）
   - データ取得にはtRPCフックを使用
   - UIコンポーネントを `_components/` ディレクトリに抽出

## 既知の問題と回避策

### Prisma Clientの型安全性

生成されたPrisma clientは `generated/prisma/` にあります。型をインポートする際は：

```typescript
// インフラストラクチャ層では以下を使用：
import type { db } from "~/server/db";
type PrismaClient = typeof db;

// 以下は使用しない：
import type { PrismaClient } from "~/generated/prisma";
```

### NextAuthのモジュール拡張

カスタムセッションフィールドは `src/server/auth/config.ts` でモジュール拡張により定義されています。`Role` 型は手動で以下のように定義されています：

```typescript
type Role = "player" | "coach" | "operator" | "admin";
```

他の場所でRole型をインポートする必要がある場合は、auth configから再エクスポートするか、共有の型ファイルに定義してください。

## テスト

現在、テストのセットアップは存在しません。テストを実装する際は：

1. ユニットテストにはJestまたはVitestを使用
2. ユースケースを独立してテスト（リポジトリをモック）
3. テストデータベースに対してリポジトリをテスト
4. モックコンテキストでtRPCルーターをテスト
5. コンポーネントテストにはReact Testing Libraryを使用

## 追加リソース

- [T3 Stack ドキュメント](https://create.t3.gg/)
- [tRPC ドキュメント](https://trpc.io/)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [Material-UI ドキュメント](https://mui.com/)
