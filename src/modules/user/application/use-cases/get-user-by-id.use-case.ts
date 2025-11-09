import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { UserResponseDto } from "../dto/user-response.dto";

export class GetUserByIdUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(id: string): Promise<UserResponseDto> {
		const user = await this.userRepository.findById(id);

		if (!user) {
			throw new Error("ユーザーが見つかりません");
		}

		return user.toPublicData();
	}
}
