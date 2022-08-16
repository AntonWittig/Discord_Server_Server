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
async function recReadDir(dir, done) {
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
const commandsPath = path.join(__dirname, "..", "commands");
recReadDir(commandsPath, function(err, results) {
	if (err) throw err;

	// Assemble the commands and store them
	results.flat(Infinity)
		.filter((file) => file.endsWith(".js") && !path.basename(file).startsWith("_"))
		.forEach((file) => {
			const command = require(file);
			client.commands.set(command.data.name, command);
		});
});
// #endregion

// When the client is ready, run this code (only once)
client.once("ready", () => {
	console.info(`Logged in successfully as ${client.user.tag}`);
	console.info(`Add this bot to any guild (you need to be a guild admin) with this link:\nhttps://discord.com/api/oauth2/authorize?client_id=${process.env.APPLICATION_ID}&permissions=534723950656&scope=bot%20applications.commands`);
});

// When an interaction with the client is created, run this code
client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		console.log(`${interaction.user.tag} issued the command ${interaction.commandName}`);
		console.log(interaction.options);
		const command = client.commands.get(interaction.commandName);

		if (command) {
			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error("Error:" + error);

				if (interaction.deferred || interaction.replied) {
					interaction.editReply({ content: ":no_entry_sign: Ein Fehler ist beim Ausführen aufgetreten", ephemeral: true });
				}
				else {
					interaction.reply({ content: ":no_entry_sign: Ein Fehler ist beim Ausführen aufgetreten", ephemeral: true });
				}
			}
		}
		else {
			interaction.reply({ content: ":warning: Dieser Befehl ist aktuell nicht verfügbar", ephemeral: true });
		}
	}
	else if (interaction.isButton()) {
		console.log(`${interaction.user.tag} clicked the button ${interaction.customId}`);
		const buttonID = interaction.customId.split("_");
		const command = client.commands.get(buttonID[0]);

		command[buttonID[1]](
			interaction,
			buttonID[buttonID.length - 1],
			buttonID.slice(2, buttonID.length - 1));
	}
});

// Login to Discord with your client's token
client.login(process.env.BOT_TOKEN);
