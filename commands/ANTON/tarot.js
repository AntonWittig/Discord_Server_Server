// Require the path module for accessing the command src
const path = require("node:path");

// Create path to the command src
const srcPath = [__dirname, "..", "..", "src", "commands", "tarot.js"];
if (__dirname === "commands") {
	srcPath.splice(1, 1);
}

// Require the necessary command src
const tarotSrc = require(path.join(...srcPath));

// export command variables and functions
exports.data = tarotSrc.data;
exports.execute = tarotSrc.execute;