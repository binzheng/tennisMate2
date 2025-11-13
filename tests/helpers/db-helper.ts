import { PrismaClient } from "../../generated/prisma";

let prisma: PrismaClient;

export function getTestDb(): PrismaClient {
	if (!prisma) {
		prisma = new PrismaClient({
			datasourceUrl:
				process.env.DATABASE_URL_TEST ||
				"postgresql://postgres:password@localhost:5432/tennis_mate_2_test",
		});
	}
	return prisma;
}

export async function cleanupDatabase() {
	const db = getTestDb();

	// トランザクションを使って確実に削除
	await db.$transaction(async (tx) => {
		// 外部キー制約があるため、順序に注意して削除
		await tx.lessonReservation.deleteMany({});
		await tx.lessonSlot.deleteMany({});
		await tx.lessonPolicy.deleteMany({});
		await tx.reservation.deleteMany({});
		await tx.court.deleteMany({});
		await tx.facility.deleteMany({});
		await tx.scoreRecord.deleteMany({});
		await tx.matchRequest.deleteMany({});
		await tx.matchProposal.deleteMany({});
		await tx.playerProfile.deleteMany({});
		await tx.post.deleteMany({});
		await tx.session.deleteMany({});
		await tx.account.deleteMany({});
		await tx.user.deleteMany({});
		await tx.verificationToken.deleteMany({});
		await tx.importJob.deleteMany({});
	});
}

export async function disconnectDb() {
	if (prisma) {
		await prisma.$disconnect();
	}
}
