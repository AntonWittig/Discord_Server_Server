// Require the necessary discord.js class
const { SlashCommandBuilder } = require("@discordjs/builders");

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("roll_dice")
	.setDescription("The server rolls a dice with 6 sides (standard) or you define the amount of sides")
	.addIntegerOption(option => option.setName("sides").setDescription("The amount of sides").setRequired(false).setMin(1).setMax(1000000));

// Execute the command
exports.execute = async (interaction) => {
	const sides = interaction.options.getInteger("sides");
	const roll = Math.floor(Math.random() * sides) + 1;
	interaction.reply(`The d${sides} roll was a ${roll}.`);
};