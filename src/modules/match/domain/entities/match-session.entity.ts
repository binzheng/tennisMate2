export interface MatchSessionProps {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	createdBy: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export class MatchSession {
	private constructor(private readonly props: Required<MatchSessionProps>) {}

	static create(props: MatchSessionProps): MatchSession {
		const now = new Date();
		return new MatchSession({
			...props,
			createdAt: props.createdAt ?? now,
			updatedAt: props.updatedAt ?? now,
		});
	}

	get id(): string {
		return this.props.id;
	}

	get name(): string {
		return this.props.name;
	}

	get date(): Date {
		return this.props.date;
	}

	get playerCount(): number {
		return this.props.playerCount;
	}

	get createdBy(): string {
		return this.props.createdBy;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	toPublicData() {
		return {
			id: this.id,
			name: this.name,
			date: this.date,
			playerCount: this.playerCount,
			createdBy: this.createdBy,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
