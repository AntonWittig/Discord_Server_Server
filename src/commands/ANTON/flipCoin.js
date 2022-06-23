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
		interaction.reply("What? that can't be! The coin landed on its EDGE. What could this mean?");
	}
	else if (toss <= 3000) {
		interaction.reply({ content: ":warning: The coin landed with HEADS facing up.", fetchReply: true })
			.then((reply) => reply.addReaction("<a:Anton:820593477641044008>"));
	}
	else {
		interaction.reply({ content: "<:Anton:820593477641044008> The coin landed with TAILS facing up.", fetchReply: true })
			.then((reply) => reply.addReaction("💀"));
	}
};