const { extractEmojiDataFromText } = require("../../libs/messageHandling.js");

function parseBoard(message) {
	const board = [];
	const lines = message.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineArray = [];
		const emojiArray = extractEmojiDataFromText(line);
		for (let j = 0; j < emojiArray.length; j++) {
			const emojiData = emojiArray[j];
			const nameArray = emojiData.name.split("_");
			const pieceTeam = nameArray[0];
			const pieceType = nameArray[1];
			const piece = pieceTeam.substring(0, 1) + pieceType.substring(0, 1);
			lineArray.push(piece);
		}
		board.push(lineArray);
	}
	return board;
}