const { joinImages } = require("join-images");

// Require the necessary discord.js class
const { SlashCommandBuilder, AttachmentBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");

// Require the path module for accessing the command src
const path = require("node:path");
const fs = require("node:fs");

// Create path to the json sources
const assetPath = [__dirname, "..", "assets", "tarot"];
const imagePath = [__dirname, "..", "assets", "tarot", "images"];
// Require card data json file
const cards = require(path.join(...assetPath, "cards.json"));
const spreads = require(path.join(...assetPath, "spreads.json"));

const readings = new Map();
let index = 0;

const empty = {
	emojiname: "empty",
	emojiid: "1009166030473543841",
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
	else if (num === 0) {
		roman = "0";
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
			.setName("topic")
			.setDescription("Specify the topic or question of your reading.")
			.setRequired(true))
		.addStringOption(option => option
			.setName("spread")
			.setDescription("Choose a spread to specify intents for your reading.")
			.addChoices(...spreads.map(spread => {
				return {
					name: spread.name,
					value: spread.type,
				};
			})))
		.addStringOption(option => option
			.setName("privacy")
			.setDescription("Specify the level of privacy of your reading.")
			.addChoices(
				{ name: "public", value: "public" },
				{ name: "private topic", value: "privateT" },
				{ name: "private reading", value: "private" })))
	.addSubcommand(subcommand => subcommand
		.setName("detail")
		.setDescription("Investigate a card to get a more detailed description.")
		.addStringOption(option => option
			.setName("card")
			.setDescription("Choose a card to investigate.")
			.setRequired(true))
		.addBooleanOption(option => option
			.setName("reversed")
			.setDescription("Choose whether the card is read upside down or not.")))
	.addSubcommand(subcommand => subcommand
		.setName("help")
		.setDescription("Get help on the interpretation of spreads.")
		.addStringOption(option => option
			.setName("spread")
			.setDescription("Choose a spread to get help on.")
			.setRequired(true)
			.addChoices(...spreads.map(spread => {
				return {
					name: spread.name,
					value: spread.type,
				};
			}))));

// Execute the command
exports.execute = async (interaction) => {
	switch (interaction.options.getSubcommand()) {
	case "read": {
		const spread = spreads.find(p => p.type === interaction.options.getString("spread")) || spreads[0];
		const privacy = interaction.options.getString("privacy") || "public";
		const topic = interaction.options.getString("topic");
		const topicInt = [...topic].map(char => ("" + char).charCodeAt(0)).reduce((a, b) => a + b, 0);

		const embed = new MessageEmbed()
			.setTitle(spread.name + " Reading")
			.setDescription(privacy === "public" ? "The topic: " + topic : "The topic of this reading is private.");

		const cardsDrawn = [];
		for (let i = 0; i < spread.pattern.length; i++) {
			const row = spread.pattern[i];
			for (let j = 0; j < row.length; j++) {
				console.log(row[j]);
				if (row[j]) {
					const card = drawCard(interaction, topicInt);
					cardsDrawn.push(card);
					embed.addFields({
						name: romanize(card.number),
						value: card.reversed ? card.name + "\nReversed" : card.name,
						inline: true,
					});
				}
				else {
					embed.addFields({
						name: `<:${empty.emojiname}:${empty.emojiid}>`,
						value: `<:${empty.emojiname}:${empty.emojiid}>`,
						inline: true,
					});
				}
			}
			if (i < spread.pattern.length - 1) {
				embed.addFields({ name: "\u200B", value: "\u200B" });
			}
		}

		const imageRows = [];

		const imagePaths = cardsDrawn.map(
			card => path.join(
				...imagePath, `${romanize(card.number)}-${card.name.replaceAll(" ", "")}${card.reversed ? "-Reverse" : ""}.png`));
		console.log(imagePaths);

		const oldIndex = index;
		index++;
		for (let i = 0; i < spread.pattern.length; i++) {
			const count = spread.pattern[i].reduce((accumulator, value) => value ? accumulator + 1 : accumulator, 0);
			const rowPaths = imagePath.splice(0, count);
			console.log(rowPaths);
			await joinImages(rowPaths, { direction: "horizontal" }).then(
				img => {
					console.log("testest");
					const iString = spread.pattern.length === 1 ? "" : `_${i}`;
					const rowPath = path.join(...assetPath, `reading${oldIndex}${iString}.png`);
					img.toFile(rowPath);
					imageRows.push(rowPath);
				});
		}

		if (spread.pattern.length > 1) {
			joinImages(imagePaths, { direction: "vertical" }).then(
				(img) => {
					const finalImagePath = path.join(...assetPath, `reading${oldIndex}.png`);
					img.toFile(finalImagePath);
					imageRows.push(finalImagePath);
					const file = new AttachmentBuilder(imageRows[0]);
					embed.setImage(`attachment://reading${oldIndex}.png`);
					interaction.reply({ embeds: [embed], files: [file] });
				});
		}
		else {
			const file = new AttachmentBuilder(imageRows[0]);
			embed.setImage(`attachment://reading${oldIndex}.png`);
			interaction.reply({ embeds: [embed], files: [file] });
		}

		readings.set(`reading${oldIndex}`, {
			spread: spread.type,
			topic: topic,
			privacy: privacy,
			cards: cardsDrawn,
		});

		setTimeout(() => {
			imageRows.forEach(row => fs.unlinkSync(row));
		}, 2000);
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