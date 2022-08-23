// #region IMPORTS
// Require the necessary discord.js class
const { MessageEmbed, MessageAttachment } = require("discord.js");
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
const { generalStrHnd } = require(path.join(...libPath, "stringHandling.js"));
const deepClone = require(path.join(...libPath, "deepClone.js"));

// Create source paths for the json files and the card images
const imagesPath = [__dirname, "..", "assets", "tarot", "images"];
// Create temp folder path to temporarily store the reading images
const tempPath = [__dirname, "..", "assets", "tarot", "temp"];
// #endregion

// #region VARIABLES
// Storage managment variables for the active readings
const readings = new Map();
let storageIndex = 0;

// String matching threshhold
const matchThresh = 0.8;

// Emoji data of empty card
const empty = {
	number: undefined,
	name: "Empty",
	emojiName: "empty",
	emojiID: "1009166030473543841",
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
		const cardBooleans = spread.pattern.flat();
		// Draw as many cards as defined by the spread
		for (const bool in cardBooleans) {
			// Draw and store a random card that hasn't been drawn yet
			let card;
			if (bool) {
				card = generalRndHnd.randFromArray(
					drawFrom,
					(arrayLength) => {
						const draw = generalRndHnd.randMax() - (parseInt(interaction.user.id) + Date.now() + topicInt);
						return draw % arrayLength;
					});
			}
			else {
				card = empty;
			}
			cardsDrawn.push(card);
			// Remove the drawn card from the cards to draw from
			drawFrom = drawFrom.filter(c => c.name !== card.name);
		}
		// Reorder the drawn cards to be correctly placed in the spread
		cardsDrawn = generalArrHnd.reorderByArray(cardsDrawn, spread.order);

		// Loop through the spread pattern rows
		for (let i = 0; i < spread.pattern.length; i++) {
			const row = spread.pattern[i];
			// Loop through the row's columns
			for (let j = 0; j < row.length; j++) {
				const card = cardsDrawn[i + j];
				// Check if a card should be placed at the current position
				if (row[j]) {
					// Add the card number and name to the embed
					embed.addField({
						name: generalNumHnd.romanizeArabic(card.number),
						value: card.reversed ? card.name + "\nReversed" : card.name,
						inline: true,
					});
				}
				// If no card should be placed at the current position, add an empty card
				else {
					embed.addField({
						name: `<:${card.emojiName}:${card.emojiID}>`,
						value: `<:${card.emojiName}:${card.emojiID}>`,
						inline: true,
					});
				}
			}

			// Add a newline after each row
			if (i < spread.pattern.length - 1) {
				embed.addField({ name: "\u200B", value: "\u200B" });
			}
		}

		// Initialize the array of path strings for each drawn cards image
		const imagePaths = cardsDrawn.map(
			card => path.join(
				...imagesPath,
				`${card.number ? generalNumHnd.romanizeArabic(card.number) + "-" : ""}
				${card.name.replaceAll(" ", "")}
				${card.reversed ? "-Reverse" : ""}.png`));

		// Initialize the array of image rows
		const imageRows = [];
		// Store current index
		const oldIndex = storageIndex;
		storageIndex++;

		const rowAmount = spread.pattern.length;
		// Loop through the spread pattern rows
		for (let i = 0; i < rowAmount; i++) {
			// Combine images of the current row into one image
			joinImages(imagePaths.splice(0, spread.pattern[i]), { direction: "horizontal" }).then(img => {
				// Build the path to store row image
				const rowPath = path.join(
					...tempPath,
					`reading${oldIndex}
					${rowAmount === 1 ? "" : `_${i}`}.png`);
				// Save the row image as a file to the path
				img.toFile(rowPath).then(() => {
					// Insert the row image into the image rows array (necessary because of asynchrony)
					imageRows.splice(i, 0, rowPath);
					// Check if not all rows have been drawn yet
					if (imageRows.length < rowAmount) return;
					if (rowAmount === 1) {
						// Create the final image as an attachment
						const image = new MessageAttachment(imageRows[0]);
						// Add the image attachment to the embed and reply with the embed
						embed.setImage(`attachment://${image}`);
						interaction.reply({ embeds: [embed] });
					}
					else {
						// Combine all row images to a full image if this is the last row
						joinImages(imageRows, { align: spread.verticalalign }).then((finalImg) => {
							// Build the path to store the full image
							const finalImagePath = path.join(...tempPath, `reading${oldIndex}.png`);
							// Save the full image as a file to the path
							finalImg.toFile(finalImagePath).then(() => {
								// Save full image path and send the full image to the image channel for fetching its url
								imageRows.push(finalImagePath);
								// Create the full image as an attachment
								const image = new MessageAttachment(finalImagePath);
								// Add the image attachment to the embed and reply with the embed
								embed.setImage(`attachment://${image}`);
								console.log(embed.fields);
								console.log(image);
								console.log(imageRows);
								interaction.reply({
									embeds: [embed],
									files: [imageRows[0]],
								});
							});
						}).catch(console.error);
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
	case "detail": {
		const card = interaction.options.getString("card");
		const reversed = interaction.options.getBoolean("reversed") || false;

		const cardsClone = deepClone(cards);
		const matches = [];
		for (let i = 0; i < cardsClone.length; i++) {
			let cardInput = card;
			if (card.toLowerCase().startsWith("the ")
				&& !cardsClone[i].name.toLowerCase().startsWith("the ")) {
				cardInput = card.replace("the ", "");
			}
			else if (!card.toLowerCase().startsWith("the ")
				&& cardsClone[i].name.toLowerCase().startsWith("the ")) {
				cardInput = `the ${card}`;
			}
			if (generalStrHnd.matchPercentage(cardInput, cardsClone[i].name) > matchThresh) {
				matches.push(cardsClone[i]);
			}
		}

		const match = matches.filter(obj => obj.reversed === reversed);
		if (match.length === 0 || match.length > 1) {
			interaction.reply({ content: "The server can not uniquely identify a card with that name.", ephemeral: true });
			break;
		}
		const cardObj = match[0];

		const fileName = `${generalNumHnd.romanizeArabic(cardObj.number)}-${cardObj.name.replaceAll(" ", "")}${cardObj.reversed ? "-Reverse" : ""}.png`;
		const imgPath = path.join(...imagesPath, fileName);
		const image = new MessageAttachment(imgPath);
		const embed = new MessageEmbed()
			.setTitle(`${generalNumHnd.romanizeArabic(cardObj.number)} - ${cardObj.name}${cardObj.reversed ? " Reversed" : ""}`)
			.setDescription(cardObj.keywords.join(", "))
			.setThumbnail(`attachment://${fileName}`)
			.addFields([
				{
					name: `Suit: ${generalStrHnd.capitalizeFirst(cardObj.suit)}`, value: "\u200B", inline: true,
				},
				{
					name: `Element: ${generalStrHnd.capitalizeFirst(cardObj.element)}`, value: "\u200B", inline: true,
				},
				{
					name: `Reigning Planet: ${generalStrHnd.capitalizeFirst(cardObj.reigningplanet)}`, value: "\u200B", inline: true,
				},
				{
					name: `Message: ${generalStrHnd.capitalizeFirst(cardObj.message)}`, value: "\u200B", inline: false,
				},
				{
					name: "Description:", value: cardObj.description, inline: false,
				},
				{
					name: "Interpretation:", value: cardObj.interpretation, inline: false,
				},
				{
					name: "Further Interpretation:", value: cardObj.url, inline: false,
				},
			]);
		interaction.reply({ embeds: [embed], files: [image] });
		break;
	}
	// #endregion
	// #region HELP
	case "help": {
		const spread = interaction.options.getString("spread");

		const spreadClone = deepClone(cards);

		const matches = [];
		for (let i = 0; i < spreadClone.length; i++) {
			if (generalStrHnd.matchPercentage(spread, spreadClone[i].spread) > matchThresh) {
				matches.push(spreadClone[i]);
			}
		}

		if (matches.length === 0 || matches.length > 1) {
			interaction.reply({ content: "The server can not uniquely identify a spread with that name.", ephemeral: true });
			break;
		}

		const spreadObj = matches[0];
		const embed = new MessageEmbed()
			.setTitle(spreadObj.name + " Spread")
			.setDescription("Amount of cards to draw: " + spreadObj.amount);
		interaction.reply({ embeds: [embed] });
		break;
	}
	// #endregion
	}
};