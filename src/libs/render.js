const board = [
	["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
	["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
	["e", "e", "e", "e", "e", "e", "e", "e"],
	["e", "e", "e", "e", "e", "e", "e", "e"],
	["e", "e", "e", "e", "e", "e", "e", "e"],
	["e", "e", "e", "e", "e", "e", "e", "e"],
	["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
	["wr", "wn", "ww", "wq", "wk", "ww", "wn", "wr"],
];

const emojiIDs = {
	"bk": { "white": "989558908886585355", "black": "989564905965355008", "check": "989564905965355008" },
	"bq": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"br": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"bn": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"bb": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"bp": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"wk": { "white": "989564905965355008", "black": "989564905965355008", "check": "989564905965355008" },
	"wq": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"wr": { "white": "989564905965355008", "black": "989564905965355008", "green": "989564905965355008" },
	"wn": { "white": "989564905965355008", "black": "989564905965355008", "green": "white_knight_green" },
	"wb": { "white": "white_bishop_white", "black": "white_bishop_black", "green": "white_bishop_green" },
	"wp": { "white": "white_pawn_white", "black": "white_pawn_black", "green": "white_pawn_green" },
	"e": { "white": "empty_white", "black": "empty_black", "green": "empty_green" },
};

function flipBoard(board) {
	board.reverse();
	for (let i = 0; i < board.length; i++) {
		board[i].reverse();
	}
	return board;
}

exports.render_chess = function(interaction) {
	if (!interaction.replied) {
		pawn;
	}
	else {
		interaction.reply();
	}
};