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
npm run db:seed            # テストユーザーを作成
npm run db:setup-e2e       # E2Eテスト用データベースをセットアップ
```

**注意:** `prisma generate` は postinstall フックにより `npm install` 時に自動実行されます。

### テスト
```bash
# 単体テスト
npm run test               # watchモードでテスト実行
npm run test:unit          # 単体テストのみ実行
npm run test:ui            # UIモードでテスト実行
npm run test:coverage      # カバレッジレポート生成

# 統合テスト
npm run test:integration   # 統合テストのみ実行

# E2Eテスト
npm run test:e2e           # E2Eテスト実行
npm run test:e2e:ui        # UIモードでE2Eテスト実行
npm run test:e2e:debug     # デバッグモードでE2Eテスト実行

# すべてのテスト
npm run test:all           # 単体・統合・E2Eすべて実行
```

**詳細:** テストの詳細については `docs/TESTING.md` を参照してください。

## CI/CD

GitHub Actionsによる継続的インテグレーション（CI）が設定されています。

### 自動実行される内容

- **Lint and Type Check**: コード品質チェックと型チェック
- **Unit Tests**: 単体テスト
- **Integration Tests**: データベースを使った統合テスト
- **E2E Tests**: ブラウザを使ったE2Eテスト

### トリガー

- `master` または `main` ブランチへのプッシュ
- `master` または `main` ブランチへのプルリクエスト

**設定ファイル:** `.github/workflows/ci.yml`

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
import { createFeatureSchema } from "~/lib/validations/feature.schema";

export const featureRouter = createTRPCRouter({
  action: adminProcedure
    .input(createFeatureSchema)  // 共有スキーマを使用
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

### バリデーションスキーマの管理

クライアントとサーバーでバリデーションロジックを共有するため、スキーマは `src/lib/validations/` に定義します：

```typescript
// src/lib/validations/feature.schema.ts
import { z } from "zod";

// サーバー側で使用するスキーマ（API入力）
export const createFeatureSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  // ...
});

export const updateFeatureSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "名前は必須です").optional(),
  // ...
});

// クライアント側フォームで使用するスキーマ
export const featureFormSchema = createFeatureSchema.omit({ /* 除外フィールド */ });
export const featureFormUpdateSchema = updateFeatureSchema.omit({ id: true });

// 型エクスポート
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

**参考実装:** `src/lib/validations/user.schema.ts` と `src/server/api/routers/user.ts`

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

### レイアウトシステム

アプリケーションは以下のレイアウトコンポーネントで構成されています：

- **Header** (`src/components/layout/header.tsx`):
  - 検索バー
  - 通知アイコン
  - ライト/ダークモード切り替えボタン
  - ユーザーメニュー（プロフィール、ログアウト）
  - レスポンシブ対応（モバイルでは一部要素を非表示）

- **Sidebar** (`src/components/layout/sidebar.tsx`):
  - ナビゲーションメニュー
  - マスタメニューの折りたたみ機能
  - レスポンシブ対応（モバイル: temporary、デスクトップ: persistent）

- **MainLayout** (`src/components/layout/main-layout.tsx`):
  - Header + Sidebar + Contentのレイアウト統合
  - ページ遷移時のサイドバー自動クローズ（モバイル）

### テーマシステム

ライト/ダークモードのテーマ切り替えを実装：

- **ThemeProvider** (`src/providers/theme-provider.tsx`):
  - `useThemeMode()` フックでテーマ状態とトグル関数を提供
  - localStorageに設定を保存
  - SSR/クライアント間のハイドレーションエラーを回避

- **テーマ定義** (`src/theme/theme.ts`):
  - `lightTheme` と `darkTheme` をMUIのcreateThemeで定義
  - テーブル、Paper、ボタンなどのカスタマイズ

```typescript
// テーマの使用例
import { useThemeMode } from "~/providers/theme-provider";

function MyComponent() {
  const { mode, toggleTheme } = useThemeMode();
  // ...
}
```

### フォーム管理

**React Hook Form + Zod** を使用した型安全なフォーム管理：

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userFormSchema } from "~/lib/validations/user.schema";

const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(userFormSchema),
  defaultValues: { /* ... */ },
});
```

**重要:** バリデーションスキーマは `src/lib/validations/` に共通定義し、クライアントとサーバーで共有してください。

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
- `Dialog` - モーダル用（標準のalert/confirmは使用禁止）
- `Table` コンポーネント - データテーブル用
- `Chip` - バッジとタグ用
- `Backdrop` + `CircularProgress` - ローディング表示
- `TablePagination` - ページネーション

**レスポンシブデザイン:**
```typescript
// MUIのsxプロパティでブレークポイント対応
<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
  内容
</TableCell>
```

ブレークポイント：
- `xs`: 0px（モバイル）
- `sm`: 600px（タブレット）
- `md`: 900px（小型デスクトップ）
- `lg`: 1200px（デスクトップ）

### ダイアログの使用

**標準のalert/confirmは使用禁止** です。代わりにMUIの`Dialog`コンポーネントを使用：

```typescript
// 確認ダイアログの例
<Dialog open={confirmOpen} onClose={handleClose}>
  <DialogTitle>確認</DialogTitle>
  <DialogContent>
    <DialogContentText>
      この操作を実行してもよろしいですか？
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>キャンセル</Button>
    <Button onClick={handleConfirm} variant="contained">
      実行
    </Button>
  </DialogActions>
</Dialog>
```

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

このプロジェクトには包括的なテスト基盤が整っています。

### テストの種類

1. **単体テスト** (`tests/unit/`) - ドメインロジック、値オブジェクト、エンティティ、ユースケースのテスト
2. **統合テスト** (`tests/integration/`) - リポジトリとデータベースの統合テスト
3. **E2Eテスト** (`tests/e2e/`) - Playwrightによるブラウザテスト

### テストファイルの配置

```
tests/
├── unit/                    # 単体テスト
│   └── user/
│       ├── domain/          # ドメイン層のテスト
│       │   ├── entities/
│       │   └── value-objects/
│       └── application/     # アプリケーション層のテスト
│           └── use-cases/
├── integration/             # 統合テスト
│   └── user/
│       └── infrastructure/
│           └── repositories/
├── e2e/                     # E2Eテスト
│   ├── login.spec.ts
│   └── users.spec.ts
└── helpers/                 # テストヘルパー
    ├── db-helper.ts
    ├── mock-helper.ts
    └── test-factory.ts
```

### テストの書き方

**単体テスト例:**
```typescript
// tests/unit/user/domain/value-objects/password.vo.test.ts
import { describe, it, expect } from "vitest";
import { Password } from "~/modules/user/domain/value-objects/password.vo";

describe("Password Value Object", () => {
  it("8文字以上のパスワードでPasswordオブジェクトを作成できる", async () => {
    const password = await Password.createFromPlainText("password123");
    expect(password).toBeInstanceOf(Password);
  });
});
```

**統合テスト例:**
```typescript
// tests/integration/user/infrastructure/repositories/prisma-user.repository.integration.test.ts
import { describe, it, beforeEach, afterAll } from "vitest";
import { getTestDb, cleanupDatabase, disconnectDb } from "../../../../helpers/db-helper";

describe("PrismaUserRepository Integration Test", () => {
  const db = getTestDb();

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("新しいユーザーを作成できる", async () => {
    // テストコード
  });
});
```

### インポートのルール

- ソースコードへのインポート: `~` エイリアスを使用
  ```typescript
  import { User } from "~/modules/user/domain/entities/user.entity";
  ```
- テストヘルパーへのインポート: 相対パスを使用
  ```typescript
  import { TestFactory } from "../../../helpers/test-factory";
  ```

### テストの実行

```bash
npm run test:unit          # 単体テストのみ
npm run test:integration   # 統合テストのみ
npm run test:e2e           # E2Eテストのみ
npm run test:all           # すべてのテスト
```

**詳細:** 詳しくは `docs/TESTING.md` を参照してください。

## 追加リソース

- [T3 Stack ドキュメント](https://create.t3.gg/)
- [tRPC ドキュメント](https://trpc.io/)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [Material-UI ドキュメント](https://mui.com/)
