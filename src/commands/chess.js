// #region IMPORTS
// Require the necessary discord.js classes
const { MessageActionRow, MessageButton, Message, Interaction } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
// #endregion

// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries for the command
const libPath = [__dirname, "..", "libs"];
const { generalInvHnd } = require(path.join(...libPath, "invitationHandling.js"));
const { generalBtnHnd } = require(path.join(...libPath, "buttonHandling.js"));
const { generalMsgHnd } = require(path.join(...libPath, "messageHandling.js"));
const { chessFnct, chessVars } = require(path.join(...libPath, "gameHandling.js"));
const { chessRnd } = require(path.join(...libPath, "render.js"));
const { extractEmojiDataFromText } = require(path.join(...libPath, "messageHandling.js"));

// #region VARIABLES
// Storage managment variables for the active games
const games = new Map();
let index = 0;

// The time in milliseconds after which an unaccepted invitation will be closed (14minutes)
const timeoutMs = 14 * 60 * 1000;
// #endregion

// #region COMMAND
// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("chess")
	.setDescription("You can play chess in a channel with this command.")
	.addBooleanOption(option => option
		.setName("start")
		.setDescription("You play as white, else the other player plays white."))
	.addUserOption(option => option
		.setName("opponent")
		.setDescription("The opponent you want to challenge, if not specified, the game is an open invitation."));

// Execute the command
exports.execute = async (interaction) => {
	// Get the invoking user
	const user = interaction.user;
	// Get the opponent user and the start option
	const opponent = interaction.options.getUser("opponent") || null;
	const start = interaction.options.getBoolean("start");
	// Define the first user and its id by the start variable
	const firstUser = start ? user : opponent;
	const firstUserID = firstUser ? firstUser.id : null;
	// Create and send the invitation or rejection message
	interaction.reply(generalInvHnd.createGameInvitation(interaction, "chess", index));
	if (opponent && opponent.id === user.id) return;
	// Initialize the game dictionary with the initial interaction, the invoking user and the ID of the user to make the first move
	games.set(`game${index}`, new Map([
		["interaction", interaction],
		["challenger", user],
		["nextTurnID", firstUserID],
		["whiteID", firstUserID],
		["blackID", user.id === firstUserID ? null : user.id],
	]));
	const game = games.get(`game${index}`);
	// Store reply as invitation
	game.set("invitation", await interaction.fetchReply());
	// Increment the game index and store current for timeout
	const thisGameIndex = index;
	index++;
	// Close the invitation if after the specified time the game has not been accepted or declined or the game is over
	setTimeout(() => {
		if (game && game.has("invitation")) {
			// Edit the invitation to being closed if the game is not over and the invitation is still open
			generalBtnHnd.removeAllMessageButtons(game.get("invitation"))
				.then(() => {
					generalMsgHnd.appendToMessage(game.get("invitation"), "**The invitation has been closed by the server, because it has not been accepted for too long.**");
				});
			// Remove the game from the games dictionary
			games.delete(`game${thisGameIndex}`);
		}
	}, timeoutMs);
};
// #endregion

// #region INVITATION BUTTONS
exports.accept = async (interaction, i, args = []) => {
	// By default ignore extra arguments
	args;
	// Extract correct game from the games dictionary
	const game = games.get(`game${i}`);
	if (game.get("whiteID") === null) {
		game.set("whiteID", interaction.user.id);
	}
	else if (game.get("blackID") === null) {
		game.set("blackID", interaction.user.id);
	}
	// Handle the Accept button interaction and potentially start the game
	generalInvHnd.handleAccept(interaction, game, i, chessFnct.startGame);
	if (!game) return;
};

exports.decline = async (interaction, i, args = []) => {
	// By default ignore extra arguments
	args;
	// Decline the invitation if the request is valid
	generalInvHnd.handleDecline(interaction, games, index);
	if (!games.get(`game${i}`)) return;
};
// #endregion

// #region GAME BUTTONS
exports.select = async (interaction, i, args = []) => {
	// Parse extra arguments to get the piece
	const piece = args.length > 0 ? args[0] : null;
	const square = args.length > 1 ? args[1] : null;

	// Extract correct game from the games dictionary
	const game = games.get(`game${i}`);
	const message = game.get("message");
	const instance = game.get("instance");
	console.log(instance.turn());
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if its the invoking users turn
	if (interaction.user.id === game.get("nextTurnID")) {
		let moveFilter = { "verbose": true };
		if (square) {
			moveFilter = { "verbose": true, "piece": piece[1], "square": square };
		}
		else if (piece) {
			moveFilter = { "verbose": true, "piece": piece[1] };
		}
		const moves = instance.moves(moveFilter);
		if (!piece) {
			const pieces = [...new Set(moves
				.map(move => move.color + move.piece))];
			const components = [];
			let rowIndex = -1;
			for (let j = 0; j < pieces.length; j++) {
				if (j % 5 === 0) {
					components.push(new MessageActionRow());
					rowIndex++;
				}
				if (pieces.length === 1) {
					components[rowIndex]
						.addComponents([new MessageButton()
							.setCustomId(`chess_select_${pieces[j]}_${moves[0].from}_${i}`)
							.setLabel(chessVars.ascii[pieces[j]]).setStyle("SECONDARY")]);
				}
				else {
					components[rowIndex]
						.addComponents([new MessageButton()
							.setCustomId(`chess_select_${pieces[j]}_${i}`)
							.setLabel(chessVars.ascii[pieces[j]]).setStyle("SECONDARY")]);
				}
			}
			message.edit({ "components": components });
		}
		// Check if the piece is a valid piece
		else if (piece.charAt(0) === "w" || piece.charAt(0) === "b") {
			let squares = [];
			let mainCommand = "";
			if (square) {
				// to-squares
				squares = moves.map(move => square + "_" + move.to);
				mainCommand = "move";
			}
			else {
				// from-squares
				squares = [...new Set(moves.map(move => move.from))];
				mainCommand = "select";
			}
			const components = [];
			let rowIndex = -1;
			for (let j = 0; j < squares.length; j++) {
				if (j % 5 === 0) {
					components.push(new MessageActionRow());
					rowIndex++;
				}
				const destinationSquare = squares[j].length > 2 ? squares[j].split("_")[1] : squares[j];
				components[rowIndex]
					.addComponents([new MessageButton()
						.setCustomId(`chess_${mainCommand}_${piece}_${squares[j]}_${i}`)
						.setLabel(destinationSquare).setStyle("SECONDARY")]);
				if (j === squares.length - 1) {
					if (squares.length % 5 === 0) {
						components.push(new MessageActionRow());
						rowIndex++;
					}
					const deselectID = square ? `chess_select_${piece}_${i}` :
						`chess_select_${i}`;
					components[rowIndex]
						.addComponents([new MessageButton()
							.setCustomId(deselectID)
							.setLabel("🔙").setStyle("DANGER")]);
				}
			}
			message.edit({ "components": components });
		}
		game.get("message").edit({
			"content": chessRnd.renderGame(
				instance.board(),
				piece ? instance.moves(moveFilter)
					.map(move => square ? move.to : move.from) : [],
				instance.turn() === "b",
			),
		});
		interaction.deferUpdate();
	}
	// Reply with a rejection message if its not the invoking users turn
	else {
		interaction.reply({ content: "It's not your turn.", ephemeral: true });
	}
};

exports.move = async (interaction, i, args = []) => {
	// Parse extra arguments to get the piece and square
	if (args.length < 3) {
		interaction.reply({ content: "Invalid move.", ephemeral: true });
		return;
	}
	const piece = args[0];
	const from = args[1];
	const to = args[2];

	// Extract correct game from the games dictionary
	const game = games.get(`game${i}`);
	const message = game.get("message");
	const instance = game.get("instance");
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if its the invoking users turn
	if (interaction.user.id === game.get("nextTurnID")) {
		// Check if the move is valid
		const move = instance.move({
			"color": instance.turn(),
			"from": from,
			"to": to,
			"piece": piece,
		});
		if (move) {
			game.set("nextTurnID", instance.turn() === "w" ?
				game.get("whiteID") : game.get("blackID"));
			const newMoves = instance.moves({ "verbose": true });
			const pieces = [...new Set(newMoves
				.map(newMove => newMove.color + newMove.piece))];
			const components = [];
			let rowIndex = -1;
			for (let j = 0; j < pieces.length; j++) {
				if (j % 5 === 0) {
					components.push(new MessageActionRow());
					rowIndex++;
				}
				components[rowIndex].addComponents([
					new MessageButton()
						.setCustomId(`chess_select_${pieces[j]}_${i}`)
						.setLabel(chessVars.ascii[pieces[j]])
						.setStyle("SECONDARY")]);
				message.edit({
					"content": chessRnd.renderGame(
						instance.board(),
						[],
						instance.turn() === "b",
					),
					"components": components,
				});
			}
			// Delete the last game reply if it exists
			if (game.get("lastInteraction")) {
			// Differentiate between message and replies
				if (game.get("lastInteraction") instanceof Message) {
					game.get("lastInteraction").delete();
				}
				else if (game.get("lastInteraction") instanceof Interaction) {
					game.get("lastInteraction").deleteReply();
				}
			}
			// Check if the game is over and who won
			if (instance.in_checkmate()) {
				// Change the thread name to reflect the winning user and post a message to the game thread
				setTimeout(() => { console.log("game was won"); }, 1000);
				game.get("thread").setName(`Game Over: ${interaction.user.username} won!`)
					.then(() => {
						interaction.reply({ content: `${interaction.user} won!` })
							.then(() => chessFnct.endGame(games, i));
					});
			}
			else if (instance.in_draw() || instance.in_threefold_repetition() || instance.in_stalemate() || instance.game_over()) {
				// Change the thread name to reflect a draw if a draw has been reached and post a message to the game thread
				setTimeout(() => { console.log("game was drawn"); }, 1000);
				game.get("thread").setName("Game Over: It's a draw!")
					.then(() => {
						interaction.reply({ content: "It's a draw! Nobody won." })
							.then(() => chessFnct.endGame(games, i));
					});
			}
			else {
				// Post a message to the game thread with information about the last move and ping the next user if the game is not over
				const checkInfo = instance.in_check() ? ", you are checked!" : "";
				const nextUser = game.get("challenger").id === interaction.user.id ? game.get("opponent") : game.get("challenger");
				interaction.reply({ content: `${nextUser}, your opponent moved his ${chessVars.names[move.piece]} from ${move.from} to ${move.to}${checkInfo}` });
				// Set this interaction as the last interaction
				game.set("lastInteraction", interaction);
			}
		}
		else {
			interaction.reply({ content: "Invalid move.", ephemeral: true });
		}
	}
};

// #endregion
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