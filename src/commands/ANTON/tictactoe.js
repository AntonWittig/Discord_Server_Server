// Require the necessary discord.js class
const { MessageActionRow, MessageButton } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { extractEmojiDataFromText } = require("../../libs/messageHandling.js");
const { tictactoe } = require("../../libs/render.js");

const games = {};
let index = 0;

const originalBoard = [["e", "e", "e"], ["e", "e", "e"], ["e", "e", "e"]];
const originalComponents = [
	new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_place_0_0_")
				.setLabel("")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_0_")
				.setLabel("top middle")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_0_")
				.setLabel("top right")
				.setStyle("SECONDARY"),
		]),
	new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_place_0_1_")
				.setLabel("middle left")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_1_")
				.setLabel("middle")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_1_")
				.setLabel("middle right")
				.setStyle("SECONDARY"),
		]),
	new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_place_0_2_")
				.setLabel("bottom left")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_2_")
				.setLabel("bottom middle")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_2_")
				.setLabel("bottom right")
				.setStyle("SECONDARY"),
		]),
];

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

function disableAlreadyPlaced(board, components) {
	for (let i = 0; i < board.length; i++) {
		for (let j = 0; j < board[i].length; j++) {
			const piece = board[i][j];
			if (piece !== "e") {
				components[i][j].disabled = true;
			}
		}
	}
	return components;
}

function startGame(interaction, i) {
	removeButtons(games[`game${i}`].invitation, `**The challenge has been accepted by ${interaction.user}.**`);
	interaction.message.startThread({
		name: `Tic Tac Toe game between ${games[`game${i}`].user.username} and ${games[`game${i}`].opponent.username}`,
	}).then(thread => {
		games[`game${i}`].thread = thread;
		delete games[`game${i}`].invitation;
		thread.send({
			content: tictactoe.renderTicTacToe(originalBoard),
			components: originalComponents,
		}).then(message => {
			games[`game${i}`].message = message;
			games[`game${i}`].board = parseBoard(message.content);
		});
		console.log(games[`game${i}`]);
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

	const opponent = interaction.options.getUser("opponent");
	const user = interaction.user;
	const start = interaction.options.getBoolean("start");
	const firstUser = start ? user : opponent;

	// TODO decomment this
	// if (opponent.id === user.id) {
	// 	interaction.reply({content: "You can't challenge yourself.", ephemeral: true});
	// 	return;
	// }

	games[`game${index}`] = {
		invitation: interaction,
		user: user,
		nextTurn: firstUser,
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


exports.accept = async (interaction, i, args = []) => {
	console.log(args);

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

exports.decline = async (interaction, i, args = []) => {
	console.log(args);

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

exports.place = async (interaction, i, args = []) => {
	console.log(args);

	const position = { x: parseInt(args[0]), y: parseInt(args[1]) };
	const game = games[`game${i}`];
	if (interaction.user === game.nextTurn) {
		const board = games[`game${i}`].board = parseBoard(game.message.content);
		const components = game.message.components;
		if (interaction.user === game.opponent) {
			board[position.y][position.x] = "o";
			game[`game${i}`].nextTurn = game.user;
		}
		else if (interaction.user === game.user) {
			board[position.y][position.x] = "x";
			game[`game${i}`].nextTurn = game.opponent;
		}
		const newComponents = disableAlreadyPlaced(board, components);
		game.message.edit({ content: tictactoe.renderTicTacToe(board), components: newComponents });
	}
	console.log(game);
};