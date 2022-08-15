// #region GENERAL
const general = {
	/**
	 * Get the team a piece belongs to.
	 * @param	{String}	piece
	 * The piece to get the team of.
	 * @returns	{String}	The abbreviation of the team the piece belongs to.
	 */
	getPieceTeam: function(piece) {
		console.log("general.getPieceTeam");
		console.log(typeof piece);

		if (piece !== "e") return piece.substring(0, 1);
		else return "e";
	},

	/**
	 * Get the type of a piece.
	 * @param	{String}	piece
	 * The piece to get the type of.
	 * @returns	{String}	The type of the piece.
	 */
	getPieceType: function(piece) {
		if (piece !== "e") return piece.substring(1, 2);
		else return "e";
	},
};
exports.general = general;
// #endregion

// #region CHESS
const chess = {
	// #region VARIABLES
	emojiIDs: {
		"bk": { "name": "black_king_", "white": "989558908886585355", "black": "989558906822992012", "check": "989558907976429568" },
		"bq": { "name": "black_queen_", "white": "989558921968619601", "black": "989558917539446844", "green": "989558921196863488" },
		"br": { "name": "black_rook_", "white": "989558925680582686", "black": "989558923491180554", "green": "989558924673953792" },
		"bn": { "name": "black_knight_", "white": "989558913022181486", "black": "989558910413316166", "green": "989558911768096818" },
		"bb": { "name": "black_bishop_", "white": "989558905761837106", "black": "989558903584997456", "green": "989558904738422864" },
		"bp": { "name": "black_pawn_", "white": "989558916465721485", "black": "989558914301448242", "green": "989558915425521755" },
		"wk": { "name": "white_king_", "white": "989558932546678824", "black": "989558930260787300", "check": "989558931464532018" },
		"wq": { "name": "white_queen_", "white": "989558945284763728", "black": "989558942843666503", "green": "989558943594471445" },
		"wr": { "name": "white_rook_", "white": "989558948703137852", "black": "989558946576621588", "green": "989558947696484442" },
		"wn": { "name": "white_knight_", "white": "989558935889522758", "black": "989558933343596657", "green": "989558934715117618" },
		"wb": { "name": "white_bishop_", "white": "989558929212207175", "black": "989558926855008356", "green": "989558928041992243" },
		"wp": { "name": "white_pawn_", "white": "989558939387576342", "black": "989558937193967686", "green": "989558938234155089" },
		"e": { "name": "empty_", "white": "989551992256995359", "black": "989551977379799120", "green": "989551963739947059" },
	},

	baseBoardColors: {
		0: "white",
		1: "black",
		2: "green",
		3: "check",
	},

	// times= how many times the move can be stacked
	// amount= how many types of moves
	moves: {
		"k": { "times": 1, "amount": 8, "x": [-1, -1, -1, 0, 1, 1, 1, 0], "y": [-1, 0, 1, 1, 1, 0, -1, -1] },
		"q": { "times": 8, "amount": 8, "x": [-1, -1, -1, 0, 1, 1, 1, 0], "y": [-1, 0, 1, 1, 1, 0, -1, -1] },
		"r": { "times": 8, "amount": 4, "x": [-1, 0, 1, 0], "y": [0, -1, 0, 1] },
		"b": { "times": 8, "amount": 4, "x": [-1, -1, 1, 1], "y": [-1, 1, -1, 1] },
		"n": { "times": 1, "amount": 8, "x": [-2, -2, -1, -1, 1, 1, 2, 2], "y": [-1, 1, -2, 2, -2, 2, -1, 1] },
		"p": {
			"b": {
				"times": 1, "amount": 4, "x": [0, 0, -1, 1], "y": [1, 2, 1, 1],
			},
			"w": {
				"times": 1, "amount": 4, "x": [0, 0, -1, 1], "y": [-1, -2, -1, -1],
			},
		},
	},

	pawnMoveTypes: {
		"s": "start",
		"2": "2onFirst",
		"m": "moved",
	},
	// #endregion

	// #region FUNCTIONS
	// coordinate system starts at top left corner with 0,0; x increases to the right, y increases to the bottom
	// TODO
	getBaseColor: function(x, y) {
		return chess.baseBoardColors[(x + y) % 2];
	},

	// TODO
	pawnMoveType: function(piece) {
		if (general.getPieceType(piece) !== "p") return "";
		return chess.pawnMoveTypes[piece.substring(2, 3)];
	},

	renderPiece: function(board, position, attacked = false, checked = "") {
		const piece = board[position.y][position.x];
		console.log("renderPiece: " + piece);

		let baseColor = chess.getBaseColor(position.x, position.y);
		if (piece.type === "k") {
			if ((checked === "b" && piece.color === "b")
				|| (checked === "w" && piece.color === "w")) {
				baseColor = chess.baseBoardColors[3];
			}
		}
		else if (attacked) {
			baseColor = chess.baseBoardColors[2];
		}

		const id = piece ? piece.color + piece.type : "e";
		const emojiDict = chess.emojiIDs[id];
		const emojiName = emojiDict.name + baseColor;
		const emojiID = emojiDict[baseColor];
		return "<:" + emojiName + ":" + emojiID + ">";
	},

	translatePositionToXY: function(position) {
		if (typeof position === "string" && position.length === 2) {
			return { x: position.charCodeAt(0) - 97, y: position.charCodeAt(1) - 49 };
		}
		return null;
	},

	translatePositionToNotation: function(position) {
		if (typeof position === "object" && position.x && position.y) {
			return String.fromCharCode(position.x + 97) + (position.y + 1);
		}
		return null;
	},

	// TODO: call with chessinstance.moves{verbose: true}
	renderGame: function(board, attackedPositions = [], flipped = false) {
		if (board !== undefined && board !== null && board.length === 8) {
			let renderedBoard = "";
			if (flipped) {
				for (let i = board.length - 1; i >= 0; i--) {
					for (let j = board[i].length - 1; j >= 0; j--) {
						const attacked = attackedPositions.some(
							pos => pos.Contains(chess.translatePositionToNotation({ x: j, y: i })));
						renderedBoard += chess.renderPiece(board, { x: j, y: i }, attacked);
					}
					if (i !== board.length - 1) renderedBoard += "\n";
				}
			}
			else {
				for (let i = 0; i < board.length; i++) {
					for (let j = 0; j < board[i].length; j++) {
						const attacked = attackedPositions.some(
							pos => pos.Contains(chess.translatePositionToNotation({ x: j, y: i })));
						renderedBoard += chess.renderPiece(board, { x: j, y: i }, attacked);
					}
					if (i !== board.length - 1) renderedBoard += "\n";
				}
			}
			return renderedBoard;
		}
	},
	// #endregion
};
exports.chess = chess;
// #endregion

// #region TICTACTOE
const tictactoe = {
	// #region VARIABLES
	emojiIDs: {
		"x": { "name": "x" },
		"o": { "name": "o" },
		"e": { "name": "white_medium_square" },
	},
	// #endregion

	// #region FUNCTIONS
	/**
	 * Return the rendered representation of a single tic tac toe symbol
	 * @param	{String}	symbol
	 * The symbol to render
	 * @returns	{String}	The rendered symbol representation
	 */
	renderSymbol: function(symbol) {
		// Get the emoji ID of the symbol and return the emoji
		const emojiDict = tictactoe.emojiIDs[symbol];
		const emojiName = emojiDict.name;
		return ":" + emojiName + ":";
	},

	/**
	 * Return the rendered representation of a tic tac toe board
	 * @param	{Array<Array<String>>}	board
	 * The board to render
	 * @returns	{String}				The rendered board
	 */
	renderGame: function(board) {
		// Initialize the rendered board
		let renderedBoard = "";
		// Loop through the board
		for (let i = 0; i < board.length; i++) {
			for (let j = 0; j < board[i].length; j++) {
				// Render the symbol of each position and add it to the rendered board
				renderedBoard += tictactoe.renderSymbol(board[i][j]);
			}
			// Add a new line to the rendered board
			if (i !== board.length - 1) renderedBoard += "\n";
		}
		return renderedBoard;
	},
	// #endregion
};
exports.tictactoeRnd = tictactoe;
// #endregion