# GitHub Copilot Instructions for Tennis Mate 2

このファイルは、GitHub Copilotがコードレビューやコード生成を行う際に従うべきルールと基準を定義します。

## プロジェクト概要

Tennis Mate 2は、T3スタック（Next.js 15, tRPC, Prisma）とクリーンアーキテクチャを採用したテニス施設管理アプリケーションです。

## コードレビューの基本方針

### 1. アーキテクチャ遵守

**クリーンアーキテクチャの層構造を厳守すること:**

```
src/modules/[feature-name]/
├── domain/           # ビジネスロジック（フレームワーク非依存）
├── application/      # ユースケース（オーケストレーション層）
└── infrastructure/   # 実装詳細（Prisma、外部API等）
```

**チェック項目:**
- [ ] Domain層がフレームワークや外部ライブラリに依存していないか
- [ ] Domain層がインフラストラクチャ層を直接参照していないか
- [ ] Application層がリポジトリインターフェースのみに依存しているか
- [ ] Infrastructure層がDomain層のインターフェースを実装しているか
- [ ] 依存関係が外側から内側への一方向になっているか

### 2. TypeScript型安全性

**厳格な型チェックを維持すること:**

- [ ] `any` 型の使用を避ける（正当な理由がない限り）
- [ ] `as` によるキャストは最小限に留める
- [ ] オプショナルプロパティには `?.` を使用
- [ ] `noUncheckedIndexedAccess` に準拠した配列・オブジェクトアクセス
- [ ] Zodスキーマから型を推論（`z.infer<typeof schema>`）

### 3. バリデーション

**クライアント・サーバー間でバリデーションロジックを共有すること:**

- [ ] スキーマは `src/lib/validations/` に定義
- [ ] tRPCの `.input()` でZodスキーマを使用
- [ ] React Hook Formでも同じスキーマを使用
- [ ] エラーメッセージは日本語で分かりやすく

**例:**
```typescript
// src/lib/validations/feature.schema.ts
export const createFeatureSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
});

// tRPCルーター
.input(createFeatureSchema)

// React Hook Form
resolver: zodResolver(createFeatureSchema)
```

### 4. セキュリティ

**セキュリティベストプラクティスを遵守すること:**

- [ ] パスワードは `Password` 値オブジェクトで管理
- [ ] パスワードを平文でログ出力しない
- [ ] パスワードをAPIレスポンスに含めない
- [ ] SQLインジェクション対策（Prismaを使用）
- [ ] XSS対策（React/Next.jsのデフォルト動作を活用）
- [ ] CSRF対策（NextAuthのデフォルト動作を活用）
- [ ] 認証が必要なAPIは適切なプロシージャタイプを使用
  - `publicProcedure`: 認証不要
  - `protectedProcedure`: ログイン必須
  - `adminProcedure`: 管理者権限必須

### 5. データベース操作

**Prismaを使用したデータベース操作のベストプラクティス:**

- [ ] リポジトリパターンを使用してPrismaを抽象化
- [ ] トランザクションが必要な操作では `$transaction` を使用
- [ ] N+1問題を避けるため `include` や `select` を活用
- [ ] `unique` 制約違反のエラーハンドリング
- [ ] マイグレーションファイルは手動編集しない

### 6. UI/UXパターン

**Material-UIとレスポンシブデザイン:**

- [ ] **標準のalert/confirmは使用禁止** → MUIの `Dialog` を使用
- [ ] MUIコンポーネントを優先的に使用
- [ ] レスポンシブ対応（`sx` プロパティでブレークポイント指定）
- [ ] ライト/ダークモード対応
- [ ] ローディング中は `Backdrop` + `CircularProgress` を表示
- [ ] エラーメッセージは `Dialog` で表示

**ブレークポイント:**
```typescript
sx={{
  display: { xs: "none", sm: "block" } // モバイルで非表示、タブレット以上で表示
}}
```

### 7. tRPC統合パターン

**推奨されるtRPCプロシージャの実装パターン:**

```typescript
export const featureRouter = createTRPCRouter({
  action: adminProcedure
    .input(createFeatureSchema)
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

**チェック項目:**
- [ ] ユースケースとリポジトリを適切にインスタンス化
- [ ] エラーを適切な `TRPCError` に変換
- [ ] 入力バリデーションにZodスキーマを使用
- [ ] 戻り値はDTOまたはプリミティブ型

### 8. テスト

**テストカバレッジと品質:**

- [ ] 単体テスト: ドメインロジック、値オブジェクト、エンティティ
- [ ] 統合テスト: リポジトリとデータベースの統合
- [ ] E2Eテスト: 重要なユーザーフロー
- [ ] テストヘルパーは `tests/helpers/` に配置
- [ ] モックは必要最小限に留める
- [ ] テストデータは `test-factory.ts` を使用

### 9. コードスタイル

**Biomeによる統一されたコードスタイル:**

- [ ] コミット前に `npm run check:write` を実行
- [ ] インポートは自動整理される
- [ ] UIテキスト: 日本語
- [ ] コード（変数名、関数名、コメント）: 英語
- [ ] エラーメッセージ: 日本語

### 10. パフォーマンス

**Next.js/Reactのパフォーマンスベストプラクティス:**

- [ ] サーバーコンポーネントを優先的に使用
- [ ] クライアントコンポーネントは必要な場合のみ（`"use client"`）
- [ ] 画像は `next/image` の `Image` コンポーネントを使用
- [ ] 重い計算は `useMemo` でメモ化
- [ ] 関数は `useCallback` でメモ化（依存配列を適切に設定）
- [ ] tRPCクエリのキャッシュ戦略を適切に設定

## コードレビューチェックリスト

以下の項目を必ずチェックすること:

### 機能性
- [ ] 要件を満たしているか
- [ ] エッジケースを処理しているか
- [ ] エラーハンドリングが適切か

### コード品質
- [ ] DRY原則に従っているか
- [ ] SOLID原則に従っているか
- [ ] 命名規則が適切か（意図が明確か）
- [ ] コメントは必要最小限か（自己説明的なコードを優先）

### セキュリティ
- [ ] 認証・認可が適切か
- [ ] 入力バリデーションが実装されているか
- [ ] 機密情報が漏洩していないか

### パフォーマンス
- [ ] 不要な再レンダリングがないか
- [ ] データベースクエリが最適化されているか
- [ ] メモリリークの可能性がないか

### テスト
- [ ] 適切なテストが追加されているか
- [ ] 既存のテストが壊れていないか

### ドキュメント
- [ ] CLAUDE.mdの更新が必要か
- [ ] APIドキュメントの更新が必要か

## 禁止事項

以下のパターンは使用しないこと:

❌ **標準のalert/confirm/prompt**
```typescript
alert("エラーが発生しました"); // NG
confirm("削除してもよろしいですか？"); // NG
```

✅ **MUIのDialogを使用**
```typescript
<Dialog open={open}>
  <DialogTitle>確認</DialogTitle>
  <DialogContent>削除してもよろしいですか？</DialogContent>
</Dialog>
```

❌ **Domain層でPrisma型を使用**
```typescript
// domain/entities/user.entity.ts
import { User } from "~/generated/prisma"; // NG
```

✅ **独自のエンティティ型を定義**
```typescript
export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    // ...
  ) {}
}
```

❌ **any型の濫用**
```typescript
const data: any = await fetch(); // NG
```

✅ **適切な型定義**
```typescript
const data: UserResponse = await fetch();
```

## レビューの重要度レベル

コメントには以下のプレフィックスを使用:

- **[CRITICAL]**: セキュリティ、データ損失のリスク（修正必須）
- **[IMPORTANT]**: アーキテクチャ違反、重大なバグ（修正推奨）
- **[SUGGESTION]**: 改善提案、リファクタリング（任意）
- **[QUESTION]**: 質問、意図の確認

## 参考ドキュメント

- プロジェクトガイド: `/CLAUDE.md`
- テストガイド: `/docs/TESTING.md`
- T3 Stack: https://create.t3.gg/
- tRPC: https://trpc.io/
- Prisma: https://www.prisma.io/docs
- Material-UI: https://mui.com/
