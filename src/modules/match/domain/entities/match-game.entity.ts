export interface MatchGamePlayerData {
	id: string;
	userId: string | null;
	playerName: string;
	team: number;
	position: number;
	score: number | null;
}

export interface MatchGameProps {
	id: string;
	sessionId: string;
	gameNumber: number;
	status: "scheduled" | "in_progress" | "completed";
	winner: number | null;
	players: MatchGamePlayerData[];
	createdAt?: Date;
	updatedAt?: Date;
}

export class MatchGame {
	private constructor(private readonly props: Required<MatchGameProps>) {}

	static create(props: MatchGameProps): MatchGame {
		const now = new Date();
		return new MatchGame({
			...props,
			createdAt: props.createdAt ?? now,
			updatedAt: props.updatedAt ?? now,
		});
	}

	get id(): string {
		return this.props.id;
	}

	get sessionId(): string {
		return this.props.sessionId;
	}

	get gameNumber(): number {
		return this.props.gameNumber;
	}

	get status(): "scheduled" | "in_progress" | "completed" {
		return this.props.status;
	}

	get winner(): number | null {
		return this.props.winner;
	}

	get players(): MatchGamePlayerData[] {
		return this.props.players;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	canStart(): boolean {
		return this.status === "scheduled" && this.players.length === 4;
	}

	canComplete(): boolean {
		return (
			this.status === "in_progress" &&
			this.players.every((p) => p.score !== null)
		);
	}

	toPublicData() {
		return {
			id: this.id,
			sessionId: this.sessionId,
			gameNumber: this.gameNumber,
			status: this.status,
			winner: this.winner,
			players: this.players,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		};
	}
}
