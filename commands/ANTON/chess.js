// Require the path module for accessing the command src
const path = require("node:path");

// Create path to the command src
const srcPath = [__dirname, "..", "..", "src", "commands", "chess.js"];
if (__dirname === "commands") {
	srcPath.splice(1, 1);
}

// Require the necessary command src
const chessSrc = require(path.join(...srcPath));

// export command variables and functions
exports.data = chessSrc.data;
exports.execute = chessSrc.execute;
exports.accept = chessSrc.accept;
exports.decline = chessSrc.decline;
exports.select = chessSrc.select;
exports.move = chessSrc.move;