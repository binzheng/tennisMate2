import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";

export interface DeleteMatchSessionInput {
	id: string;
}

export class DeleteMatchSessionUseCase {
	constructor(private readonly repository: MatchSessionRepository) {}

	async execute(input: DeleteMatchSessionInput): Promise<void> {
		// セッションが存在するか確認
		const session = await this.repository.findById(input.id);

		if (!session) {
			throw new Error("セッションが見つかりません");
		}

		// セッションを削除（カスケード削除でゲームも削除される）
		await this.repository.delete(input.id);
	}
}
