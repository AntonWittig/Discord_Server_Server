const assert = require("assert");
const { general, chess } = require("../src/libs/render.js");

describe("render.js", function() {
	describe("general", function() {
		describe("#getPieceTeam()", function() {
			it("should return the team (first letter) of the piece", function() {
			// white king is part of team w(white)
				assert(general.getPieceTeam("wk") === "w");
				// black king is part of team b(black)
				assert(general.getPieceTeam("bk") === "b");
				// black rook is part of team b(black)
				assert(general.getPieceTeam("br") === "b");
				// white pawn is part of team w(white)
				assert(general.getPieceTeam("wp") === "w");
			});
			it("should return 'e' if the piece is empty", function() {
			// empty piece is part of team e(not part of a team)
				assert(general.getPieceTeam("e") === "e");
			});
		});
		describe("#getPieceType()", function() {
			it("should return the type (second letter) of the piece", function() {
				// white king is type k(king)
				assert(general.getPieceType("wk") === "k");
				// black king is type k(king)
				assert(general.getPieceType("bk") === "k");
				// whiet queen is type q(queen)
				assert(general.getPieceType("wq") === "q");
				// white rook is type r(rook)
				assert(general.getPieceType("wr") === "r");
				// black bishop is type b(bishop)
				assert(general.getPieceType("bb") === "b");
				// black knight is type n(knight)
				assert(general.getPieceType("bn") === "n");
				// white pawn is type p(pawn)
				assert(general.getPieceType("wp") === "p");
			});
			it("should return 'e' if the piece is empty", function() {
				// empty piece is type e(not a piece)
				assert(general.getPieceType("e") === "e");
			});
		});
	});
	describe("chess", function() {
		let board = [];
		beforeEach(function initStandardBoard() {
			board = [
				["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
				["bps", "bps", "bps", "bps", "bps", "bps", "bps", "bps"],
				["e", "e", "e", "e", "e", "e", "e", "e"],
				["e", "e", "e", "e", "e", "e", "e", "e"],
				["e", "e", "e", "e", "e", "e", "e", "e"],
				["e", "e", "e", "e", "e", "e", "e", "e"],
				["wps", "wps", "wps", "wps", "wps", "wps", "wps", "wps"],
				["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
			];
		});
		describe("#getBaseColor()", function() {
			it("should return the base color of the space by coordinates", function() {
				// the upper left space on the board is white
				assert(chess.getBaseColor(0, 0) === "white");
				// the upper right space on the board is black
				assert(chess.getBaseColor(0, 7) === "black");
				// the lower left space on the board is black
				assert(chess.getBaseColor(7, 0) === "black");
				// the lower right space on the board is white
				assert(chess.getBaseColor(7, 7) === "white");
				// space c6 is white
				assert(chess.getBaseColor(2, 2) === "white");
				// space c3 is black
				assert(chess.getBaseColor(2, 5) === "black");
				// space g5 is black
				assert(chess.getBaseColor(6, 3) === "black");
				// space e2 is white
				assert(chess.getBaseColor(4, 6) === "white");
			});
		});
		describe("#getValidMoves()", function() {
			it("should return the valid moves of a piece in initial setup", function() {
				board[5][6] = "bp";
				// knight in lower left corner should have two valid moves
				const lowerLeftKnightMoves = chess.getValidMoves({ x: 1, y: 7 }, board);
				assert(lowerLeftKnightMoves.length === 2);
				assert(lowerLeftKnightMoves
					.some(move => move.x === 0 && move.y === 5));
				assert(lowerLeftKnightMoves
					.some(move => move.x === 2 && move.y === 5));
				// second middle pawn on black side should have two valid moves
				const fourthLeftBlackPawnMoves = chess.getValidMoves({ x: 3, y: 1 }, board);
				assert(fourthLeftBlackPawnMoves.length === 2);
				assert(fourthLeftBlackPawnMoves
					.some(move => move.x === 3 && move.y === 2));
				assert(fourthLeftBlackPawnMoves
					.some(move => move.x === 3 && move.y === 3));
				// second middle pawn on black side should have three valid moves
				const thirdRightWhitePawnMoves = chess.getValidMoves({ x: 5, y: 6 }, board);
				assert(thirdRightWhitePawnMoves.length === 3);
				assert(thirdRightWhitePawnMoves
					.some(move => move.x === 5 && move.y === 5));
				assert(thirdRightWhitePawnMoves
					.some(move => move.x === 5 && move.y === 4));
				assert(thirdRightWhitePawnMoves
					.some(move => move.x === 6 && move.y === 5));
			});
			it("should return no valid moves if the piece has no valid moves in initial setup", function() {
				// rook in upper left corner should have no valid moves
				assert(chess.getValidMoves({ x: 0, y: 0 }, board).length === 0);
				// bishop in upper right corner should have no valid moves
				assert(chess.getValidMoves({ x: 5, y: 0 }, board).length === 0);
				// queen on white side should have no valid moves
				assert(chess.getValidMoves({ x: 3, y: 7 }, board).length === 0);
				// king on white side should have no valid moves
				assert(chess.getValidMoves({ x: 4, y: 7 }, board).length === 0);
			});
			it("should return the valid moves of a piece in an initial setup without pawns", function() {
				// remove all pawns from the board
				board[1] = ["e", "e", "e", "e", "e", "e", "e", "e"];
				board[6] = ["e", "e", "e", "e", "e", "e", "e", "e"];
				// king on white side should have three valid moves
				const whiteKingMoves = chess.getValidMoves({ x: 4, y: 7 }, board);
				assert(whiteKingMoves.length === 3);
				assert(whiteKingMoves
					.some(move => move.x === 3 && move.y === 6));
				assert(whiteKingMoves
					.some(move => move.x === 4 && move.y === 6));
				assert(whiteKingMoves
					.some(move => move.x === 5 && move.y === 6));
				// rook in upper left corner should have seven valid moves
				const upperLeftRookMoves = chess.getValidMoves({ x: 0, y: 0 }, board);
				assert(upperLeftRookMoves.length === 7);
				for (let i = 1; i < 8; i++) {
					assert(upperLeftRookMoves
						.some(move => move.x === 0 && move.y === i));
				}
				// queen on black side should have fourteen valid moves
				const blackQueenMoves = chess.getValidMoves({ x: 3, y: 0 }, board);
				assert(blackQueenMoves.length === 14);
				for (let i = 1; i < 8; i++) {
					assert(blackQueenMoves
						.some(move => move.x === 3 && move.y === i));
				}
				for (let i = 1; i < 4; i++) {
					assert(blackQueenMoves
						.some(move => move.x === 3 - i && move.y === 0 + i));
					assert(blackQueenMoves
						.some(move => move.x === 3 + i && move.y === 0 + i));
				}
				assert(blackQueenMoves
					.some(move => move.x === 7 && move.y === 4));
				// knight in lower left corner should have three valid moves
				const lowerLeftKnightMoves = chess.getValidMoves({ x: 1, y: 7 }, board);
				assert(lowerLeftKnightMoves.length === 3);
				assert(lowerLeftKnightMoves
					.some(move => move.x === 0 && move.y === 5));
				assert(lowerLeftKnightMoves
					.some(move => move.x === 2 && move.y === 5));
				assert(lowerLeftKnightMoves
					.some(move => move.x === 3 && move.y === 6));
				// bishop in lower right corner should have seven valid moves
				const lowerRightBishopMoves = chess.getValidMoves({ x: 5, y: 7 }, board);
				assert(lowerRightBishopMoves.length === 7);
				assert(lowerRightBishopMoves
					.some(move => move.x === 6 && move.y === 6));
				assert(lowerRightBishopMoves
					.some(move => move.x === 7 && move.y === 5));
				for (let i = 1; i < 6; i++) {
					assert(lowerRightBishopMoves
						.some(move => move.x === 5 - i && move.y === 7 - i));
				}
			});
			it("should return all valid moves in 'en passant' scenario", function() {
				// third right black pawn has just moved two squares forward
				board[3] = ["e", "e", "e", "bpm", "wpm", "bp2", "e", "e"];
				// fourth left black pawn should have one valid move
				const fourthLeftBlackPawnMoves = chess.getValidMoves({ x: 3, y: 3 }, board, { x: 5, y: 3 });
				assert(fourthLeftBlackPawnMoves.length === 1);
				assert(fourthLeftBlackPawnMoves
					.some(move => move.x === 3 && move.y === 4));
				// TODO: test en passant
			});
		});
		describe("#renderPiece()", function() {
			it("should return the emoji of any piece", function() {
				// black king should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 4, y: 0 })
						=== "<:black_king_white:989558908886585355>");
				// black queen should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 3, y: 0 })
						=== "<:black_queen_black:989558917539446844>");
				// left black rook should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 0, y: 0 })
						=== "<:black_rook_white:989558925680582686>");
				// left black knight should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 1, y: 0 })
						=== "<:black_knight_black:989558910413316166>");
				// left black bishop should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 2, y: 0 })
						=== "<:black_bishop_white:989558905761837106>");
				// left black pawn should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 0, y: 1 })
						=== "<:black_pawn_black:989558914301448242>");
				// white king should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 4, y: 7 })
						=== "<:white_king_black:989558930260787300>");
				// white queen should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 3, y: 7 })
						=== "<:white_queen_white:989558945284763728>");
				// left white rook should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 0, y: 7 })
						=== "<:white_rook_black:989558946576621588>");
				// left white knight should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 1, y: 7 })
						=== "<:white_knight_white:989558935889522758>");
				// left white bishop should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 2, y: 7 })
						=== "<:white_bishop_black:989558926855008356>");
				// left white pawn should be rendered as following emote in standard position
				assert(chess.renderPiece(board, { x: 0, y: 6 })
						=== "<:white_pawn_white:989558939387576342>");
			});
			it("should return the emoji of a piece on a black space", function() {
				// fourth left white pawn should be rendered on a black space as following emote
				assert(chess.renderPiece(board, { x: 3, y: 6 })
						=== "<:white_pawn_black:989558937193967686>");
				// right white knight should be rendered on a black space as following emote
				assert(chess.renderPiece(board, { x: 6, y: 7 })
						=== "<:white_knight_black:989558933343596657>");
				// right black bishop should be rendered on a black space as following emote
				assert(chess.renderPiece(board, { x: 5, y: 0 })
						=== "<:black_bishop_black:989558903584997456>");
				// right black rook should be rendered on a black space as following emote
				assert(chess.renderPiece(board, { x: 7, y: 0 })
						=== "<:black_rook_black:989558923491180554>");
			});
			it("should return the emoji of a piece on a white space", function() {
				// third left white pawn should be rendered on a white space as following emote
				assert(chess.renderPiece(board, { x: 2, y: 6 })
						=== "<:white_pawn_white:989558939387576342>");
				// right white bishop should be rendered on a white space as following emote
				assert(chess.renderPiece(board, { x: 5, y: 7 })
						=== "<:white_bishop_white:989558929212207175>");
				// left black rook should be rendered on a white space as following emote
				assert(chess.renderPiece(board, { x: 0, y: 0 })
						=== "<:black_rook_white:989558925680582686>");
				// right black knight should be rendered on a white space as following emote
				assert(chess.renderPiece(board, { x: 6, y: 0 })
						=== "<:black_knight_white:989558913022181486>");
			});
			it("should return the emoji of a piece on a green space if attacked", function() {
				// white queen should be rendered on a green space when attacked as following emote
				assert(chess.renderPiece(board, { x: 3, y: 7 }, true)
						=== "<:white_queen_green:989558943594471445>");
				// right black bishop should be rendered on a green space when attacked as following emote
				assert(chess.renderPiece(board, { x: 5, y: 0 }, true)
						=== "<:black_bishop_green:989558904738422864>");
				// left black pawn should be rendered on a green space when attacked as following emote
				assert(chess.renderPiece(board, { x: 0, y: 1 }, true)
						=== "<:black_pawn_green:989558915425521755>");
			});
			it("should return the emoji of a king on its normal space if attacked", function() {
				// white king shouldn't be rendered on a green space when attacked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 7 }, true)
						=== "<:white_king_black:989558930260787300>");
				// black king shouldn't be rendered on a green space when attacked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 0 }, true)
						=== "<:black_king_white:989558908886585355>");
			});
			it("should return the emoji of a checked king if checked", function() {
				// white king should be rendered on a red space when checked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 7 }, false, false, true)
						=== "<:white_king_check:989558931464532018>");
				// black king should be rendered on a red space when checked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 0 }, false, true, false)
						=== "<:black_king_check:989558907976429568>");
			});
			it("should return the emoji of a king on its normal space if not checked", function() {
				// white king shouldn't be rendered on a red space when not checked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 7 }, false, true, false)
						=== "<:white_king_black:989558930260787300>");
				// black king shouldn't be rendered on a red space when not checked as following emote
				assert(chess.renderPiece(board, { x: 4, y: 0 }, false, false, true)
						=== "<:black_king_white:989558908886585355>");
			});
		});
	});
});