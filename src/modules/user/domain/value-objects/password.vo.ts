import bcrypt from "bcryptjs";

export class Password {
	private readonly hashedValue: string;

	private constructor(hashedValue: string) {
		this.hashedValue = hashedValue;
	}

	static async createFromPlainText(plainPassword: string): Promise<Password> {
		if (plainPassword.length < 8) {
			throw new Error("パスワードは8文字以上必要です");
		}
		const hashed = await bcrypt.hash(plainPassword, 10);
		return new Password(hashed);
	}

	static fromHash(hashedPassword: string): Password {
		return new Password(hashedPassword);
	}

	async compare(plainPassword: string): Promise<boolean> {
		return bcrypt.compare(plainPassword, this.hashedValue);
	}

	getValue(): string {
		return this.hashedValue;
	}
}
