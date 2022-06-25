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

function removeButtons(interaction, additionalContent = "") {
	interaction.fetchReply().then(message => {
		let content = message.content;
		if (additionalContent) {
			content += "\n" + additionalContent;
		}
		interaction.editReply({ content: content, components: [] });
	});
}

function startGame(interaction, i) {
	removeButtons(games[`game${i}`].invitation, `**The challenge has been accepted by ${interaction.user}.**`);
	const thread = interaction.message.startThread({
		name: `Tic Tac Toe game between ${games[`game${i}`].user.username} and ${games[`game${i}`].opponent.username}`,
	});
	games[`game${i}`].thread = thread;
	delete games[`game${i}`].invitation;

	thread.send({
		content: tictactoe.renderTicTacToe([["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"]]),
		components: [],
	}).then(message => {
		games[`game${i}`].message = message;
		games[`game${i}`].board = parseBoard(message.content);
	});
}

function endGame(i) {
	const game = games[`game${i}`];
	delete games[`game${i}`];
	game.thread.setLocked(true);
}

// Execute the command
exports.execute = async (interaction) => {
	const row = new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId(`tictactoe_accept_${index}`)
				.setLabel("Accept")
				.setStyle("PRIMARY"),
			new MessageButton()
				.setCustomId(`tictactoe_decline_${index}`)
				.setLabel("Decline")
				.setStyle("DANGER"),
		]);

	let start = interaction.options.getBoolean("start");
	start = start ? start : false;
	const opponent = interaction.options.getUser("opponent");
	const user = interaction.user;

	// if (opponent.id === user.id) {
	// 	interaction.reply({content: "You can't challenge yourself.", ephemeral: true});
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
	const game = games[`game${i}`];
	if (game.opponent) {
		if (game.opponent.id === interaction.user.id) {
			startGame(interaction, i);
		}
		else if (game.user.id === interaction.user.id) {
			interaction.reply({ content: "You can't accept this challenge for the opponent.", ephemeral: true });
		}
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	else if (game.user.id === interaction.user.id) {
		interaction.reply({ content: "You can't accept your own challenge.", ephemeral: true });
	}
	else {
		games[`game${i}`].opponent = interaction.user;
		startGame(interaction, i);
	}
};

exports.decline = async (interaction, i) => {
	const game = games[`game${i}`];
	if (game.opponent) {
		if (game.opponent.id === interaction.user.id) {
			removeButtons(game.invitation, "**The challenge has been declined.**");
			delete games[`game${i}`];
		}
		else if (game.user.id === interaction.user.id) {
			removeButtons(game.invitation, "**The challenge has been canceled.**");
			delete games[`game${i}`];
		}
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	else if (game.user.id === interaction.user.id) {
		removeButtons(game.invitation, `**${interaction.user} canceled the challenge.**`);
		delete games[`game${i}`];
	}
	else {
		removeButtons(game.invitation, `**${interaction.user} declined the challenge.**`);
		delete games[`game${i}`];
	}
};
// interaction.reply({
// 	content: tictactoe.renderTicTacToe(
// 		[["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"]],
// 	),
// 	fetchReply: true,
// }).then(sentMessage => {
// 	const board = parseBoard(sentMessage.content);
// });