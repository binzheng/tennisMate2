import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { Password } from "../../domain/value-objects/password.vo";
import type { UpdateUserDto } from "../dto/update-user.dto";
import type { UserResponseDto } from "../dto/user-response.dto";

export class UpdateUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
		// 存在確認
		const existingUser = await this.userRepository.findById(id);
		if (!existingUser) {
			throw new Error("ユーザーが見つかりません");
		}

		// ユーザーIDの重複チェック
		if (dto.userId && dto.userId !== existingUser.userId) {
			const duplicateUserId = await this.userRepository.findByUserId(
				dto.userId,
			);
			if (duplicateUserId) {
				throw new Error("このユーザーIDは既に使用されています");
			}
		}

		// メールアドレスの重複チェック
		if (dto.email && dto.email !== existingUser.email) {
			const duplicateEmail = await this.userRepository.findByEmail(dto.email);
			if (duplicateEmail) {
				throw new Error("このメールアドレスは既に使用されています");
			}
		}

		// 更新データの準備
		const updateData: Partial<typeof existingUser> = {};

		if (dto.userId !== undefined) updateData.userId = dto.userId;
		if (dto.name !== undefined) updateData.name = dto.name;
		if (dto.email !== undefined) updateData.email = dto.email;
		if (dto.role !== undefined) updateData.role = dto.role;

		// パスワードが指定されている場合はハッシュ化
		if (dto.password) {
			const password = await Password.createFromPlainText(dto.password);
			updateData.passwordHash = password.getValue();
		}

		// 更新実行
		const updatedUser = await this.userRepository.update(id, updateData);

		return updatedUser.toPublicData();
	}
}
