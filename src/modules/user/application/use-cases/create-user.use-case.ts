import { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { Password } from "../../domain/value-objects/password.vo";
import type { CreateUserDto } from "../dto/create-user.dto";
import type { UserResponseDto } from "../dto/user-response.dto";

export class CreateUserUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(dto: CreateUserDto): Promise<UserResponseDto> {
		// ユーザーIDの重複チェック
		const existingUser = await this.userRepository.findByUserId(dto.userId);
		if (existingUser) {
			throw new Error("このユーザーIDは既に使用されています");
		}

		// メールアドレスの重複チェック
		if (dto.email) {
			const existingEmail = await this.userRepository.findByEmail(dto.email);
			if (existingEmail) {
				throw new Error("このメールアドレスは既に使用されています");
			}
		}

		// パスワードのハッシュ化
		const password = await Password.createFromPlainText(dto.password);

		// ユーザーエンティティの作成
		const user = User.create({
			id: this.generateId(),
			userId: dto.userId,
			name: dto.name,
			email: dto.email,
			passwordHash: password.getValue(),
			role: dto.role,
		});

		// 永続化
		const createdUser = await this.userRepository.create(user);

		return createdUser.toPublicData();
	}

	private generateId(): string {
		// 簡易的なID生成（本番ではuuidなど使用）
		return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
