// Require the necessary discord.js class
const { SlashCommandBuilder } = require("@discordjs/builders");

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("flip_coin")
	.setDescription("The server just flips a coin");

// Execute the command
exports.execute = async (interaction) => {
	const toss = Math.random() * 6001;
	if (toss == 3001) {
		interaction.reply({
			content: ":coin: What? that can't be! The coin landed on its EDGE. What could this mean?",
			fetchReply: true,
		}).then((message) => { message.react(":astonished:"); });
	}
	else if (toss <= 3000) {
		interaction.reply(":coin: The coin landed with HEADS facing up.");
	}
	else {
		interaction.reply(":coin: The coin landed with TAILS facing up.");
	}
};