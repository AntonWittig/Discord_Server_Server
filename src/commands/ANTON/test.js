// Require the necessary discord.js class
const { SlashCommandBuilder } = require("@discordjs/builders");

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("name")
	.setDescription("decription");

// Execute the command
exports.execute = async (interaction) => {
	interaction.reply("no description");
};