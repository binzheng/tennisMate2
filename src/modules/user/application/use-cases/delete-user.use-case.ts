import type { IUserRepository } from "../../domain/repositories/user.repository.interface";

export class DeleteUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(id: string, currentUserId: string): Promise<void> {
		// 存在確認
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw new Error("ユーザーが見つかりません");
		}

		// 自分自身を削除できないようにする
		if (id === currentUserId) {
			throw new Error("自分自身を削除することはできません");
		}

		await this.userRepository.delete(id);
	}
}
