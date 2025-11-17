/**
 * プレイヤー情報
 */
export interface PlayerInfo {
	id: string;
	name: string;
	userId: string | null;
}

/**
 * ゲーム情報（4人1組）
 */
export interface GameMatch {
	gameNumber: number;
	team1: [PlayerInfo, PlayerInfo];
	team2: [PlayerInfo, PlayerInfo];
	restingPlayers: PlayerInfo[]; // 休んでいるプレイヤー
}

/**
 * n個からr個を選ぶ組み合わせを生成
 */
function* combinations<T>(array: T[], r: number): Generator<T[]> {
	if (r === 0) {
		yield [];
		return;
	}
	if (r > array.length) {
		return;
	}
	for (let i = 0; i <= array.length - r; i++) {
		const current = array[i];
		if (current === undefined) continue;
		for (const combo of combinations(array.slice(i + 1), r - 1)) {
			yield [current, ...combo];
		}
	}
}

/**
 * 4人を2vs2の3通りのチーム分けを生成
 * 例: [A, B, C, D] の場合
 *  1. [A,B] vs [C,D]
 *  2. [A,C] vs [B,D]
 *  3. [A,D] vs [B,C]
 */
function generateTeamSplits(fourPlayers: PlayerInfo[]): Array<{
	team1: [PlayerInfo, PlayerInfo];
	team2: [PlayerInfo, PlayerInfo];
}> {
	const [p0, p1, p2, p3] = fourPlayers;
	if (!p0 || !p1 || !p2 || !p3) {
		throw new Error("4人のプレイヤーが必要です");
	}

	return [
		{
			team1: [p0, p1],
			team2: [p2, p3],
		},
		{
			team1: [p0, p2],
			team2: [p1, p3],
		},
		{
			team1: [p0, p3],
			team2: [p1, p2],
		},
	];
}

/**
 * 休みのプレイヤーを特定
 */
function getRestingPlayers(
	allPlayers: PlayerInfo[],
	playingPlayers: PlayerInfo[],
): PlayerInfo[] {
	const playingIds = new Set(playingPlayers.map((p) => p.id));
	return allPlayers.filter((p) => !playingIds.has(p.id));
}

/**
 * 休みローテーションを考慮したマッチング生成
 *
 * アルゴリズム:
 * 1. n人から4人を選ぶすべての組み合わせを生成
 * 2. 次に行う「1試合」を選ぶために、休みのバランスを見て4人を選択
 * 3. 直前試合で休んだ人が連続で休まないよう配慮
 * 4. 選ばれた4人で1試合分のチームを決定（3通りのうち1通り）
 * 5. 各ゲームに休んでいるプレイヤーを記録
 *
 * 例: 6人 [A,B,C,D,E,F] の場合
 *  ラウンド1: [A,B,C,D]プレイ, [E,F]休み → 3試合
 *  ラウンド2: [A,B,C,E]プレイ, [D,F]休み → 3試合 (Eは1回目に休んだので2回目はプレイ)
 *  ラウンド3: [A,B,D,E]プレイ, [C,F]休み → 3試合 (連続して休まないようにローテーション)
 *  ... (合計15ラウンド、45試合)
 *
 * @param players プレイヤーリスト
 * @returns ゲーム組み合わせのリスト
 */
export function generateMatches(players: PlayerInfo[]): GameMatch[] {
	const playerCount = players.length;

	// 4人未満の場合はゲームを作成できない
	if (playerCount < 4) {
		throw new Error("最低4人のプレイヤーが必要です");
	}

	const matches: GameMatch[] = [];
	let gameNumber = 1;

	// 4人の場合: 3通りのチーム分けのみ、休みなし
	if (playerCount === 4) {
		const splits = generateTeamSplits(players);
		for (const split of splits) {
			matches.push({
				gameNumber: gameNumber++,
				team1: split.team1,
				team2: split.team2,
				restingPlayers: [],
			});
		}
		return matches;
	}

	// 5人以上の場合: 休みローテーションを考慮
	// すべての4人の組み合わせを生成（各組み合わせにつき3通りのゲームを作る）
	const fourPlayerCombinations = Array.from(combinations(players, 4));

	// プレイヤーごとの休み回数と最後に休んだラウンド番号を追跡
	const restCounts = new Map<string, number>();
	const lastRestRound = new Map<string, number>();
	players.forEach((p) => {
		restCounts.set(p.id, 0);
		lastRestRound.set(p.id, -999); // 初期値は大きな負の数
	});

	let currentGameIndex = 0;

	// すべての試合タスク（各4人組につき3通り）を用意
	const tasks = fourPlayerCombinations.flatMap((combo) => {
		const splits = generateTeamSplits(combo);
		const restingPlayers = getRestingPlayers(players, combo);
		return splits.map((split, idx) => ({
			key: `${combo
				.map((p) => p.id)
				.sort()
				.join(",")}#${idx}`,
			split,
			restingPlayers,
		}));
	});

	const usedTaskKeys = new Set<string>();

	while (usedTaskKeys.size < tasks.length) {
		// 残りのタスクから次に適した1試合を選ぶ
		const bestTask = tasks
			.filter((t) => !usedTaskKeys.has(t.key))
			.sort((a, b) => {
				// 1. 直前に休んだ人を含まない方を優先
				const aRecent = a.restingPlayers.some(
					(p) => lastRestRound.get(p.id) === currentGameIndex - 1,
				);
				const bRecent = b.restingPlayers.some(
					(p) => lastRestRound.get(p.id) === currentGameIndex - 1,
				);
				if (aRecent !== bRecent) return aRecent ? 1 : -1;

				// 2. 休み回数の合計が少ない方を優先
				const aRestTotal = a.restingPlayers.reduce(
					(sum, p) => sum + (restCounts.get(p.id) ?? 0),
					0,
				);
				const bRestTotal = b.restingPlayers.reduce(
					(sum, p) => sum + (restCounts.get(p.id) ?? 0),
					0,
				);
				if (aRestTotal !== bRestTotal) return aRestTotal - bRestTotal;

				// 3. 最後に休んでからの経過試合数が長い方を優先
				const aLastRestMax = Math.max(
					...a.restingPlayers.map((p) => lastRestRound.get(p.id) ?? -999),
				);
				const bLastRestMax = Math.max(
					...b.restingPlayers.map((p) => lastRestRound.get(p.id) ?? -999),
				);
				return aLastRestMax - bLastRestMax;
			})[0];

		if (!bestTask) break;

		usedTaskKeys.add(bestTask.key);

		matches.push({
			gameNumber: gameNumber++,
			team1: bestTask.split.team1,
			team2: bestTask.split.team2,
			restingPlayers: [...bestTask.restingPlayers],
		});

		bestTask.restingPlayers.forEach((p) => {
			restCounts.set(p.id, (restCounts.get(p.id) ?? 0) + 1);
			lastRestRound.set(p.id, currentGameIndex);
		});

		currentGameIndex++;
	}

	return matches;
}

/**
 * ダミープレイヤーを生成
 */
export function generateDummyPlayers(count: number): PlayerInfo[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `dummy-${i + 1}`,
		name: `プレイヤー${i + 1}`,
		userId: null,
	}));
}

/**
 * マッチング統計情報を取得
 */
export interface MatchingStats {
	totalGames: number;
	totalRounds: number;
	playersCount: number;
	gamesPerPlayer: number;
	restsPerPlayer: number;
}

export function getMatchingStats(
	players: PlayerInfo[],
	matches: GameMatch[],
): MatchingStats {
	const playerCount = players.length;
	const totalGames = matches.length;
	const totalRounds = Math.ceil(totalGames / 3); // 1ラウンド = 3試合

	// 各プレイヤーの参加試合数を計算
	const gameCountMap = new Map<string, number>();
	for (const p of players) {
		gameCountMap.set(p.id, 0);
	}

	matches.forEach((match) => {
		[...match.team1, ...match.team2].forEach((player) => {
			gameCountMap.set(player.id, (gameCountMap.get(player.id) ?? 0) + 1);
		});
	});

	const gamesPerPlayer =
		Array.from(gameCountMap.values()).reduce((sum, count) => sum + count, 0) /
		playerCount;

	// 各プレイヤーの休み回数を計算
	const restCountMap = new Map<string, number>();
	for (const p of players) {
		restCountMap.set(p.id, 0);
	}

	matches.forEach((match) => {
		match.restingPlayers.forEach((player) => {
			restCountMap.set(player.id, (restCountMap.get(player.id) ?? 0) + 1);
		});
	});

	const restsPerPlayer =
		Array.from(restCountMap.values()).reduce((sum, count) => sum + count, 0) /
		playerCount;

	return {
		totalGames,
		totalRounds,
		playersCount: playerCount,
		gamesPerPlayer,
		restsPerPlayer,
	};
}
