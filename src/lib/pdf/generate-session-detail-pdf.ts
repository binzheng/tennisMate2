import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

interface PlayerData {
	userId: string | null;
	playerName: string;
	team: number;
	score: number | null;
}

interface GameData {
	id: string;
	gameNumber: number;
	status: "scheduled" | "in_progress" | "completed";
	winner: number | null;
	players: PlayerData[];
}

interface SessionDetailData {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	games: GameData[];
}

export async function generateSessionDetailPDF(
	session: SessionDetailData,
): Promise<Uint8Array> {
	// Create a new PDF document
	const pdfDoc = await PDFDocument.create();

	// Register fontkit
	pdfDoc.registerFontkit(fontkit);

	// Fetch Noto Sans JP font from Google Fonts
	const fontUrl =
		"https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEi75vY0rw-oME.ttf";
	const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
	const customFont = await pdfDoc.embedFont(fontBytes);

	// Add a page
	const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
	const { width, height } = page.getSize();

	// Define margins and positions
	const margin = 50;
	let currentY = height - margin;

	// Title
	const titleSize = 18;
	page.drawText(session.name, {
		x: margin,
		y: currentY,
		size: titleSize,
		font: customFont,
		color: rgb(0, 0, 0),
	});

	// Date on the right
	const dateText = new Date(session.date).toLocaleDateString("ja-JP");
	const dateWidth = customFont.widthOfTextAtSize(dateText, 10);
	page.drawText(dateText, {
		x: width - margin - dateWidth,
		y: currentY,
		size: 10,
		font: customFont,
		color: rgb(0.5, 0.5, 0.5),
	});
	currentY -= titleSize + 15;

	// Session summary
	const summarySize = 10;
	const summaryText = `プレイヤー数: ${session.playerCount}    ゲーム数: ${session.games.length}`;
	page.drawText(summaryText, {
		x: margin,
		y: currentY,
		size: summarySize,
		font: customFont,
		color: rgb(0, 0, 0),
	});
	currentY -= summarySize + 15;

	// Calculate win counts
	type PlayerKey = string;
	interface WinEntry {
		key: PlayerKey;
		name: string;
		wins: number;
	}
	const winMap = new Map<PlayerKey, WinEntry>();
	for (const g of session.games) {
		for (const p of g.players) {
			if (p.team > 0) {
				const key: PlayerKey = p.userId ?? `name:${p.playerName}`;
				if (!winMap.has(key))
					winMap.set(key, { key, name: p.playerName, wins: 0 });
			}
		}
	}
	for (const g of session.games) {
		if (g.status === "completed" && (g.winner === 1 || g.winner === 2)) {
			for (const p of g.players) {
				if (p.team === g.winner) {
					const key: PlayerKey = p.userId ?? `name:${p.playerName}`;
					const cur = winMap.get(key);
					if (cur) cur.wins += 1;
				}
			}
		}
	}
	const winList = Array.from(winMap.values()).sort(
		(a, b) => b.wins - a.wins || a.name.localeCompare(b.name),
	);

	// Win count section
	const winTitleSize = 12;
	page.drawText("プレイヤー別 勝利数（小計）", {
		x: margin,
		y: currentY,
		size: winTitleSize,
		font: customFont,
		color: rgb(0, 0, 0),
	});
	currentY -= winTitleSize + 10;

	if (winList.length > 0) {
		const winTextSize = 9;
		const winText = winList.map((w) => `${w.name}: ${w.wins}勝`).join("  ");
		page.drawText(winText, {
			x: margin,
			y: currentY,
			size: winTextSize,
			font: customFont,
			color: rgb(0, 0, 0),
		});
		currentY -= winTextSize + 15;
	} else {
		const noDataSize = 9;
		page.drawText("記録がありません。", {
			x: margin,
			y: currentY,
			size: noDataSize,
			font: customFont,
			color: rgb(0.5, 0.5, 0.5),
		});
		currentY -= noDataSize + 15;
	}

	// Table header
	const headerSize = 9;
	const rowHeight = 18;
	const cellPadding = 4;

	// Column widths
	const col1Width = 40; // #
	const col2Width = 120; // チーム1
	const col3Width = 120; // チーム2
	const col4Width = 100; // 休み
	const col5Width = 60; // スコア
	const col6Width = 70; // ステータス

	const tableWidth =
		col1Width + col2Width + col3Width + col4Width + col5Width + col6Width;

	// Draw table header background
	page.drawRectangle({
		x: margin,
		y: currentY - rowHeight,
		width: tableWidth,
		height: rowHeight,
		color: rgb(0.9, 0.9, 0.9),
	});

	// Draw table header borders
	page.drawRectangle({
		x: margin,
		y: currentY - rowHeight,
		width: tableWidth,
		height: rowHeight,
		borderColor: rgb(0.6, 0.6, 0.6),
		borderWidth: 1,
	});

	// Draw header text
	const headers = [
		{ text: "#", width: col1Width },
		{ text: "チーム1", width: col2Width },
		{ text: "チーム2", width: col3Width },
		{ text: "休み", width: col4Width },
		{ text: "スコア", width: col5Width },
		{ text: "ステータス", width: col6Width },
	];

	let headerX = margin + cellPadding;
	for (const header of headers) {
		page.drawText(header.text, {
			x: headerX,
			y: currentY - rowHeight + cellPadding + 2,
			size: headerSize,
			font: customFont,
			color: rgb(0, 0, 0),
		});
		headerX += header.width;
	}

	currentY -= rowHeight;

	// Draw table rows
	const rowSize = 8;
	for (const game of session.games) {
		// Check if we need a new page
		if (currentY - rowHeight < margin) {
			const newPage = pdfDoc.addPage([595.28, 841.89]);
			currentY = newPage.getSize().height - margin;
		}

		const team1Players = game.players.filter((p) => p.team === 1);
		const team2Players = game.players.filter((p) => p.team === 2);
		const restingPlayers = game.players.filter((p) => p.team === 0);
		const team1Score = team1Players.reduce((s, p) => s + (p.score ?? 0), 0);
		const team2Score = team2Players.reduce((s, p) => s + (p.score ?? 0), 0);

		// Draw row background (alternating colors)
		const isEven = session.games.indexOf(game) % 2 === 0;
		if (isEven) {
			page.drawRectangle({
				x: margin,
				y: currentY - rowHeight,
				width: tableWidth,
				height: rowHeight,
				color: rgb(0.98, 0.98, 0.98),
			});
		}

		// Draw cell borders
		page.drawRectangle({
			x: margin,
			y: currentY - rowHeight,
			width: tableWidth,
			height: rowHeight,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 0.5,
		});

		// Truncate text if too long
		const truncate = (text: string, maxLength: number) => {
			return text.length > maxLength
				? `${text.substring(0, maxLength)}...`
				: text;
		};

		// Draw row data
		const statusText =
			game.status === "completed"
				? game.winner === 1
					? "チーム1勝ち"
					: "チーム2勝ち"
				: game.status === "in_progress"
					? "進行中"
					: "予定";

		const rowData = [
			{ text: `#${game.gameNumber}`, width: col1Width },
			{
				text: truncate(team1Players.map((p) => p.playerName).join(", "), 18),
				width: col2Width,
			},
			{
				text: truncate(team2Players.map((p) => p.playerName).join(", "), 18),
				width: col3Width,
			},
			{
				text:
					restingPlayers.length > 0
						? truncate(restingPlayers.map((p) => p.playerName).join(", "), 15)
						: "-",
				width: col4Width,
			},
			{ text: `${team1Score}-${team2Score}`, width: col5Width },
			{ text: statusText, width: col6Width },
		];

		let cellX = margin + cellPadding;
		for (const cell of rowData) {
			page.drawText(cell.text, {
				x: cellX,
				y: currentY - rowHeight + cellPadding + 2,
				size: rowSize,
				font: customFont,
				color: rgb(0, 0, 0),
			});
			cellX += cell.width;
		}

		currentY -= rowHeight;
	}

	// Serialize the PDFDocument to bytes (a Uint8Array)
	const pdfBytes = await pdfDoc.save();

	return pdfBytes;
}
