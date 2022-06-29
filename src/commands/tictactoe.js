// #region IMPORTS
// Require the necessary discord.js class
const { MessageActionRow, MessageButton, Message, Interaction } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries for the command
const libPath = [__dirname, "..", "libs"];
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
	// Initialize the "Accept" and "Decline" buttons
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
	// Get the invoking user
	const user = interaction.user;
	// Get the opponent user and the start option
	const opponent = interaction.options.getUser("opponent");
	const start = interaction.options.getBoolean("start");
	// Define the first user and its id by the start variable
	const firstUser = start ? user : opponent;
	const firstUserID = firstUser === undefined || firstUser === null ? undefined : firstUser.id;
	// Return a command rejection message if the invoking user wants to challenge himself
	if (opponent && opponent.id === user.id) {
		interaction.reply({ content: "You can't challenge yourself.", ephemeral: true });
		return;
	}
	// Initialize the game dictionary with the initial interaction, the invoking user and the ID of the user to make the first move
	games.set(`game${index}`, {
		invitation: interaction,
		challenger: user,
		nextTurnID: firstUserID,
	});
	const game = games.get(`game${index}`);
	// Check if the opponent user is specified and reply with a challenge message
	if (opponent) {
		interaction.reply({ content: `${user} challenges ${opponent} for a tic tac toe game, will they accept?`, components: [row] });
		// Add the opponent to the game dictionary
		game.opponent = opponent;
	}
	else {
		const guildName = interaction.guild.name.toUpperCase();
		const tictactoeRoleID = process.env[`ROLE_ID_${guildName}_TICTACTOE`];
		const roleMessagePart = tictactoeRoleID === undefined || tictactoeRoleID == null ? "tic tac toe" : `<@&${tictactoeRoleID}>`;
		// Reply with an open invitation message
		interaction.reply({ content: `${user} wants to play a game of ${roleMessagePart} against anyone, do you accept?`, components: [row] });
	}
	// Increment the game index and store current for timeout
	const thisGameIndex = index;
	index++;
	// Close the invitation if after the specified time the game has not been accepted or declined or the game is over
	setTimeout(() => {
		if (game && game.invitation) {
			// Edit the invitation to being closed if the game is not over and the invitation is still open
			generalBtnHnd.removeAllReplyButtons(game.invitation)
				.then(() => {
					generalMsgHnd.appendToReply(game.invitation, "**The invitation has been closed by the server, because it has not been accepted for too long.**");
				});
			// Remove the game from the games dictionary
			games.delete(`game${thisGameIndex}`);
		}
	}, timeoutMs);
};
// #endregion

// #region INVITATION BUTTONS // TODO - move to libs (invitationHandling.js)
exports.accept = async (interaction, i, args = []) => {
	// By default ignore extra arguments
	args;
	// Extract correct game from the games dictionary
	const game = games.get(`game${i}`);
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if an opponent has been specified in the invitation
	if (game.opponent) {
		// Check if the invoking user is the challenged user/opponent and start the game if so
		if (interaction.user.id === game.opponent.id) {
			tictactoeFnct.startGame(interaction, game, i);
		}
		// Reply with a rejection message if the invoking user is the challenging user
		else if (interaction.user.id === game.challenger.id) {
			interaction.reply({ content: "You can't accept this challenge for the opponent.", ephemeral: true });
		}
		// Reply with a rejection message if the invoking user is neither the challenging user nor the challenged user/opponent
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	// Reply with a rejection message if the invoking user wants to accept their own open invitation has been specified
	else if (interaction.user.id === game.challenger.id) {
		interaction.reply({ content: "You can't accept your own challenge.", ephemeral: true });
	}
	// Start the game if the invoking user is not the challenging user
	else {
		game.opponent = interaction.user;
		// Set the invoking user to be the starting user if the challenging user doesn't want to start
		game.nextTurnID = game.nextTurnID === undefined ? interaction.user.id : game.nextTurnID;
		tictactoeFnct.startGame(interaction, i);
	}
};

exports.decline = async (interaction, i, args = []) => {
	// By default ignore extra arguments
	args;
	// Extract correct game from the games dictionary
	const game = games[`game${i}`];
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if an opponent has been specified in the invitation
	if (game.opponent) {
		// Edit the invitation to being declined if the invoking user is the challenged user/opponent
		if (interaction.user.id === game.opponent.id) {
			generalBtnHnd.removeAllReplyButtons(game.invitation)
				.then(() => {
					generalMsgHnd.appendToReply(game.invitation, "**The challenge has been declined.**");
				});
			games.delete(`game${i}`);
		}
		// Edit the invitation to being cancelled if the invoking user is the challenging user
		else if (game.challenger.id === interaction.user.id) {
			generalBtnHnd.removeAllReplyButtons(game.invitation)
				.then(() => {
					generalMsgHnd.appendToReply(game.invitation, "**The challenge has been cancelled.**");
				});
			games.delete(`game${i}`);
		}
		// Reply with a rejection message if the invoking user is neither the challenging user nor the challenged user/opponent
		else {
			interaction.reply({ content: "This challenge is not meant for you.", ephemeral: true });
		}
	}
	// Edit the invitation to being cancelled if the invoking user is the challenging user
	else if (game.challenger.id === interaction.user.id) {
		generalBtnHnd.removeAllReplyButtons(game.invitation)
			.then(() => {
				generalMsgHnd.appendToReply(game.invitation, `**${interaction.user} cancelled the challenge.**`);
			});
		games.delete(`game${i}`);
	}
	// Edit the invitation to being declined if the invoking user is any user but the challenging user
	else {
		generalBtnHnd.removeAllReplyButtons(game.invitation)
			.then(() => {
				generalMsgHnd.appendToReply(game.invitation, `**${interaction.user} declined the challenge.**`);
			});
		games.delete(`game${i}`);
	}
};
// #endregion

// #region GAME BUTTONS
exports.place = async (interaction, i, args = []) => {
	// Parse extra arguments to get the column(x) and row(y)
	const position = { x: parseInt(args[0]), y: parseInt(args[1]) };
	// Extract correct game from the games dictionary
	const game = games[`game${i}`];
	// Send a rejection message if the game has already ended
	if (!game) {
		interaction.reply({ content: "The game has already ended.", ephemeral: true });
		return;
	}
	// Check if its the invoking users turn
	if (interaction.user.id === game.nextTurnID) {
		// Parse the game message to get the current board and create necessary otherUser variable
		const board = game.board = tictactoeFnct.parseBoard(game.message.content);
		let otherUser;
		// Check if the invoking user is the challenged user/opponent
		if (interaction.user === game.opponent) {
			// Place a circle on the board at the parsed position
			board[position.y][position.x] = "o";
			// Set the nextTurnID and otherUser variable to the non-invoking user
			game.nextTurnID = game.challenger.id;
			otherUser = game.challenger;
		}
		// Check if the invoking user is the challenging user
		else if (interaction.user === game.challenger) {
			// Place a cross on the board at the parsed position
			board[position.y][position.x] = "x";
			// Set the nextTurnID and otherUser variable to the non-invoking user
			game.nextTurnID = game.opponent.id;
			otherUser = game.opponent;
		}
		// Get the current game components/buttons and disable all on whichs corresponding position a circle or cross has been placed
		const components = game.message.components;
		const newComponents = generalBtnHnd.disableUnempty(board, components);
		// Update the game message with the new board and components
		game.message.edit({ content: tictactoeRnd.renderTicTacToe(board), components: newComponents });
		// Delete the last game reply if it exists
		if (game.lastInteraction && game.lastInteraction.type) {
			// Differentiate between message and replies
			if (game.lastInteraction instanceof Message) {
				game.lastInteraction.delete();
			}
			else if (game.lastInteraction instanceof Interaction) {
				game.lastInteraction.deleteReply();
			}
		}
		// Check if the game is over and who won
		const winner = tictactoeFnct.checkWin(board);
		if (winner) {
			// Change the thread name to reflect a draw if a draw has been reached and post a message to the game thread
			if (winner === "e") {
				game.thread.setName("Game Over: It's a draw!")
					.then(() => {
						interaction.reply({ content: "It's a draw! Nobody won." })
							.then(() => tictactoeFnct.endGame(i));
					});
			}
			// Change the thread name to reflect the winning user and post a message to the game thread
			else {
				game.thread.setName(`Game Over: ${interaction.user.username} won!`)
					.then(() => {
						interaction.reply({ content: `${interaction.user} won!` })
							.then(() => tictactoeFnct.endGame(i));
					});
			}
		}
		// Post a message to the game thread with information about the last move and ping the next user if the game is not over
		else {
			interaction.reply({ content: `${otherUser}, your opponent placed an "${board[position.y][position.x]}" at ${position.x}, ${position.y}` });
			// Set this interaction as the last interaction
			game.lastInteraction = interaction;
		}
	}
	// Reply with a rejection message if its not the invoking users turn
	else {
		interaction.reply({ content: "It's not your turn.", ephemeral: true });
	}
};
// #endregion