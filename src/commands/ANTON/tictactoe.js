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
				.setCustomId("tictactoe_place_0_0_i")
				.setLabel("↖️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_0_i")
				.setLabel("⬆️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_0_i")
				.setLabel("↗️")
				.setStyle("SECONDARY"),
		]),
	new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_place_0_1_i")
				.setLabel("⬅️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_1_i")
				.setLabel("⏹️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_1_i")
				.setLabel("➡️")
				.setStyle("SECONDARY"),
		]),
	new MessageActionRow()
		.addComponents([
			new MessageButton()
				.setCustomId("tictactoe_place_0_2_i")
				.setLabel("↙️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_1_2_i")
				.setLabel("⬇️")
				.setStyle("SECONDARY"),
			new MessageButton()
				.setCustomId("tictactoe_place_2_2_i")
				.setLabel("↘️")
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
			else {
				lineArray.push(symbolName);
			}
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
				components[i].components[j].setDisabled(true);
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
		const components = originalComponents;
		for (let j = 0; j < components.length; j++) {
			const componentRow = components[j];
			for (let k = 0; k < componentRow.components.length; k++) {
				componentRow.components[k].setCustomId(`tictactoe_place_${k}_${j}_${i}`);
			}
		}
		thread.send({
			content: tictactoe.renderTicTacToe(originalBoard),
			components: originalComponents,
		}).then(message => {
			games[`game${i}`].message = message;
			games[`game${i}`].board = parseBoard(message.content);
		});
	});
}

function checkWin(board) {
	if (board !== undefined) {
		for (let i = 0; i < board.length; i++) {
			const row = board[i];
			if (row[0] !== "e" && row[0] === row[1] && row[1] === row[2]) {
				return row[0];
			}
			const col = [board[0][i], board[1][i], board[2][i]];
			if (col[0] !== "e" && col[0] === col[1] && col[1] === col[2]) {
				return col[0];
			}
		}
		const diag1 = [board[0][0], board[1][1], board[2][2]];
		if (diag1[0] !== "e" && diag1[0] === diag1[1] && diag1[1] === diag1[2]) {
			return diag1[0];
		}
		const diag2 = [board[0][2], board[1][1], board[2][0]];
		if (diag2[0] !== "e" && diag2[0] === diag2[1] && diag2[1] === diag2[2]) {
			return diag2[0];
		}
		if (board.every(row => row.every(piece => piece !== "e"))) {
			return "e";
		}
	}
	return false;
}

function endGame(i) {
	const game = games[`game${i}`];
	delete games[`game${i}`];
	disableAlreadyPlaced(
		[["x", "x", "x"], ["x", "x", "x"], ["x", "x", "x"]],
		game.message.components);
	game.thread.setLocked(true);
	game.thread.setArchived(true);
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

	// if (opponent.id === user.id) {
	// 	interaction.reply({ content: "You can't challenge yourself.", ephemeral: true });
	// 	return;
	// }

	games[`game${index}`] = {
		invitation: interaction,
		user: user,
		nextTurnID: firstUser.id,
	};

	if (opponent) {
		interaction.reply({ content: `${user} challenges ${opponent} for a tic tac toe game, will they accept?`, components: [row] });
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
	if (interaction.user.id === game.nextTurnID) {
		const board = games[`game${i}`].board = parseBoard(game.message.content);
		const components = game.message.components;
		let otherUser;
		if (interaction.user === game.opponent) {
			board[position.y][position.x] = "o";
			games[`game${i}`].nextTurnID = game.user.id;
			otherUser = game.user;
		}
		else if (interaction.user === game.user) {
			board[position.y][position.x] = "x";
			games[`game${i}`].nextTurnID = game.opponent.id;
			otherUser = game.opponent;
		}
		const newComponents = disableAlreadyPlaced(board, components);
		game.message.edit({ content: tictactoe.renderTicTacToe(board), components: newComponents });
		if (game.lastInteraction) {
			game.lastInteraction.deleteReply();
		}
		const winner = checkWin(board);
		if (winner) {
			if (winner === "e") {
				game.thread.setName("Game Over: It's a draw!");
				interaction.reply({ content: "It's a draw! Nobody won." }).then(() => endGame(i));
			}
			else {
				game.thread.setName(`Game Over: ${interaction.user.username} won!`);
				interaction.reply({ content: `${interaction.user} won!` }).then(() => endGame(i));
			}
		}
		else {
			interaction.reply({ content: `${otherUser}, your opponent placed an "${board[position.y][position.x]}" at ${position.x}, ${position.y}` });
			games[`game${i}`].lastInteraction = interaction;
		}
	}
	else {
		interaction.reply({ content: "It's not your turn.", ephemeral: true });
	}
};