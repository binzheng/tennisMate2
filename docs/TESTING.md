# テストガイド

Tennis Mate 2のテスト基盤について説明します。

## テストの種類

このプロジェクトでは3種類のテストを実装しています：

1. **単体テスト (Unit Tests)** - ビジネスロジック、値オブジェクト、エンティティ、ユースケースのテスト
2. **統合テスト (Integration Tests)** - リポジトリ、データベース、tRPCルーターとの統合テスト
3. **E2Eテスト (End-to-End Tests)** - ブラウザを使った実際のユーザーフローのテスト

## 使用ツール

- **Vitest** - 単体テスト・統合テスト用の高速テストフレームワーク
- **Testing Library** - Reactコンポーネントテスト用
- **Playwright** - E2Eテスト用のブラウザ自動化ツール

## フォルダ構造

すべてのテストファイルは `tests` フォルダに集約されています：

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
│       └── infrastructure/  # インフラ層のテスト
│           └── repositories/
├── e2e/                     # E2Eテスト
│   ├── login.spec.ts
│   └── users.spec.ts
├── helpers/                 # テストヘルパー（共通ユーティリティ）
│   ├── db-helper.ts        # データベーステスト用ヘルパー
│   ├── mock-helper.ts      # モックリポジトリ
│   └── test-factory.ts     # テストデータファクトリー
└── setup.ts                 # テストセットアップファイル
```

## テストコマンド

### 単体テスト

```bash
# すべてのテストを実行（watchモード）
npm run test

# 単体テストのみを実行
npm run test:unit

# テストUIで実行
npm run test:ui

# カバレッジレポートを生成
npm run test:coverage
```

### 統合テスト

```bash
# 統合テストのみを実行
npm run test:integration
```

**重要:** 統合テストを実行する前に、テスト用データベースを準備してください：

```bash
# テストデータベース用の環境変数を設定
export DATABASE_URL_TEST="postgresql://postgres:password@localhost:5432/tennis_mate_2_test"

# テストデータベースにスキーマを適用
npx prisma db push --accept-data-loss
```

### E2Eテスト

```bash
# E2Eテストを実行
npm run test:e2e

# UIモードでE2Eテストを実行
npm run test:e2e:ui

# デバッグモードでE2Eテストを実行
npm run test:e2e:debug

# E2E用データベースを手動でセットアップ（通常は不要）
npm run db:setup-e2e
```

**重要:** E2Eテストのデータベース準備について

E2Eテストは **自動的に** データベースをセットアップします：

1. **自動セットアップ（推奨）**
   - `npm run test:e2e` を実行すると、Playwrightの `globalSetup` が自動実行されます
   - データベースがクリーンアップされ、テストユーザーが作成されます
   - 手動での準備は **不要** です

2. **手動セットアップ（必要な場合のみ）**
   ```bash
   # データベースを手動でリセット・セットアップする場合
   npm run db:setup-e2e
   ```

3. **初回のみ必要な準備**
   ```bash
   # Playwrightブラウザをインストール（初回のみ）
   npx playwright install
   ```

**セットアップの仕組み:**

E2Eテスト実行時に以下が自動実行されます：

```
tests/global-setup.ts
  ↓
scripts/setup-e2e-db.ts
  ↓
1. データベース全体をクリーンアップ
2. テストユーザーを作成
   - admin@example.com (管理者)
   - operator@example.com (オペレーター)
   - coach@example.com (コーチ)
   - player@example.com (プレイヤー)
   - すべてパスワード: password123
```

### E2Eのタイムアウト・思考時間（スローモ）

以下の環境変数でE2Eテストの時間設定を調整できます（デフォルト値はプロジェクト側で設定済）：

- E2E_TEST_TIMEOUT_MS: 各テストの最大実行時間（既定: 60000）
- E2E_EXPECT_TIMEOUT_MS: `expect(...)` の待機時間（既定: 7000）
- E2E_ACTION_TIMEOUT_MS: クリック/入力などアクションの待機時間（既定: 10000）
- E2E_NAVIGATION_TIMEOUT_MS: ページ遷移の待機時間（既定: 20000）
- E2E_SLOWMO_MS: ブラウザ起動時のスローモ（ms、既定: 0）
- E2E_THINK_MS: アクション間の思考時間（ms、既定: 0）

例：

```bash
E2E_TEST_TIMEOUT_MS=90000 E2E_EXPECT_TIMEOUT_MS=12000 E2E_SLOWMO_MS=100 \
  npm run test:e2e
```

手動で思考時間を入れたいときは、サポートヘルパーを利用します：

```ts
// tests/e2e/... 内のテストで
import { test, expect } from "@playwright/test";
import { think } from "./support/think";

test("ユーザーフロー", async ({ page }) => {
  await page.goto("/login");
  await think(page); // E2E_THINK_MS が設定されていれば待機
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await think(page, 200); // 明示的に200ms待機
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/users/);
});
```

### すべてのテストを実行

```bash
npm run test:all
```

このコマンドは、単体テスト、統合テスト、E2Eテストをすべて順番に実行します。

## テストの構造

### 単体テスト

単体テストは `tests/unit` ディレクトリに配置します。ソースコードのモジュール構造を反映したフォルダ構成にします。

```
tests/unit/user/
├── domain/
│   ├── value-objects/
│   │   └── password.vo.test.ts     # 単体テスト
│   └── entities/
│       └── user.entity.test.ts     # 単体テスト
└── application/
    └── use-cases/
        └── create-user.use-case.test.ts  # 単体テスト
```

**例: 値オブジェクトのテスト**

```typescript
import { describe, it, expect } from "vitest";
import { Password } from "~/modules/user/domain/value-objects/password.vo";

describe("Password Value Object", () => {
  it("8文字以上のパスワードでPasswordオブジェクトを作成できる", async () => {
    const password = await Password.createFromPlainText("password123");

    expect(password).toBeInstanceOf(Password);
    expect(password.getValue()).toBeTruthy();
  });
});
```

**インポートのルール:**
- ソースコードは `~` エイリアスを使用: `~/modules/...`
- テストヘルパーは相対パスを使用: `../../../helpers/...`

### 統合テスト

統合テストは `tests/integration` ディレクトリに配置します。

```
tests/integration/user/
└── infrastructure/
    └── repositories/
        └── prisma-user.repository.integration.test.ts  # 統合テスト
```

**例: リポジトリの統合テスト**

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaUserRepository } from "~/modules/user/infrastructure/repositories/prisma-user.repository";
import { getTestDb, cleanupDatabase, disconnectDb } from "../../../../helpers/db-helper";

describe("PrismaUserRepository Integration Test", () => {
  let repository: PrismaUserRepository;
  const db = getTestDb();

  beforeEach(async () => {
    await cleanupDatabase();
    repository = new PrismaUserRepository(db);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("新しいユーザーをデータベースに作成できる", async () => {
    // テストコード
  });
});
```

### E2Eテスト

E2Eテストは `tests/e2e/` ディレクトリに配置します。

```
tests/e2e/
├── login.spec.ts        # ログイン機能のE2Eテスト
└── users.spec.ts        # ユーザーマスタのE2Eテスト
```

**例: ログインのE2Eテスト**

```typescript
import { test, expect } from "@playwright/test";

test("有効な認証情報でログインできる", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("メールアドレス").fill("admin@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/users/);
});
```

**重要:** Playwrightは日本語ロケール（`ja-JP`）とタイムゾーン（`Asia/Tokyo`）に設定されています。これにより、エラーメッセージやUIテキストが日本語で表示されます。

## テストヘルパー

プロジェクトには以下のテストヘルパーが `tests/helpers/` に用意されています：

### データベースヘルパー (`tests/helpers/db-helper.ts`)

統合テストでデータベースを使用する際のヘルパー関数です。

```typescript
import { getTestDb, cleanupDatabase, disconnectDb } from "../../../helpers/db-helper";

// テスト用データベース接続を取得
const db = getTestDb();

// データベースをクリーンアップ
await cleanupDatabase();

// データベース接続を切断
await disconnectDb();
```

**使用例:**

```typescript
import { describe, beforeEach, afterAll } from "vitest";
import { getTestDb, cleanupDatabase, disconnectDb } from "../../../../helpers/db-helper";

describe("Integration Test", () => {
  const db = getTestDb();

  beforeEach(async () => {
    await cleanupDatabase();  // 各テスト前にデータをクリア
  });

  afterAll(async () => {
    await disconnectDb();  // すべてのテスト後に接続を切断
  });
});
```

### モックヘルパー (`tests/helpers/mock-helper.ts`)

単体テストでリポジトリをモックする際のヘルパークラスです。

```typescript
import { MockUserRepository } from "../../../helpers/mock-helper";

// モックリポジトリを作成
const mockRepository = new MockUserRepository();

// テストデータを設定
mockRepository.setUsers([user1, user2]);

// クリア
mockRepository.clear();
```

**使用例:**

```typescript
import { describe, it, beforeEach } from "vitest";
import { MockUserRepository } from "../../../../helpers/mock-helper";

describe("UseCase Test", () => {
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
  });

  it("should work with mock repository", () => {
    // モックを使用したテスト
  });
});
```

### テストファクトリー (`tests/helpers/test-factory.ts`)

テストデータを簡単に作成するためのファクトリークラスです。

```typescript
import { TestFactory } from "../../../helpers/test-factory";

// テストユーザーを作成
const user = TestFactory.createUser();
const admin = TestFactory.createAdminUser();
const operator = TestFactory.createOperatorUser();
const coach = TestFactory.createCoachUser();
const player = TestFactory.createPlayerUser();

// カスタムプロパティで作成
const customUser = TestFactory.createUser({
  email: "custom@example.com",
  name: "Custom User"
});
```

## ベストプラクティス

### 1. テストの配置

- **単体テスト**: `tests/unit/` 配下にソースコードの構造を反映して配置
- **統合テスト**: `tests/integration/` 配下に配置
- **E2Eテスト**: `tests/e2e/` 配下に配置
- **ヘルパー**: `tests/helpers/` に共通ユーティリティを配置

### 2. テストの命名

- 単体テストファイル: `*.test.ts`
- 統合テストファイル: `*.integration.test.ts`
- E2Eテストファイル: `*.spec.ts`
- テストの説明は日本語で記述

### 3. インポートのルール

- ソースコードへのインポート: `~` エイリアスを使用
  ```typescript
  import { User } from "~/modules/user/domain/entities/user.entity";
  ```
- テストヘルパーへのインポート: 相対パスを使用
  ```typescript
  import { TestFactory } from "../../../helpers/test-factory";
  ```

### 4. テストの構造

```typescript
describe("テスト対象", () => {
  describe("メソッド名", () => {
    it("期待される動作を説明", () => {
      // テストコード
    });
  });
});
```

### 5. AAA パターン

テストは Arrange（準備）、Act（実行）、Assert（検証）の3つのセクションに分けます：

```typescript
it("ユーザーを作成できる", async () => {
  // Arrange: テストデータの準備
  const dto = {
    userId: "test_user",
    name: "Test User",
    password: "password123",
    role: "player"
  };

  // Act: テスト対象の実行
  const result = await useCase.execute(dto);

  // Assert: 結果の検証
  expect(result.userId).toBe("test_user");
  expect(result.name).toBe("Test User");
});
```

### 6. テストの独立性

各テストは独立して実行できるようにします：

- `beforeEach` でデータをクリーンアップ
- テスト間で状態を共有しない
- モックは各テストで初期化

### 7. カバレッジ

重要なビジネスロジックは必ずテストします：

- 値オブジェクトのバリデーション
- エンティティのビジネスルール
- ユースケースのエラーハンドリング
- リポジトリのCRUD操作

## CI/CD統合

このプロジェクトには GitHub Actions のCI設定が含まれています（`.github/workflows/ci.yml`）。

### CIで実行される内容

1. **Lint and Type Check**: Biomeによるコード品質チェックと型チェック
2. **Unit Tests**: 単体テストの実行
3. **Integration Tests**: PostgreSQLを使った統合テストの実行
4. **E2E Tests**: Playwrightによるブラウザテストの実行

### ワークフローの構成

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  # リントと型チェック
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run check
      - run: npm run typecheck

  # 単体テスト
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit

  # 統合テスト（PostgreSQL付き）
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma db push
      - run: npm run test:integration

  # E2Eテスト（PostgreSQL + Playwright付き）
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx prisma db push
      - run: npm run db:seed
      - run: npm run test:e2e
```

### CIの実行

- プッシュ時: `master` または `main` ブランチへのプッシュ時に自動実行
- プルリクエスト時: `master` または `main` ブランチへのPR作成時に自動実行

### Playwrightレポート

E2Eテストが失敗した場合、Playwrightのレポート（スクリーンショット、トレース）がGitHub ActionsのArtifactsとして保存されます。30日間保持されます。

## トラブルシューティング

### 統合テストが失敗する

- テストデータベースが作成されているか確認
- `DATABASE_URL_TEST` 環境変数が正しく設定されているか確認
- スキーマが最新か確認 (`npx prisma db push`)

### E2Eテストが失敗する

- Playwrightブラウザがインストールされているか確認 (`npx playwright install`)
- テストユーザーが作成されているか確認 (`npm run db:seed`)
- 開発サーバーが起動しているか確認

### テストが遅い

- 単体テストのみを実行 (`npm run test:unit`)
- 特定のファイルのみをテスト (`npx vitest src/path/to/file.test.ts`)
- watchモードを使用して変更したファイルのみをテスト

## 参考リンク

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
