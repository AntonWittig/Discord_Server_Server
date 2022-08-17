// #region IMPORTS
// Require the necessary discord.js class
const { MessageEmbed } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

// Require the path module for accessing the correct files
const path = require("node:path");
const fs = require("node:fs");

// Require the join-images module to combine multiple cards into one image
const { joinImages } = require("join-images");

// Require the card and spread data json files
const assetPath = [__dirname, "..", "assets", "tarot"];
const cards = require(path.join(...assetPath, "cards.json"));
const spreads = require(path.join(...assetPath, "spreads.json"));

// Require the necessary libraries for the command
const libPath = [__dirname, "..", "libs"];
const { generalNumHnd } = require(path.join(...libPath, "NumberHandling.js"));
const { generalArrHnd } = require(path.join(...libPath, "arrayHandling.js"));
const { generalRndHnd } = require(path.join(...libPath, "randomHandling.js"));
const deepClone = require(path.join(...libPath, "deepClone.js"));

// Create source paths for the json files and the card images
const imagePath = [__dirname, "..", "assets", "tarot", "images"];
// #endregion

// #region VARIABLES
// Storage managment variables for the active readings
const readings = new Map();
let storageIndex = 0;

// Channel variable to send images to to fetch them as url
let channel;

// Emoji data of empty card
const empty = {
	emojiName: "empty",
	emojiID: "1009166030473543841",
	imageName: "empty.png",
};
// #endregion

// #region COMMAND
// Initialize the command with a name and description
exports.data = new SlashCommandBuilder()
	.setName("tarot")
	.setDescription("Interact with the server's tarot card deck.")
	// Subcommand for doing tarot readings
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
	// Subcommand for getting details of a tarot card
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
	// Subcommand for getting interpretation help for a spread
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
	// Set channel to send all final images to, to get its url
	if (!channel) channel = interaction.client.channels.cache.find(c => c.id === "1009205115711914075");
	// Get the subcommand of the command
	switch (interaction.options.getSubcommand()) {
	// #region READ
	case "read": {
		// Get subcommand options
		const topic = interaction.options.getString("topic");
		const spread = spreads.find(p => p.type === interaction.options.getString("spread")) || spreads[0];
		const privacy = interaction.options.getString("privacy") || "public";
		// Get an integer representation of the topic as the sum of the chars codes
		const topicInt = [...topic].map(char => ("" + char).charCodeAt(0)).reduce((a, b) => a + b, 0);

		// Initialize the embed of the reply with a title and description
		const embed = new MessageEmbed()
			.setTitle(spread.name + " Reading")
			.setDescription(privacy === "public" ? "The topic: " + topic : "The topic of this reading is private.");

		// Initialize the array of drawn cards and clone cards array to draw from
		let cardsDrawn = [];
		let drawFrom = deepClone(cards);
		// Draw as many cards as defined by the spread
		for (let i = 0; i < spread.amount; i++) {
			// Draw and store a random card that hasn't been drawn yet
			const card = generalRndHnd.randFromArray(
				drawFrom,
				(arrayLength) => {
					const draw = generalRndHnd.randMax() - (parseInt(interaction.user.id) + Date.now() + topicInt);
					return draw % arrayLength;
				});
			cardsDrawn.push(card);
			// Remove the drawn card from the cards to draw from
			drawFrom = drawFrom.filter(c => c.name !== card.name);
		}
		// Reorder the drawn cards to be correctly placed in the spread
		cardsDrawn = generalArrHnd.reorderByArray(cardsDrawn, spread.order);

		let cardsIndex = 0;
		// Loop through the spread pattern rows
		for (let i = 0; i < spread.pattern.length; i++) {
			const row = spread.pattern[i];
			// Loop through the row's columns
			for (let j = 0; j < row.length; j++) {
				// Check if a card should be placed at the current position
				if (row[j]) {
					// Add the card number and name to the embed
					const card = cardsDrawn[cardsIndex];
					embed.addFields({
						name: generalNumHnd.romanizeArabic(card.number),
						value: card.reversed ? card.name + "\nReversed" : card.name,
						inline: true,
					});
					cardsIndex++;
				}
				// If no card should be placed at the current position, add an empty card
				else {
					embed.addFields({
						name: `<:${empty.emojiName}:${empty.emojiID}>`,
						value: `<:${empty.emojiName}:${empty.emojiID}>`,
						inline: true,
					});
				}
			}
			// Add a newline after each row
			if (i < spread.pattern.length - 1) {
				embed.addFields({ name: "\u200B", value: "\u200B" });
			}
		}

		// Initialize the array of path strings for each drawn cards image
		const imagePaths = cardsDrawn.map(
			card => path.join(
				...imagePath,
				`${generalNumHnd.romanizeArabic(card.number)}-${card.name.replaceAll(" ", "")}${card.reversed ? "-Reverse" : ""}.png`));

		//
		const imageRows = [];
		const oldIndex = storageIndex;
		storageIndex++;
		for (let i = 0; i < spread.pattern.length; i++) {
			const count = spread.pattern[i].reduce((accumulator, value) => value ? accumulator + 1 : accumulator, 0);
			joinImages(imagePaths.splice(0, count), { direction: "horizontal" }).then(img => {
				const iString = spread.pattern.length === 1 ? "" : `_${i}`;
				const rowPath = path.join(...assetPath, `reading${oldIndex}${iString}.png`);
				img.toFile(rowPath).then(() => {
					imageRows.splice(i, 0, rowPath);
					if (imageRows.length === spread.pattern.length) {
						if (spread.pattern.length > 1) {
							joinImages(imageRows, { align: spread.verticalalign }).then((finalImg) => {
								const finalImagePath = path.join(...assetPath, `reading${oldIndex}.png`);
								finalImg.toFile(finalImagePath).then(() => {
									imageRows.push(finalImagePath);
									channel.send({ files: [path.join(...assetPath, `reading${oldIndex}.png`)] }).then(message => {
										embed.setImage(message.attachments.first().url);
										interaction.reply({ embeds: [embed] });
									}).catch(console.error);
								});
							}).catch(console.error);
						}
						else {
							channel.send({ files: imageRows }).then(message => {
								embed.setImage(message.attachments.first().url);
								interaction.reply({ embeds: [embed] });
							}).catch(console.error);
						}
					}
				});
			});
		}

		// Store the data of the reading for later access
		readings.set(`reading${oldIndex}`, {
			timestamp: Date.now(),
			user: interaction.user.id,
			spread: spread.type,
			topic: topic,
			privacy: privacy,
			cards: cardsDrawn,
		});

		// Delete all temporarily created image files
		setTimeout(() => {
			imageRows.forEach(row => fs.unlinkSync(row));
		}, 2000);

		// Redd sessions of readings from json file
		fs.readFile(path.join(...assetPath, "readings.json"), "utf8", function readFileCallback(err, data) {
			if (err) { console.log(err);}
			else {
				const obj = JSON.parse(data);
				const objEntries = Object.entries(obj);
				// Check if there is already a session for the current readings
				const objkey = objEntries.map(([key, value]) => value.reading0.timestamp === readings.get("reading0").timestamp ? key : "").filter((e) => e !== "");
				// Check if a session was found
				if (objkey.length > 0) {
					// Store the current readings in the existing session
					obj[objkey[0]] = readings;
				}
				else {
					// Store the current readings in a new session
					obj[`session${objEntries.length}`] = readings;
				}
				// Store the json object in the file
				const json = JSON.stringify(obj);
				fs.writeFile(path.join(...assetPath, "readings.json"), json, "utf8");
			}
		});
		break;
	}
	// #endregion
	// #region DETAIL
	case "detail":
		break;
	// #endregion
	// #region HELP
	case "help":
		break;
	// #endregion
	}
};