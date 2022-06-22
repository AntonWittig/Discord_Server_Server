// Require the necessary discord.js classes
const { Client, Collection, Intents } = require("discord.js");

// Require the necessary environment variables
require("dotenv").config();

// Require the file system modules for dynamic command creation
const fs = require("node:fs");
const path = require("node:path");

// Create a new client instance and a commands collection
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
client.commands = new Collection();

// #region FUNCTIONS
// Recursively retrieve files (credits to https://stackoverflow.com/users/5551941/wyattis)
function recReadDir(dir, done) {
	const results = [];
	fs.readdir(dir, function(err, list) {
		if (err) return done(err);
		let pending = list.length;
		if (!pending) return done(null, results);
		list.forEach(function(file) {
			file = path.resolve(dir, file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					recReadDir(file, function(err, res) {
						results.push(res);
						if (!--pending) done(null, results);
					});
				}
				else {
					results.push(file);
					if (!--pending) done(null, results);
				}
			});
		});
	});
}
// #endregion

// #region COMMANDS
// Retrieve the command files
const commandsPath = path.join(__dirname, "src", "commands");
const commandFiles = recReadDir(commandsPath).filter((file) => file.endsWith(".js") && !file.startsWith("_"));

// Assemble the commands and store them
commandFiles.forEach((file) => {
	const command = require(path.join(commandsPath, file));
	client.commands.set(command.data.name, command);
});
// #endregion

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.log(
		`Logged in as ${client.user.tag} on ${client.guilds.cache.size} server,(s)`,
	);
	client.user.setActivity({ name: "pornhub.com", type: "WATCHING" });
});

// When an interaction with the client is created, run this code
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		interaction.reply("Dieser Befehl ist nicht verfügbar");
	}
	else {
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);

			if (interaction.deferred || interaction.replied) {
				interaction.editReply("Fehler beim Ausführen");
			}
			else {
				interaction.reply("Fehler beim Ausführen aufgetreten");
			}
		}
	}
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);
