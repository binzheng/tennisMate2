# コードレビューチェックリスト

このチェックリストは、コミット前およびプルリクエスト作成時に確認すべき項目をまとめたものです。

## 事前チェック（コミット前）

### 1. ビルドとテスト

```bash
# すべてのチェックを実行
npm run check              # コードスタイルチェック
npm run typecheck          # 型チェック
npm run build              # ビルドチェック
npm run test:all           # すべてのテスト実行
```

- [ ] `npm run check` がエラーなく完了
- [ ] `npm run typecheck` がエラーなく完了
- [ ] `npm run build` が成功
- [ ] 関連するテストがすべて成功

### 2. コード整形

```bash
npm run check:write        # 自動修正
```

- [ ] Biomeによる自動整形を実行済み
- [ ] インポート文が整理されている
- [ ] 未使用の変数・インポートを削除済み

## アーキテクチャチェック

### クリーンアーキテクチャ

- [ ] 新機能は `src/modules/[feature-name]/` 配下に配置
- [ ] Domain層がフレームワーク非依存
- [ ] Application層がDomain層のインターフェースのみに依存
- [ ] Infrastructure層がDomain層のインターフェースを実装
- [ ] 依存関係が適切な方向（外側→内側）

### ディレクトリ構造

```
src/modules/[feature-name]/
├── domain/
│   ├── entities/       # ビジネスエンティティ
│   ├── repositories/   # リポジトリインターフェース
│   └── value-objects/  # 値オブジェクト
├── application/
│   ├── use-cases/      # ユースケース
│   └── dto/            # データ転送オブジェクト
└── infrastructure/
    └── repositories/   # リポジトリ実装
```

- [ ] 適切なディレクトリに配置されている
- [ ] ファイル名が機能を表している

## TypeScript型安全性チェック

- [ ] `any` 型を使用していない（やむを得ない場合はコメントで理由を説明）
- [ ] 型アサーション（`as`）を最小限に抑えている
- [ ] オプショナルチェーン（`?.`）を適切に使用
- [ ] Null/undefinedチェックを実装
- [ ] Zodスキーマから型を推論（`z.infer<typeof schema>`）
- [ ] ジェネリクスを適切に使用

## バリデーションチェック

- [ ] スキーマは `src/lib/validations/` に定義
- [ ] tRPC `.input()` でスキーマを使用
- [ ] クライアントフォームでも同じスキーマを使用
- [ ] エラーメッセージが日本語で分かりやすい
- [ ] 必須フィールドが適切に設定されている

**例:**
```typescript
// ✅ 良い例
export const createUserSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
});

// ❌ 悪い例
export const createUserSchema = z.object({
  name: z.string(),  // エラーメッセージなし
  email: z.string(), // email検証なし
});
```

## セキュリティチェック

### 認証・認可

- [ ] 認証が必要なAPIは `protectedProcedure` または `adminProcedure` を使用
- [ ] 権限チェックが適切に実装されている
- [ ] セッション情報を適切に使用

### パスワード管理

- [ ] パスワードは `Password` 値オブジェクトで管理
- [ ] `Password.createFromPlainText()` でハッシュ化
- [ ] パスワードをログ出力していない
- [ ] パスワードをAPIレスポンスに含めていない

### 入力検証

- [ ] すべてのユーザー入力をバリデーション
- [ ] SQLインジェクション対策（Prisma使用）
- [ ] XSS対策（適切なエスケープ）
- [ ] CSRF対策（NextAuth使用）

## データベースチェック

### Prismaスキーマ

- [ ] スキーマ変更時は `npm run db:generate` を実行
- [ ] マイグレーションファイルが生成されている
- [ ] リレーションが適切に設定されている
- [ ] インデックスが必要な場所に設定されている

### リポジトリパターン

- [ ] リポジトリインターフェースを定義（`domain/repositories/`）
- [ ] リポジトリ実装を作成（`infrastructure/repositories/`）
- [ ] トランザクション処理が適切
- [ ] エラーハンドリングが実装されている

### パフォーマンス

- [ ] N+1問題を回避（`include` や `select` を使用）
- [ ] 不要なデータを取得していない
- [ ] インデックスを適切に使用

## UIチェック

### Material-UI使用

- [ ] **標準のalert/confirm/promptを使用していない**
- [ ] MUIの `Dialog` コンポーネントを使用
- [ ] 適切なMUIコンポーネントを選択
- [ ] テーマに準拠したスタイル

### レスポンシブデザイン

- [ ] モバイル（xs: 0px）で正しく表示
- [ ] タブレット（sm: 600px）で正しく表示
- [ ] デスクトップ（md: 900px, lg: 1200px）で正しく表示
- [ ] ブレークポイントを適切に使用

```typescript
// 例
<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
  モバイルでは非表示
</TableCell>
```

### テーマ対応

- [ ] ライトモードで正しく表示
- [ ] ダークモードで正しく表示
- [ ] テーマカラーを適切に使用

### UX

- [ ] ローディング中に `Backdrop` + `CircularProgress` を表示
- [ ] エラーは `Dialog` で表示
- [ ] 成功メッセージを適切に表示
- [ ] ボタンの無効化が適切

## tRPC統合チェック

### ルーター実装

- [ ] スキーマで入力をバリデーション
- [ ] ユースケースとリポジトリを適切にインスタンス化
- [ ] エラーを `TRPCError` に変換
- [ ] 戻り値はDTOまたはプリミティブ型

**推奨パターン:**
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

### クライアント使用

- [ ] `api.feature.action.useQuery()` または `.useMutation()` を使用
- [ ] 成功時にキャッシュを無効化（`utils.feature.action.invalidate()`）
- [ ] エラーハンドリングを実装
- [ ] ローディング状態を管理

## テストチェック

### テストカバレッジ

- [ ] 新機能に単体テストを追加
- [ ] リポジトリに統合テストを追加
- [ ] 重要なフローにE2Eテストを追加
- [ ] エッジケースをテスト

### テストファイル配置

```
tests/
├── unit/            # 単体テスト
├── integration/     # 統合テスト
└── e2e/             # E2Eテスト
```

- [ ] 適切なディレクトリに配置
- [ ] テストファイル名が `*.test.ts` または `*.spec.ts`

### テスト品質

- [ ] テストケース名が明確
- [ ] Arrange-Act-Assert パターンに従っている
- [ ] モックは最小限
- [ ] テストデータは `TestFactory` を使用

## パフォーマンスチェック

### React/Next.js

- [ ] サーバーコンポーネントを優先的に使用
- [ ] `"use client"` は必要な場所のみに配置
- [ ] 重い計算を `useMemo` でメモ化
- [ ] コールバックを `useCallback` でメモ化
- [ ] 画像は `next/image` を使用

### データフェッチング

- [ ] 不要なデータを取得していない
- [ ] キャッシュ戦略が適切
- [ ] パラレルフェッチングを活用

## コーディング規約チェック

### 命名規則

- [ ] 変数名・関数名: camelCase（英語）
- [ ] クラス名・型名: PascalCase（英語）
- [ ] 定数: UPPER_SNAKE_CASE（英語）
- [ ] ファイル名: kebab-case（英語）
- [ ] 意図が明確な命名

### コメント

- [ ] 複雑なロジックにコメント追加
- [ ] TODOコメントは課題管理ツールと連携
- [ ] 不要なコメントは削除
- [ ] コメントよりも自己説明的なコードを優先

### インポート

- [ ] `~/*` エイリアスを使用
- [ ] 相対パスは最小限
- [ ] 未使用のインポートを削除

## ドキュメントチェック

- [ ] `CLAUDE.md` の更新が必要な場合は更新
- [ ] 新機能のドキュメント追加
- [ ] READMEの更新が必要な場合は更新
- [ ] コミットメッセージが明確

## コミットメッセージ

推奨フォーマット:
```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `chore`: その他

- [ ] コミットメッセージが明確
- [ ] 変更内容を適切に説明

## 最終確認

- [ ] すべてのチェック項目をクリア
- [ ] ビルドが成功
- [ ] テストが成功
- [ ] コードレビューの準備完了

---

## GitHub Copilotによる自動レビュー

コミット前に以下のコマンドでCopilotにレビューを依頼できます:

```bash
# Copilotにレビューを依頼（VSCode拡張機能使用）
# 1. 変更ファイルを開く
# 2. Copilot Chatで「このコードをレビューしてください」と入力
# 3. 上記のチェックリストに基づいてレビュー結果を確認
```

または、GitHubのプルリクエスト機能を使用:

```bash
# PRを作成
gh pr create --title "機能名" --body "説明"

# Copilot for PRsが自動的にレビュー
```
