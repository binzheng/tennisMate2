import { PrismaClient } from "../generated/prisma/index.js";
import { CreateUserUseCase } from "../src/modules/user/application/use-cases/create-user.use-case";
import { PrismaUserRepository } from "../src/modules/user/infrastructure/repositories/prisma-user.repository";

// E2Eテスト用のPrismaClientを直接作成（環境変数のバリデーションをスキップ）
const db = new PrismaClient({
	datasources: {
		db: {
			url:
				process.env.DATABASE_URL_TEST ??
				"postgresql://t3user:t3pass@localhost:5432/tennis_mate_2_test",
		},
	},
});

/**
 * E2Eテスト用データベースセットアップスクリプト
 *
 * このスクリプトは：
 * 1. データベースをクリーンアップ
 * 2. E2Eテストに必要なテストユーザーを作成
 */
async function setupE2EDatabase() {
	console.log("🔄 E2Eテスト用データベースのセットアップを開始します...\n");

	try {
		// 1. データベースのクリーンアップ
		console.log("📦 データベースをクリーンアップ中...");

		// 外部キー制約があるため、順序に注意して削除

		// Match関連のテーブルを先に削除（外部キー制約を考慮）
		await db.matchGamePlayer.deleteMany({});
		await db.matchGame.deleteMany({});
		await db.matchSession.deleteMany({});

		await db.lessonReservation.deleteMany({});
		await db.lessonSlot.deleteMany({});
		await db.lessonPolicy.deleteMany({});
		await db.reservation.deleteMany({});
		await db.court.deleteMany({});
		await db.facility.deleteMany({});
		await db.scoreRecord.deleteMany({});
		await db.matchRequest.deleteMany({});
		await db.matchProposal.deleteMany({});
		await db.playerProfile.deleteMany({});
		await db.post.deleteMany({});
		await db.session.deleteMany({});
		await db.account.deleteMany({});
		await db.user.deleteMany({});
		await db.verificationToken.deleteMany({});
		await db.importJob.deleteMany({});

		console.log("✓ データベースのクリーンアップが完了しました\n");

		// 2. テストユーザーの作成
		console.log("👤 テストユーザーを作成中...");

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

		for (const userData of testUsers) {
			await createUserUseCase.execute(userData);
			console.log(`  ✓ ${userData.role}: ${userData.email}`);
		}

		console.log("\n✓ テストユーザーの作成が完了しました\n");

		// 3. テスト施設とコートの作成
		console.log("🏢 テスト施設とコートを作成中...");

		const facility = await db.facility.create({
			data: {
				id: "test-facility-001",
				name: "テストテニスクラブ",
				updatedAt: new Date(),
			},
		});
		console.log(`  ✓ 施設: ${facility.name}`);

		const court1 = await db.court.create({
			data: {
				id: "court1",
				facilityId: facility.id,
				name: "コート1",
			},
		});
		console.log(`  ✓ ${court1.name}`);

		const court2 = await db.court.create({
			data: {
				id: "court2",
				facilityId: facility.id,
				name: "コート2",
			},
		});
		console.log(`  ✓ ${court2.name}`);

		console.log("\n✅ E2Eテスト用データベースのセットアップが完了しました");
		console.log("\n=== テストユーザー ===");
		console.log("メールアドレス: admin@example.com");
		console.log("パスワード: password123");
		console.log("\n=== テスト施設 ===");
		console.log(`施設名: ${facility.name}`);
		console.log(`コート: ${court1.name}, ${court2.name}`);
	} catch (error) {
		console.error("\n❌ セットアップ中にエラーが発生しました:", error);
		throw error;
	} finally {
		await db.$disconnect();
	}
}

// PlaywrightのglobalSetupからインポートできるようにエクスポート
export default setupE2EDatabase;

// スクリプトとして実行された場合
// ESモジュール: import.meta.url をチェック
if (import.meta.url === `file://${process.argv[1]}`) {
	setupE2EDatabase()
		.then(() => {
			console.log("\n🎉 セットアップが正常に完了しました");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 セットアップに失敗しました:", error);
			process.exit(1);
		});
}
