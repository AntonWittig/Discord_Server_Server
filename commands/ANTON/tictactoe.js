// Require the path module for accessing the command src
const path = require("node:path");

// Create path to the command src
const srcPath = [__dirname, "..", "..", "src", "commands", "tictactoe.js"];
if (__dirname === "commands") {
	srcPath.splice(1, 1);
}

// Require the necessary command src
const tictactoeSrc = require(path.join(...srcPath));

// export command variables and functions
exports.data = tictactoeSrc.data;
exports.execute = tictactoeSrc.execute;
exports.accept = tictactoeSrc.accept;
exports.decline = tictactoeSrc.decline;
exports.place = tictactoeSrc.place;