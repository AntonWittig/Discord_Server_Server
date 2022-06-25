// Require the necessary environment variables
require("dotenv").config();

// Require the file system modules for dynamic command creation
const fs = require("node:fs");
const path = require("node:path");

// Require the necessary discord.js classes
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

// Create a new rest client instance
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

// #region FUNCTIONS
async function submitCommands(commands, guildname = "") {
	try {
		if (guildname) {
			await rest.put(
				Routes.applicationGuildCommands(process.env.APPLICATION_ID, process.env[`GUILD_ID_${guildname}`]),
				{ body: commands },
			);
			console.log(`Successfully reloaded application (/) commands for guild "${guildname}".`);
		}
		else {
			await rest.put(
				Routes.applicationCommands(process.env.APPLICATION_ID),
				{ body: commands },
			);
			console.log("Successfully reloaded global application (/) commands.");
		}
	}
	catch (error) {
		console.error(error);
	}
}
// #endregion

// #region GLOBAL COMMANDS
// Retrieve the global command files
const commandFilesPath = path.join(__dirname, "..", "commands");
fs.readdir(commandFilesPath, (err, files) => {
	if (err) throw err;

	const globalCommandFiles = files.filter((file) => file.endsWith(".js") && !path.basename(file).startsWith("_"));

	// Assemble and submit the global commands
	const globalCommands = [];
	globalCommandFiles.forEach(file => {
		const command = require(path.join(commandFilesPath, file));
		globalCommands.push(command.data.toJSON());
	});
	submitCommands(globalCommands);
});
// #endregion

// #region GUILD COMMANDS
// Retrieve the guild command folders
fs.readdir(commandFilesPath, { withFileTypes: true }, (err, files) => {
	if (err) throw err;

	const guildCommandFolders = files.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	// Iterate over each guild command folder
	guildCommandFolders.forEach(guildname => {

		// Retrieve the guild command files
		fs.readdir(path.join(commandFilesPath, guildname), (err, guildFiles) => {
			if (err) throw err;

			const guildCommandFiles = guildFiles.filter((file) => file.endsWith(".js") && !path.basename(file).startsWith("_"));

			// Assemble and submit the commands
			const guildCommands = [];
			guildCommandFiles.forEach(file => {
				const command = require(path.join(commandFilesPath, guildname, file));
				guildCommands.push(command.data.toJSON());
			});
			submitCommands(guildCommands, guildname);
		});
	});
});
// #endregion
