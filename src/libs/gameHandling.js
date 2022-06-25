// #region IMPORTS
// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries
const libPath = [__dirname];
const { generalMsgHnd } = require(path.join(...libPath, "messageHandling.js"));
// #endregion

// #region GENERAL
const general = {
	/**
	 * This function is used to extract the board data from a message.
	 * @param	{String}						message
	 * The message to extract the board data from.
	 * @param	{Dictionary<String, String>}	representations
	 * The representations of emojis on the game board
	 * @return	{Array<Array<String>>}			The board of the game
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
};
// #endregion

// #region TICTACTOE
const tictactoe = {
	representations: {
		x: "x",
		o: "o",
		white_medium_square: "e",
	},

	/**
	 * This function is used to extract the tictactoe board data from a message.
	 * @param	{String}				message
	 * The message to extract the board data from.
	 * @return	{Array<Array<String>>}	The board of the game
	 */
	parseBoard: function(message) {
		return general.parseBoard(message, tictactoe.representations);
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
};
exports.tictactoeFnct = tictactoe;
// #endregion

// #region CHESS
// Define representations on board
const chessRep = {
	bk: "bk",
	bq: "bq",
	br: "br",
	bn: "bn",
	bb: "bb",
	bp: "bp",
	wk: "wk",
	wq: "wq",
	wr: "wr",
	wn: "wn",
	wb: "wb",
	wp: "wp",
	e: "e",
};

const chess = {
	// #region VARIABLES
	// Define the representations of the emojis as board representations
	representations: {
		black_king_white: chessRep.bk, black_king_black: chessRep.bk, black_king_check: chessRep.bk,
		black_queen_white: chessRep.bq, black_queen_black: chessRep.bq, black_queen_green: chessRep.bq,
		black_rook_white: chessRep.br, black_rook_black: chessRep.br, black_rook_green: chessRep.br,
		black_knight_white: chessRep.bn, black_knight_black: chessRep.bn, black_knight_green: chessRep.bn,
		black_bishop_white: chessRep.bb, black_bishop_black: chessRep.bb, black_bishop_green: chessRep.bb,
		black_pawn_white: chessRep.bp, black_pawn_black: chessRep.bp, black_pawn_green: chessRep.bp,
		white_king_white: chessRep.wk, white_king_black: chessRep.wk, white_king_check: chessRep.wk,
		white_queen_white: chessRep.wq, white_queen_black: chessRep.wq, white_queen_green: chessRep.wq,
		white_rook_white: chessRep.wr, white_rook_black: chessRep.wr, white_rook_green: chessRep.wr,
		white_knight_white: chessRep.wn, white_knight_black: chessRep.wn, white_knight_green: chessRep.wn,
		white_bishop_white: chessRep.wb, white_bishop_black: chessRep.wb, white_bishop_green: chessRep.wb,
		white_pawn_white: chessRep.wp, white_pawn_black: chessRep.wp, white_pawn_green: chessRep.wp,
		empty: chessRep.e,
	},
	// #endregion

	/**
	 * This function is used to extract the chess board data from a message.
	 * @param	{String}				message
	 * The message to extract the board data from.
	 * @return	{Array<Array<String>>}	The board of the game
	 */
	parseBoard: function(message) {
		return general.parseBoard(message, chess.representations);
	},

};
exports.chessFnct = chess;
// #endregion