import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { UserResponseDto } from "../dto/user-response.dto";

export class GetUsersUseCase {
	constructor(private readonly userRepository: IUserRepository) {}

	async execute(): Promise<UserResponseDto[]> {
		const users = await this.userRepository.findAll();
		return users.map((user) => user.toPublicData());
	}
}
