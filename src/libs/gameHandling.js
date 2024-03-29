// #region IMPORTS
// Require the necessary discord.js class
const { MessageActionRow, MessageButton } = require("discord.js");

// Import the chess module for handling chess games
const chessPromise = import("chess.js");
let chessjs;
chessPromise.then(chess => { chessjs = chess; });
// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries
const libPath = [__dirname];
const { generalMsgHnd } = require(path.join(...libPath, "messageHandling.js"));
const { generalBtnHnd } = require(path.join(...libPath, "buttonHandling.js"));
const { tictactoeRnd, chessRnd } = require(path.join(...libPath, "render.js"));
const deepClone = require(path.join(...libPath, "deepClone.js"));
// #endregion

// #region VARIABLES
const GameType = {
	TicTacToe: "Tic Tac Toe",
	Chess: "Chess",
};
// #endregion

// #region GENERAL
const general = {
	/**
	 * This function is used to extract the board data from a message.
	 * @param	{String}				message
	 * The message to extract the board data from.
	 * @param	{Object}				representations
	 * The representations of emojis on the game board
	 * @return	{Array<Array<String>>}	The board of the game
	 */
	parseBoard: function(message, representations = undefined) {
		// Initialize the board
		const board = [];
		// Split the message into lines
		const lines = message.split("\n");

		// Loop through the lines
		for (let i = 0; i < lines.length; i++) {
			// Initialize the ith board row
			const boardRow = [];
			// Extract emojis from the line
			const lineEmojis = generalMsgHnd.extractEmojiDataFromText(lines[i]);

			// Loop through the emojis
			for (let j = 0; j < lineEmojis.length; j++) {
				// Get the emoji name
				const emojiName = lineEmojis[j].name;
				// Push the representation of the emoji to the board row
				boardRow.push(representations[emojiName]);
			}
			// Push the board row to the board
			board.push(boardRow);
		}
		return board;
	},

	/**
	 * Starts a new game after an invitation has been accepted
	 * @param	{Interaction<CacheType>}		interaction
	 * The interaction object for the "Accept" Button interaction
	 * @param	{Map<String, Object|String>}	game
	 * The game dictionary holding various game data
	 * @param	{GameType}						gameType
	 * The type of game to start
	 * @param	{Array<MessageActionRow>}		originalComponents
	 * The original components matrix of the message
	 * @param	{Function}						componentHandling
	 * The function to handle/edit the original components of the message
	 * @param	{Array<Array<String>>}			originalBoard
	 * The original/initial board of the game
	 */
	startGame: function(interaction, game, gameType, originalBoard = [], originalComponents = [], componentHandling = null) {
		// Define namespaces depending on game type
		let gameNamespace = {}, renderNamespace = {};
		switch (gameType) {
		case GameType.TicTacToe:
			gameNamespace = tictactoe;
			renderNamespace = tictactoeRnd;
			break;
		case GameType.Chess:
			gameNamespace = chess;
			renderNamespace = chessRnd;
			break;
		}
		// Remove Buttons from the invitation message and append that it has been accepted
		generalBtnHnd.removeAllMessageButtons(game.get("invitation"))
			.then(() => {
				generalMsgHnd.appendToMessage(game.get("invitation"), `**The challenge has been accepted by ${interaction.user}.**`);
			});
		// Start a thread on the invitation message to play the game in
		interaction.message.startThread({
			name: `${gameType} game between ${game.get("challenger").username} and ${game.get("opponent").username}`,
		}).then(thread => {
		// Add the thread to and delete the invitation message from the game dictionary
			game.set("thread", thread);
			game.delete("invitation");
			// Copy the original components matrix
			const components = deepClone(originalComponents);
			// Handle game components
			componentHandling ? componentHandling(components) : null;
			// Send a message with the rendered board and the updated components to the thread
			thread.send({
				components: originalComponents,
				content: renderNamespace.renderGame(originalBoard),
				split: true,
			}).then(msg => {
			// Add the game message and the current(initial) board to the game dictionary
				game.set("message", msg);
				game.set("board", gameNamespace.parseBoard(msg.content));
			}).then(() => {
				thread.send({ content: `It's <@${game.get("nextTurnID")}>s turn.`, fetchReply: true })
					.then(startInfo => {
						game.set("lastInteraction", startInfo);
					});
			});
		});
	},

	/**
	 * End a game after a player has won or a draw has been reached
	 * @param	{Map<String, Map>}	games
	 * The games dictionary holding the dictionarys of all active games
	 * @param	{Integer}			gameIndex
	 * The index of the game to end
	 */
	endGame: function(games, gameIndex) {
		// Extract correct game from the games dictionary
		const game = games.get(`game${gameIndex}`);
		if (game) {
			// Disable all the buttons on the game message
			generalBtnHnd.removeAllMessageButtons(game.get("message")).then(() => {
				// Lock the game thread and archive it
				game.get("thread").setLocked(true).then(() => {
					game.get("thread").setArchived(true).then(() => {
						// Remove the game from the games dictionary
						games.delete(`game${gameIndex}`);
					});
				});
			});
		}
	},
};
// #endregion

// #region VARIABLES
const tictactoeVars = {
	representations: {
		x: "x",
		o: "o",
		white_medium_square: "e",
	},

	// Define the original board
	originalBoard: [
		["e", "e", "e"],
		["e", "e", "e"],
		["e", "e", "e"],
	],

	// Define the original game interaction components for placing symbols
	originalComponents: [
		// First row
		new MessageActionRow().addComponents([
			// Top left placing button
			new MessageButton()
				.setCustomId("tictactoe_place_0_0_i")
				.setLabel("↖️").setStyle("SECONDARY"),
			// Top middle placing button
			new MessageButton()
				.setCustomId("tictactoe_place_1_0_i")
				.setLabel("⬆️").setStyle("SECONDARY"),
			// Top right placing button
			new MessageButton()
				.setCustomId("tictactoe_place_2_0_i")
				.setLabel("↗️").setStyle("SECONDARY"),
		]),
		// Second row
		new MessageActionRow().addComponents([
			// Middle left placing button
			new MessageButton()
				.setCustomId("tictactoe_place_0_1_i")
				.setLabel("⬅️").setStyle("SECONDARY"),
			// Middle middle placing button
			new MessageButton()
				.setCustomId("tictactoe_place_1_1_i")
				.setLabel("⏹️").setStyle("SECONDARY"),
			// Middle right placing button
			new MessageButton()
				.setCustomId("tictactoe_place_2_1_i")
				.setLabel("➡️").setStyle("SECONDARY"),
		]),
		// Third row
		new MessageActionRow().addComponents([
			// Bottom left placing button
			new MessageButton()
				.setCustomId("tictactoe_place_0_2_i")
				.setLabel("↙️").setStyle("SECONDARY"),
			// Bottom middle placing button
			new MessageButton()
				.setCustomId("tictactoe_place_1_2_i")
				.setLabel("⬇️").setStyle("SECONDARY"),
			// Bottom right placing button
			new MessageButton()
				.setCustomId("tictactoe_place_2_2_i")
				.setLabel("↘️").setStyle("SECONDARY"),
		]),
	],
};
exports.tictactoeVars = tictactoeVars;
// #endregion

// #region TICTACTOE
const tictactoe = {
	/**
	 * This function is used to extract the tictactoe board data from a message.
	 * @param	{String}				message
	 * The message to extract the board data from.
	 * @return	{Array<Array<String>>}	The board of the game
	 */
	parseBoard: function(message) {
		return general.parseBoard(message, tictactoeVars.representations);
	},

	/**
	 * Check whether the winning condition has been fulfilled.
	 * @param	{Array<Array<String>>}	board
	 * The board to check against the winning condition.
	 * @return	{String|Boolean}		The winner or false if no winner has been found.
	 */
	checkWin: function(board) {
		// Check if the board has been defined
		if (board !== undefined) {
			// Loop over the board side length
			for (let i = 0; i < board.length; i++) {
				// Check if every space of a row is the same and not empty
				const row = board[i];
				if (row[0] !== "e" && row[0] === row[1] && row[1] === row[2]) {
					return row[0];
				}
				// Check if every space of a column is the same and not empty
				const col = [board[0][i], board[1][i], board[2][i]];
				if (col[0] !== "e" && col[0] === col[1] && col[1] === col[2]) {
					return col[0];
				}
			}
			// Check if every space of the top left to bottom right diagonal is the same and not empty
			const diag1 = [board[0][0], board[1][1], board[2][2]];
			if (diag1[0] !== "e" && diag1[0] === diag1[1] && diag1[1] === diag1[2]) {
				return diag1[0];
			}
			// Check if every space of the top right to bottom left diagonal is the same and not empty
			const diag2 = [board[0][2], board[1][1], board[2][0]];
			if (diag2[0] !== "e" && diag2[0] === diag2[1] && diag2[1] === diag2[2]) {
				return diag2[0];
			}
			// Check if there is no empty space left
			if (board.every(row => row.every(piece => piece !== "e"))) {
				return "e";
			}
		}
		return false;
	},

	/**
	 * Start a tic tac toe game.
	 * @param	{Interaction<CacheType>}		interaction
	 * The interaction of a user accepting the invitation
	 * @param	{Map<String, Object|String>}	game
	 * The game to which the user was invited/ the game to start
	 * @param	{Integer}						gameIndex
	 * the index of the game in the games dictionary
	 */
	startGame: function(interaction, game, gameIndex) {
		// Define function to handle game components
		const componentsHandling = (components) => {
			// Loop through the components and the component rows set the correct custom IDs
			for (let j = 0; j < components.length; j++) {
			// Copy the original components row
				const componentRow = deepClone(components[j].components);
				for (let k = 0; k < componentRow.length; k++) {
				// Set the custom ID of the component to include the game index(i) and correct position
					componentRow[k].setCustomId(`tictactoe_place_${k}_${j}_${gameIndex}`);
				}
				// Replace original component rows with copied component rows
				components[j].setComponents(componentRow);
			}
		};
		// Call general startGame function
		general.startGame(interaction, game, GameType.TicTacToe, tictactoeVars.originalBoard, tictactoeVars.originalComponents, componentsHandling);
	},

	/**
	 * End a game after a player has won or a draw has been reached
	 * @param	{Map<String, Map>}	games
	 * The games dictionary holding the dictionarys of all active games
	 * @param	{Integer}			gameIndex
	 * The index of the game in the games dictionary
	 */
	endGame: function(games, gameIndex) {
		general.endGame(games, gameIndex);
	},
};
exports.tictactoeFnct = tictactoe;
// #endregion

// #region CHESS
// #region VARIABLES
// Define ascii representations of the pieces
const ascii = {
	bk: "♚",
	bq: "♛",
	br: "♜",
	bb: "♝",
	bn: "♞",
	bp: "♟",
	wk: "♔",
	wq: "♕",
	wr: "♖",
	wb: "♗",
	wn: "♘",
	wp: "♙",
};
// Define representations on board
const chessVars = {
	// Define the representations of the emojis as board representations
	representations: {
		b_king: "bk",
		b_queen: "bq",
		b_rook: "br",
		b_knight: "bn",
		b_bishop: "bb",
		b_pawn: "bp",
		w_king: "wk",
		w_queen: "wq",
		w_rook: "wr",
		w_knight: "wn",
		w_bishop: "wb",
		w_pawn: "wp",
		_: "e",
	},

	// Define ascii representations of the pieces
	ascii: {
		bk: "♚",
		bq: "♛",
		br: "♜",
		bb: "♝",
		bn: "♞",
		bp: "♟",
		wk: "♔",
		wq: "♕",
		wr: "♖",
		wb: "♗",
		wn: "♘",
		wp: "♙",
	},

	names: {
		k: "king",
		q: "queen",
		r: "rook",
		n: "knight",
		b: "bishop",
		p: "pawn",
	},

	// Define the original game interaction components for making moves
	originalComponents: [
	// First row
		new MessageActionRow().addComponents([
			// White pawn selecting button
			new MessageButton()
				.setCustomId("chess_select_wp_")
				.setLabel(ascii.wp).setStyle("SECONDARY"),
			// White knight selecting button
			new MessageButton()
				.setCustomId("chess_select_wn_")
				.setLabel(ascii.wn).setStyle("SECONDARY"),
		]),
	],
};
exports.chessVars = chessVars;
// #endregion

const chess = {
	/**
	 * This function is used to extract the chess board data from a message.
	 * @param	{String}				message
	 * The message to extract the board data from.
	 * @return	{Array<Array<String>>}	The board of the game
	 */
	parseBoard: function(message) {
		return general.parseBoard(message, chessVars.representations);
	},

	/**
	 * Start a chess game.
	 * @param	{Interaction<CacheType>}		interaction
	 * The interaction of a user accepting the invitation
	 * @param	{Map<String, Object|String>}	game
	 * The game to which the user was invited/ the game to start
	 * @param	{Integer}						gameIndex
	 * the index of the game in the games dictionary
	 */
	startGame: function(interaction, game, gameIndex) {
		// By default ignore index
		gameIndex;

		game.whiteID = game.whiteID === null ? interaction.user.id : game.whiteID;
		game.blackID = game.blackID === null ? interaction.user.id : game.blackID;
		// Create game instance
		const chessInstance = new chessjs.Chess();
		game.set("instance", chessInstance);
		// Define function to handle game components
		const componentsHandling = (components) => {
			// Loop through the components and the component rows set the correct custom IDs
			for (let j = 0; j < components.length; j++) {
			// Copy the original components row
				const componentRow = deepClone(components[j].components);
				for (let k = 0; k < componentRow.length; k++) {
				// Set the custom ID of the component to include the game index(i)
					const newID = componentRow[k].customId + gameIndex;
					componentRow[k].setCustomId(newID);
				}
				// Replace original component rows with copied component rows
				components[j].setComponents(componentRow);
			}
		};
		// Call general startGame function
		general.startGame(interaction, game, GameType.Chess, chessInstance.board(), chessVars.originalComponents, componentsHandling);
	},

	/**
	 * End a game after a player has won or a draw has been reached
	 * @param	{Map<String, Map>}	games
	 * The games dictionary holding the dictionarys of all active games
	 * @param	{Integer}			gameIndex
	 * The index of the game in the games dictionary
	 */
	endGame: function(games, gameIndex) {
		general.endGame(games, gameIndex);
	},
};
exports.chessFnct = chess;
// #endregion