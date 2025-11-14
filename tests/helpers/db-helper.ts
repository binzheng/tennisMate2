import { PrismaClient } from "../../generated/prisma";

let prisma: PrismaClient;

export function getTestDb(): PrismaClient {
	if (!prisma) {
		const url =
			process.env.DATABASE_URL_TEST ||
			"postgresql://postgres:password@localhost:5432/tennis_mate_2_test";
		prisma = new PrismaClient({
			datasources: {
				db: {
					url,
				},
			},
		});
	}
	return prisma;
}

export async function cleanupDatabase() {
	const db = getTestDb();

	// 外部キー制約があるため、順序に注意して削除
	// 各削除操作を確実に完了させるため、順次実行
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
}

export async function disconnectDb() {
	if (prisma) {
		await prisma.$disconnect();
	}
}
