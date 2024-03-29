// Require the necessary discord.js class
const { SlashCommandBuilder } = require("@discordjs/builders");

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("roll_dice")
	.setDescription("The server rolls a dice with 6 sides (standard) or you define the amount of sides (at least 1)")
	.addIntegerOption(option =>
		option.setName("sides")
			.setDescription("The amount of sides")
			.setRequired(false));

// Execute the command
exports.execute = async (interaction) => {
	const sideInput = interaction.options.getInteger("sides");
	const sides = sideInput ? sideInput : 6;
	if (sides < 1) {
		interaction.reply(process.env.INCORRECT_BOT_USAGE);
		return;
	}
	const roll = Math.floor(Math.random() * sides) + 1;
	interaction.reply(`:game_die: The d${sides} roll was a **${roll}**.`);
};
