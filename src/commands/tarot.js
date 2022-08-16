// Require the necessary discord.js class
const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const { userInfo } = require("node:os");

// Require the path module for accessing the command src
const path = require("node:path");

// Create path to the json sources
const assetPath = [__dirname, "..", "assets", "tarot"];
// Require card data json file
const cards = require(path.join(...assetPath, "cards.json"));
const patterns = require(path.join(...assetPath, "patterns.json"));

const readings = new Map();
const index = 0;

const empty = {
	emojiname: "",
	emojiid: "",
};

const romanLetters = {
	M: 1000,
	CM: 900,
	D: 500,
	CD: 400,
	C: 100,
	XC: 90,
	L: 50,
	XL: 40,
	X: 10,
	IX: 9,
	V: 5,
	IV: 4,
	I: 1,
};

function romanize(num) {
	let roman = "";
	if (num) {
		for (const [key, value] of Object.entries(romanLetters)) {
			while (num >= value) {
				roman += key;
				num -= value;
			}
		}
	}
	return roman;
}

function drawCard(interaction, additionalSubtrahend = 0) {
	let draw = Math.floor(Math.random() * Number.MAX_VALUE);
	draw -= parseInt(interaction.user.id);
	draw -= Date.now();
	draw -= additionalSubtrahend;
	draw = draw % cards.length;
	return cards[draw];
}

// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("tarot")
	.setDescription("Interact with the server's tarot card deck.")
	.addSubcommand(subcommand => subcommand
		.setName("read")
		.setDescription("Let the server read your cards for a question or topic of your choice.")
		.addStringOption(option => option
			.setName("pattern")
			.setDescription("Choose a pattern to specify intents for your reading.")
			.addChoices(...patterns.map(pattern => {
				return {
					name: pattern.name,
					value: pattern.type,
				};
			})))
		.addStringOption(option => option
			.setName("question/topic")
			.setDescription("Specify the topic or question of your reading."))
		.addStringOption(option => option
			.setName("privacy")
			.setDescription("Specify the level of privacy of your reading.")
			.addChoices(
				{ name: "public", value: "public" },
				{ name: "private question/topic", value: "privateQT" },
				{ name: "private reading", value: "private" })))
	.addSubcommand(subcommand => subcommand
		.setName("detail")
		.setDescription("Investigate a card to get a more detailed description.")
		.addStringOption(option => option
			.setName("card")
			.setDescription("Choose a card to investigate.")
			.setRequired(true)
			.setAutocomplete(true))
		.addBooleanOption(option => option
			.setName("reversed")
			.setDescription("Choose whether the card is read upside down or not.")))
	.addSubcommand(subcommand => subcommand
		.setName("help")
		.setDescription("Get help on the interpretation of patterns.")
		.addStringOption(option => option
			.setName("pattern")
			.setDescription("Choose a pattern to get help on.")
			.setRequired(true)
			.addChoices(...patterns.map(pattern => {
				return {
					name: pattern.name,
					value: pattern.type,
				};
			}))));

// Execute the command
exports.execute = async (interaction) => {
	switch (interaction.options.getSubcommand()) {
	case "read": {
		const pattern = patterns.find(p => p.type === interaction.options.getStringOption("pattern"));
		const privacy = interaction.options.getStringOption("privacy") || "public";
		const topic = interaction.options.getStringOption("question/topic");
		const topicInt = topic.map(letter => letter.CharCodeAt(0)).reduce((a, b) => a + b, 0);

		const embed = new EmbedBuilder()
			.setTitle(pattern.name + " Reading")
			.setDescription(privacy === "public" ? "The question/topic: " + topic : "The question/topic of this reading is private.");

		const cardsDrawn = [];
		for (const row in pattern.rows) {
			for (const char in row) {
				if (parseInt(char)) {
					const card = drawCard(interaction, topicInt);
					cardsDrawn.push(card);
					embed.addFields({
						name: romanize(card.number),
						value: `<:${card.emojiname}:${card.emojiid}>`,
						inline: true,
					});
				}
				else {
					embed.addFields({
						name: " ",
						value: `<:${empty.emojiname}:${empty.emojiid}>`,
						inline: true,
					});
				}
			}
			embed.addFields({ name: "\u200B", value: "\u200B" });
		}
		interaction.reply({ embeds: [embed] });
		break;
	}
	case "detail":
		break;
	case "help":
		break;
	default:
		break;
	}
};