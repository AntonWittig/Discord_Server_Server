// Require the necessary discord.js class
const { MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { extractEmojiDataFromText } = require("../../libs/messageHandling.js");
const { tictactoe } = require("../../libs/render.js");

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("tictactoe")
	.setDescription("You can play tic tac toe in a channel with this command.")
	.addBooleanOption(option => option
		.setName("start").setDescription("You make the first move, else the other player makes the first move."))
	.addUserOption(option => option
		.setName("opponent").setDescription("The opponent you want to challenge, if not specified, the game is an open invitation."));

function parseBoard(message) {
	const board = [];
	const lines = message.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineArray = [];
		const emojiArray = extractEmojiDataFromText(line);
		for (let j = 0; j < emojiArray.length; j++) {
			const emojiData = emojiArray[j];
			const symbolName = emojiData.name;
			if (symbolName === "white_medium_square") {
				lineArray.push("e");
			}
			lineArray.push(symbolName);
		}
		board.push(lineArray);
	}
	return board;
}

const dict = {};
let i = 0;
// Execute the command
exports.execute = async (interaction) => {
	const row = new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("accept")
				.setLabel("Accept")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("decline")
				.setLabel("Decline")
				.setStyle("DANGER"),
		]);

	const start = interaction.options.getBoolean("start");
	const opponent = interaction.options.getUser("opponent");
	const user = interaction.user;

	if (opponent) {
		interaction.reply({ content: `${user} challenges ${opponent} for a tic tac toe game, will he accept?`, components: [row] });
		dict[i] = "b";
		i++;
		console.log(dict);
	}
	else {
		interaction.reply("a");
	}
	if (start) return;
};

// interaction.reply({
// 	content: tictactoe.renderTicTacToe(
// 		[["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"]],
// 	),
// 	fetchReply: true,
// }).then(sentMessage => {
// 	const board = parseBoard(sentMessage.content);
// });