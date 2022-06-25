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

// Execute the command
exports.execute = async (interaction) => {
	// TODO remove
	console.log(games);
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
	// TODO remove
	console.log(games);
	if (games[`game${i}`].opponent) {
		if (games[`game${i}`].opponent.id === interaction.user.id) {
			removeButtons(games[`game${i}`].invitation, "**The challenge has been accepted.**");
			const thread = interaction.channel.threads.create({
				name: `Tic Tac Toe game between ${games[`game${i}`].user.username} and ${games[`game${i}`].opponent.username}`,
			});
			games[`game${i}`].thread = thread;
		}
		else if (games[`game${i}`].user.id === interaction.user.id) {
			interaction.reply({ content: "You can't accept this challenge for the opponent.", ephemeral: true });
		}
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	else if (games[`game${i}`].user.id === interaction.user.id) {
		interaction.reply({ content: "You can't accept your own challenge.", ephemeral: true });
	}
	else {
		removeButtons(games[`game${i}`].invitation, `**The challenge has been accepted by ${interaction.user}.**`);
	}
};

exports.decline = async (interaction, i) => {
	// TODO remove
	console.log(games);
	const game = games[`game${i}`];
	if (game.opponent) {
		if (game.opponent.id === interaction.user.id) {
			removeButtons(game.invitation, "**The challenge has been declined.**");
			games.delete(`game${i}`);
		}
		else if (game.user.id === interaction.user.id) {
			removeButtons(game.invitation, "**The challenge has been canceled.**");
			games.delete(`game${i}`);
		}
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	else if (game.user.id === interaction.user.id) {
		removeButtons(game.invitation, `**${interaction.user} canceled the challenge.**`);
	}
	else {
		removeButtons(game.invitation, `**${interaction.user} declined the challenge.**`);
		games.delete(`game${i}`);
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