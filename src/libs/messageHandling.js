exports.extractEmojiDataFromText = function(text) {
	const emojiArray = [];
	let position = 0;
	while (position < text.length) {
		const emojiData = {};

		let emojiStart = text.indexOf(":", position);
		if (emojiStart === -1) break;
		let emojiEnd;
		let isDefault = false;
		if (text[emojiStart - 1] === "<"
			|| (text[emojiStart - 1] === "a" && text[emojiStart - 2] === "<")) {

			emojiEnd = text.indexOf(">", emojiStart);
			if (emojiEnd === -1) {isDefault = true;}
			else if (text[emojiStart - 1] === "a") {
				emojiData["animated"] = true;
				emojiStart += 1;
			}
			else {
				emojiData["animated"] = false;
			}
		}
		else {
			emojiEnd = text.indexOf(":", emojiStart + 1);
			if (emojiEnd === -1) break;
			isDefault = true;
		}
		const emoji = text.substring(emojiStart, emojiEnd);
		if (!isDefault) {
			const emojiDataArray = emoji.split(":");
			if (emojiDataArray.length === 2) {
				emojiData["name"] = emojiDataArray[0];
				emojiData["id"] = emojiDataArray[1];
			}
		}
		else {
			emojiData["name"] = emoji;
		}
		position = emojiEnd + 1;
		emojiArray.push(emojiData);
	}
	return emojiArray;
};

// function extractEmojiDataFromLine(line) {
// 	const emojiArray = [];
// 	let position = 0;
// 	while (position < line.length) {
// 		const emojiData = {};
// 		const emojiStart = line.indexOf("<:", position);
// 		if (emojiStart === -1) break;
// 		const emojiEnd = line.indexOf(">", emojiStart);
// 		if (emojiEnd === -1) break;
// 		const emoji = line.substring(emojiStart, emojiEnd + 1);
// 		const emojiDataArray = emoji.split(":");
// 		if (emojiDataArray.length === 3) {
// 			emojiData["animated"] = emojiDataArray[0] === "a";
// 			emojiData["name"] = emojiDataArray[1];
// 			emojiData["id"] = emojiDataArray[2];
// 		}
// 		position = emojiEnd + 1;
// 		emojiArray.push(emojiData);
// 	}
// 	return emojiArray;
// }