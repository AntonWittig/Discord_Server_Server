// Require the necessary discord.js class
const { MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { extractEmojiDataFromText } = require("../../libs/messageHandling.js");
const { tictactoe } = require("../../libs/render.js");

const games = {};
let index = 0;

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

function removeButtons(interaction) {
	interaction.fetchReply().then(message => {
		interaction.editReply({ content: message.content, components: [] });
	});
}

// Execute the command
exports.execute = async (interaction) => {
	// TODO remove
	console.log(games);
	const row = new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_accept_")
				.setLabel("Accept")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId("tictactoe_decline")
				.setLabel("Decline")
				.setStyle("DANGER"),
		]);

	const start = interaction.options.getBoolean("start");
	const opponent = interaction.options.getUser("opponent");
	const user = interaction.user;

	// if (opponent.id === user.id) {
	// 	interaction.reply("You can't challenge yourself.");
	// 	return;
	// }

	games[`game${index}`] = {
		invitation: interaction,
		user: user,
		userStart: start,
	};

	if (opponent) {
		interaction.reply({ content: `${user} challenges ${opponent} for a tic tac toe game, will he accept?`, components: [row] });
		games[`game${index}`].opponent = opponent;
	}
	else {
		interaction.reply({ content: `${user} wants to play tic tac toe against anyone, do you accept?`, components: [row] });
	}
	index++;
};

exports.accept = async (interaction, i) => {
	removeButtons(games[`game${i}`].invitation);
	// TODO remove
	console.log(games);
	if (games[`game${i}`].opponent) {
		if (games[`game${i}`].opponent.id === interaction.user.id) {
			const thread = interaction.channel.threads.create({
				name: `Tic Tac Toe game between ${games[`game${i}`].user.username} and ${games[`game${i}`].opponent.username}`,
			});
			games[`game${i}`].thread = thread;
		}
		else {
			interaction.reply({ content: "You can't accept this challenge.", ephermal: true });
		}
	}
	else {
		interaction.reply("a");
	}
};

exports.decline = async (interaction, i) => {
	removeButtons(games[`game${i}`].invitation);
	// TODO remove
	console.log(games);
	interaction.reply("You declined the challenge.");
};
// interaction.reply({
// 	content: tictactoe.renderTicTacToe(
// 		[["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"]],
// 	),
// 	fetchReply: true,
// }).then(sentMessage => {
// 	const board = parseBoard(sentMessage.content);
// });