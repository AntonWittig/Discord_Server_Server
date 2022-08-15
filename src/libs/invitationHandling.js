// #region IMPORTS
// Require the necessary discord.js class
const { MessageButton, MessageActionRow } = require("discord.js");

// Require the path module for accessing the correct files
const path = require("node:path");

// Require the necessary libraries for the command
const libPath = [__dirname, "..", "libs"];
const { generalBtnHnd } = require(path.join(...libPath, "buttonHandling.js"));
const { generalMsgHnd } = require(path.join(...libPath, "messageHandling.js"));
// #endregion

// #region GENERAL
const general = {
	/**
	 * Create an invitation message/reply for a game command.
	 * @param	{Interaction<CacheType>}	interaction
	 * The interaction which invoked the invitation creation.
	 * @param	{String}					gameName
	 * The name of the game to play.
	 * @param	{Integer}					gameId
	 * The id of the game to play.
	 * @returns	{Object}					The created invitation/reply.
	 */
	createGameInvitation: function(interaction, gameName, gameId) {
		// Initialize the "Accept" and "Decline" buttons
		const row = new MessageActionRow()
			.addComponents([
				new MessageButton()
					.setCustomId(`${gameName}_accept_${gameId}`)
					.setLabel("Accept")
					.setStyle("PRIMARY"),
				new MessageButton()
					.setCustomId(`${gameName}_decline_${gameId}`)
					.setLabel("Decline")
					.setStyle("DANGER"),
			]);
		// Get the invoking user and the opponent
		const user = interaction.user;
		const opponent = interaction.options.getUser("opponent");
		// Return a command rejection message if the invoking user wants to challenge themselves
		if (opponent && opponent.id === user.id) {
			return { content: "You can't challenge yourself.", ephemeral: true };
		}
		// Check if the opponent user is specified and reply with a challenge message
		if (opponent) {
			return { content: `${user} challenges ${opponent} for a ${gameName} game, will they accept?`, components: [row] };
		}
		else {
			const guildName = interaction.guild.name.toUpperCase();
			const roleID = process.env[`ROLE_ID_${guildName}_${gameName.toUpperCase()}`];
			const roleMessagePart = roleID ? `<@&${roleID}>` : gameName;
			// Reply with an open invitation message
			return { content: `${user} wants to play a game of ${roleMessagePart} against anyone, do you accept?`, components: [row] };
		}
	},

	/**
	 * Handle the acceptance of a game invitation.
	 * @param	{Interaction<CacheType>}		interaction
	 * The interaction which invoked the invitation acceptance.
	 * @param	{Map<String, Object|String>}	game
	 * The game to accept.
	 * @param	{Integer}						index
	 * The index of the game in the game map.
	 * @param	{Function}						startFunction
	 * The function to call when to start the game.
	 * @returns	{Object}						The data of a message.
	 */
	handleAccept: function(interaction, game, index, startFunction) {
		// Return a rejection message if the game has already ended
		if (!game) return { content: "The game has already ended.", ephemeral: true };
		// Check if an opponent has been specified in the invitation
		if (game.has("opponent")) {
			// Check if the invoking user is the challenged user/opponent and start the game if so
			if (interaction.user.id === game.get("opponent").id) {
				startFunction(interaction, game, index);
			}
			// Return a rejection message if the invoking user is the challenging user
			else if (interaction.user.id === game.get("challenger").id) {
				return { content: "You can't accept this challenge for the opponent.", ephemeral: true };
			}
			// Return a rejection message if the invoking user is neither the challenging user nor the challenged user/opponent
			else {
				return { content: "This challenge is not meant for you.", ephemeral: true };
			}
		}
		// Return a rejection message if the invoking user wants to accept their own open invitation has been specified
		else if (interaction.user.id === game.get("challenger").id) {
			return { content: "You can't accept your own challenge.", ephemeral: true };
		}
		// Start the game if the invoking user is not the challenging user
		else {
			game.set("opponent", interaction.user);
			// Set the invoking user to be the starting user if the challenging user doesn't want to start
			const nextTurnID = game.get("nextTurnID");
			game.set("nextTurnID",
				nextTurnID === undefined || nextTurnID === null
					? interaction.user.id : game.get("nextTurnID"));
			startFunction(interaction, game, index);
		}
	},

	/**
	 * Handle the rejection of a game invitation.
	 * @param	{Interaction<CacheType>}					interaction
	 * The interaction which invoked the invitation rejection.
	 * @param	{Map<String, Map<String, Object|String>}	games
	 * The games map containing the game to reject.
	 * @param	{Integer}									index
	 * The index of the game in the games map.
	 * @returns {Object}									The data of a message.
	 */
	handleDecline: function(interaction, games, index) {
		// Extract correct game from the games dictionary
		const game = games.get(`game${index}`);
		// return a rejection message if the game has already ended
		if (!game) return { content: "The game has already ended.", ephemeral: true };
		// Check if an opponent has been specified in the invitation
		let message = "";
		if (game.get("opponent")) {
			// Edit the invitation to being declined if the invoking user is the challenged user/opponent
			if (interaction.user.id === game.get("opponent").id) {
				message = "**The challenge has been declined.**";
			}
			// Edit the invitation to being cancelled if the invoking user is the challenging user
			else if (game.get("challenger").id === interaction.user.id) {
				message = "**The challenge has been cancelled.**";
			}
			// Reply with a rejection message if the invoking user is neither the challenging user nor the challenged user/opponent
			else {
				return { content: "This challenge is not meant for you.", ephemeral: true };
			}
		}
		// Edit the invitation to being cancelled if the invoking user is the challenging user
		else if (game.get("challenger").id === interaction.user.id) {
			message = `**${interaction.user} cancelled the challenge.**`;
		}
		// Edit the invitation to being declined if the invoking user is any user but the challenging user
		else {
			message = `**${interaction.user} declined the challenge.**`;
		}
		generalBtnHnd.removeAllMessageButtons(game.get("invitation"))
			.then(() => {
				generalMsgHnd.appendToMessage(game.get("invitation"), message);
			});
		games.delete(`game${index}`);
	},
};
exports.generalInvHnd = general;
// #endregion
