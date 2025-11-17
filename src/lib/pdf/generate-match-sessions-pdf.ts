import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

interface SessionData {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	createdAt: Date;
	games?: Array<{
		id: string;
		status: "pending" | "in_progress" | "completed";
	}>;
}

export async function generateMatchSessionsPDF(
	sessions: SessionData[],
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
	const { height } = page.getSize();

	// Define margins and positions
	const margin = 50;
	let currentY = height - margin;

	// Title
	const titleSize = 20;
	const title = "ゲームマッチング一覧";
	page.drawText(title, {
		x: margin,
		y: currentY,
		size: titleSize,
		font: customFont,
		color: rgb(0, 0, 0),
	});
	currentY -= titleSize + 10;

	// Date
	const dateSize = 10;
	const dateText = `作成日: ${new Date().toLocaleDateString("ja-JP")}`;
	page.drawText(dateText, {
		x: margin,
		y: currentY,
		size: dateSize,
		font: customFont,
		color: rgb(0.5, 0.5, 0.5),
	});
	currentY -= dateSize + 20;

	// Summary
	const summarySize = 12;
	const summaryText = `総セッション数: ${sessions.length}`;
	page.drawText(summaryText, {
		x: margin,
		y: currentY,
		size: summarySize,
		font: customFont,
		color: rgb(0, 0, 0),
	});
	currentY -= summarySize + 20;

	// Table header
	const headerSize = 10;
	const rowHeight = 20;
	const cellPadding = 5;

	// Column widths
	const col1Width = 150; // セッション名
	const col2Width = 80; // 日付
	const col3Width = 70; // プレイヤー数
	const col4Width = 60; // ゲーム数
	const col5Width = 60; // 完了
	const col6Width = 80; // 作成日

	// Draw table header background
	page.drawRectangle({
		x: margin,
		y: currentY - rowHeight,
		width:
			col1Width + col2Width + col3Width + col4Width + col5Width + col6Width,
		height: rowHeight,
		color: rgb(0.9, 0.9, 0.9),
	});

	// Draw table header borders
	page.drawRectangle({
		x: margin,
		y: currentY - rowHeight,
		width:
			col1Width + col2Width + col3Width + col4Width + col5Width + col6Width,
		height: rowHeight,
		borderColor: rgb(0.6, 0.6, 0.6),
		borderWidth: 1,
	});

	// Draw header text
	const headers = [
		{ text: "セッション名", width: col1Width },
		{ text: "日付", width: col2Width },
		{ text: "プレイヤー数", width: col3Width },
		{ text: "ゲーム数", width: col4Width },
		{ text: "完了", width: col5Width },
		{ text: "作成日", width: col6Width },
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
	const rowSize = 9;
	for (const session of sessions) {
		const completedCount =
			session.games?.filter((g) => g.status === "completed").length ?? 0;
		const totalGames = session.games?.length ?? 0;

		// Check if we need a new page
		if (currentY - rowHeight < margin) {
			const newPage = pdfDoc.addPage([595.28, 841.89]);
			currentY = newPage.getSize().height - margin;
		}

		// Draw row background (alternating colors)
		const isEven = sessions.indexOf(session) % 2 === 0;
		if (isEven) {
			page.drawRectangle({
				x: margin,
				y: currentY - rowHeight,
				width:
					col1Width + col2Width + col3Width + col4Width + col5Width + col6Width,
				height: rowHeight,
				color: rgb(0.98, 0.98, 0.98),
			});
		}

		// Draw cell borders
		page.drawRectangle({
			x: margin,
			y: currentY - rowHeight,
			width:
				col1Width + col2Width + col3Width + col4Width + col5Width + col6Width,
			height: rowHeight,
			borderColor: rgb(0.8, 0.8, 0.8),
			borderWidth: 0.5,
		});

		// Draw row data
		const rowData = [
			{
				text:
					session.name.length > 20
						? `${session.name.substring(0, 20)}...`
						: session.name,
				width: col1Width,
			},
			{
				text: new Date(session.date).toLocaleDateString("ja-JP"),
				width: col2Width,
			},
			{ text: `${session.playerCount}人`, width: col3Width },
			{ text: totalGames.toString(), width: col4Width },
			{ text: `${completedCount}/${totalGames}`, width: col5Width },
			{
				text: new Date(session.createdAt).toLocaleDateString("ja-JP"),
				width: col6Width,
			},
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
