import { CreateUserUseCase } from "../src/modules/user/application/use-cases/create-user.use-case";
import { PrismaUserRepository } from "../src/modules/user/infrastructure/repositories/prisma-user.repository";
import { db } from "../src/server/db";

async function createTestUsers() {
	const userRepository = new PrismaUserRepository(db);
	const createUserUseCase = new CreateUserUseCase(userRepository);

	const testUsers = [
		{
			userId: "admin001",
			name: "管理者ユーザー",
			email: "admin@example.com",
			password: "password123",
			role: "admin" as const,
		},
		{
			userId: "operator001",
			name: "オペレーターユーザー",
			email: "operator@example.com",
			password: "password123",
			role: "operator" as const,
		},
		{
			userId: "coach001",
			name: "コーチユーザー",
			email: "coach@example.com",
			password: "password123",
			role: "coach" as const,
		},
		{
			userId: "player001",
			name: "プレイヤーユーザー",
			email: "player@example.com",
			password: "password123",
			role: "player" as const,
		},
	];

	console.log("テストユーザーの作成を開始します...\n");

	for (const userData of testUsers) {
		try {
			const user = await createUserUseCase.execute(userData);
			console.log(`✓ ${userData.role}ユーザーを作成しました:`);
			console.log(`  - ユーザーID: ${userData.userId}`);
			console.log(`  - メールアドレス: ${userData.email}`);
			console.log(`  - パスワード: ${userData.password}`);
			console.log(`  - 名前: ${user.name}`);
			console.log(`  - ロール: ${user.role}\n`);
		} catch (error) {
			console.error(
				`✗ ${userData.role}ユーザーの作成に失敗しました:`,
				error instanceof Error ? error.message : error,
			);
		}
	}

	console.log("テストユーザーの作成が完了しました。");
	console.log("\n=== ログイン情報 ===");
	console.log("以下の認証情報でログインできます:");
	for (const userData of testUsers) {
		console.log(`\n【${userData.role}】`);
		console.log(`メールアドレス: ${userData.email}`);
		console.log(`パスワード: ${userData.password}`);
	}

	await db.$disconnect();
}

createTestUsers().catch((error) => {
	console.error("エラーが発生しました:", error);
	process.exit(1);
});
