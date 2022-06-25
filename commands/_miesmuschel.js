const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("miesmuschel")
		.setDescription("use if you need some guidance in your life")
		.addStringOption(option => option.setName("question").setDescription("ask a specific quetion, the miesmuschel should answer").setRequired(true)),
	async execute(interaction) {
		const advices = [
			"Du stinkst",
			"Nein",
			"Ja",
			"Frag mich nochmal in 2 Stunden",
			"Deine Mutter sagt ja",
			"vielleicht",
			"42",
			"Juckt mich nicht",
			"Seh ich so aus als ob mich das interessiert?",
			"Sicher nicht",
			"Das weiß ich nicht",
			"Theoretisch schon",
			"Eigentlich nicht",
			"Garantiert nicht",
			"Das ist nicht so",
			"Ich würde ja sagen",
			"Das ist richtig",
			"Frag mich nochmal",
			"WEEEEEEEEEEEEEEEEEEEEEEEE",
			"Nüsse sind gesund",
			"Egal",
			"Heute nicht",
			"Wahrscheinlich",
			"Unwahrscheinlich",
			"Keine Ahnung",
			"Eines Tages vielleicht",
			"Keine Ahnung, im Zweifelsfall nimm Drogen",
			"Bin beschäftigt",

		];
		const rand = Math.floor(Math.random() * advices.length);
		interaction.reply(`<:miesmuschel:988448308559216701> ${advices[rand]}`);
	},
};