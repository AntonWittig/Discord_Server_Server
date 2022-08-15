// #region IMPORTS
// Require the necessary discord.js classes
const { Message, Interaction } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries for the command
const libPath = [__dirname, "..", "libs"];
const { generalInvHnd } = require(path.join(...libPath, "invitationHandling.js"));
const { generalBtnHnd } = require(path.join(...libPath, "buttonHandling.js"));
const { generalMsgHnd } = require(path.join(...libPath, "messageHandling.js"));
const { tictactoeFnct } = require(path.join(...libPath, "gameHandling.js"));
const { tictactoeRnd } = require(path.join(...libPath, "render.js"));
// #endregion

// #region VARIABLES
// Storage managment variables for the active games
const games = new Map();
let index = 0;

// The time in milliseconds after which an unaccepted invitation will be closed (14minutes)
const timeoutMs = 14 * 60 * 1000;
// #endregion

// #region COMMAND
// Initialize the command with a name, description and options
exports.data = new SlashCommandBuilder()
	.setName("tictactoe")
	.setDescription("You can play tic tac toe in a channel with this command.")
	.addBooleanOption(option => option
		.setName("start")
		.setDescription("You make the first move, else the other player makes the first move."))
	.addUserOption(option => option
		.setName("opponent")
		.setDescription("The opponent you want to challenge, if not specified, the game is an open invitation."));

// The command execution function to invite other users to a tictactoe game
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
	interaction.reply(generalInvHnd.createGameInvitation(interaction, "tictactoe", index));
	if (opponent && opponent.id === user.id) return;
	// Initialize the game dictionary with the initial interaction, the invoking user and the ID of the user to make the first move
	games.set(`game${index}`, new Map([
		["interaction", interaction],
		["challenger", user],
		["nextTurnID", firstUserID],
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
	// Handle the Accept button interaction and potentially start the game
	interaction.reply(generalInvHnd.handleAccept(interaction, game, i, tictactoeFnct.startGame));
	if (!game) return;
};

exports.decline = async (interaction, i, args = []) => {
	// By default ignore extra arguments
	args;
	// Decline the invitation if the request is valid
	interaction.reply(generalInvHnd.handleDecline(interaction, games, index));
	if (!games.get(`game${i}`)) return;
};
// #endregion

// #region GAME BUTTONS
exports.place = async (interaction, i, args = []) => {
	// Parse extra arguments to get the column(x) and row(y)
	const position = { x: parseInt(args[0]), y: parseInt(args[1]) };
	// Extract correct game from the games dictionary
	const game = games.get(`game${i}`);
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if its the invoking users turn
	if (interaction.user.id === game.get("nextTurnID")) {
		// Parse the game message to get the current board and create necessary otherUser variable
		const board = tictactoeFnct.parseBoard(game.get("message").content);
		game.set("board", board);
		let otherUser;
		// Check if the invoking user is the challenged user/opponent
		if (interaction.user === game.get("opponent")) {
			// Place a circle on the board at the parsed position
			board[position.y][position.x] = "o";
			// Set the nextTurnID and otherUser variable to the non-invoking user
			game.set("nextTurnID", game.get("challenger").id);
			otherUser = game.get("challenger");
		}
		// Check if the invoking user is the challenging user
		else if (interaction.user === game.get("challenger")) {
			// Place a cross on the board at the parsed position
			board[position.y][position.x] = "x";
			// Set the nextTurnID and otherUser variable to the non-invoking user
			game.set("nextTurnID", game.get("opponent").id);
			otherUser = game.get("opponent");
		}
		// Get the current game components/buttons and disable all on whichs corresponding position a circle or cross has been placed
		const components = game.get("message").components;
		const newComponents = generalBtnHnd.disableUnempty(board, components);
		// Update the game message with the new board and components
		game.get("message").edit({ content: tictactoeRnd.renderGame(board), components: newComponents });
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
		const winner = tictactoeFnct.checkWin(board);
		if (winner) {
			// Change the thread name to reflect a draw if a draw has been reached and post a message to the game thread
			if (winner === "e") {
				game.get("thread").setName("Game Over: It's a draw!")
					.then(() => {
						interaction.reply({ content: "It's a draw! Nobody won." })
							.then(() => tictactoeFnct.endGame(games, i));
					});
			}
			// Change the thread name to reflect the winning user and post a message to the game thread
			else {
				game.get("thread").setName(`Game Over: ${interaction.user.username} won!`)
					.then(() => {
						interaction.reply({ content: `${interaction.user} won!` })
							.then(() => tictactoeFnct.endGame(games, i));
					});
			}
		}
		// Post a message to the game thread with information about the last move and ping the next user if the game is not over
		else {
			interaction.reply({ content: `${otherUser}, your opponent placed an "${board[position.y][position.x]}" at ${position.x}, ${position.y}` });
			// Set this interaction as the last interaction
			game.set("lastInteraction", interaction);
		}
	}
	// Reply with a rejection message if its not the invoking users turn
	else {
		interaction.reply({ content: "It's not your turn.", ephemeral: true });
	}
};
// #endregion