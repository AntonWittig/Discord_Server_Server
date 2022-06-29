// #region GENERAL
const general = {
	/**
	 * Append content to the reply of an interaction.
	 * @param	{Interaction<CacheType>}	interaction
	 * The interaction reply to which the content should be appended.
	 * @param	{String}					content
	 * The content to append to the message.
	 * @return	{Promise<Boolean>}			If the appending was successful.
	 */
	appendToReply: function(interaction, content) {
		try {
			// Fetch the reply and edit it by appending the content
			return interaction.fetchReply().then(message => {
				interaction.editReply({ content: message.content + "\n" + content });
			}).then(() => {
				return Promise.resolve(true);
			});
		}
		catch (e) {
			console.error(e);
			return Promise.reject(false);
		}
	},

	/**
	 * Append content to a message.
	 * @param	{Message}			message
	 * The message to append the content to.
	 * @param	{String}			content
	 * The content to append to the message.
	 * @return	{Promise<Boolean>}	If the appending was successful.
	 */
	appendToMessage: function(message, content) {
		try {
			// Edit the message by appending the content
			message.edit({ content: message.content + "\n" + content });
			return Promise.resolve(true);
		}
		catch (e) {
			console.error(e);
			return Promise.reject(false);
		}
	},

	/**
	 * Extract the emojis of a text as dictionaries with (animated,) name & id
	 * @param	{String}									text
	 * The text to extract the emojis from.
	 * @return	{Array<Object>}	The extracted emojis.
	 */
	extractEmojiDataFromText: function(text) {
		// Initialize the emojis array
		const emojis = [];
		// Initialize the position in the text
		let position = 0;

		// Loop through the text until at the end
		while (position < text.length) {
			// Get the next colon position; if there is no colon break the loop
			let emojiStart = text.indexOf(":", position);
			if (emojiStart === -1) break;

			// Initialize the emoji dictionary and necessary variables
			const emojiData = {};
			let emojiEnd;
			let isDefault = false;
			// Check if the emoji is a custom emoji
			if (text[emojiStart - 1] === "<"
				|| (text[emojiStart - 1] === "a" && text[emojiStart - 2] === "<")) {
				// Get the end of the emoji; if there is no end it could still be a default emoji
				emojiEnd = text.indexOf(">", emojiStart);
				if (emojiEnd === -1) {
					isDefault = true;
				}
				// Check if the custom emoji is animated and store result in the dictionary
				else {
					emojiData["animated"] = text[emojiStart - 1] === "a";
				}
			}
			// Increment the emoji start position to skip the first colon
			emojiStart += 1;
			// Check if the emoji has been declared a default emoji or if the previous statement has been skipped
			if (isDefault
				|| emojiData.animated === undefined) {
				// Get the end of the default emoji; if there is no end break the loop
				emojiEnd = text.indexOf(":", emojiStart);
				if (emojiEnd === -1) break;
				// Declare the emoji as a default emoji
				isDefault = true;
			}
			// Get the emoji string
			const emoji = text.substring(emojiStart, emojiEnd);
			// Check if the emoji is a default emoji and store the emoji string as name in the dictionary
			if (isDefault) {
				emojiData["name"] = emoji;
			}
			else {
				// Split the emoji string into name and id and store them in the dictionary
				const emojiDataArray = emoji.split(":");
				if (emojiDataArray.length === 2) {
					emojiData["name"] = emojiDataArray[0];
					emojiData["id"] = emojiDataArray[1];
				}
			}
			// Set position at the end of the emoji
			position = emojiEnd + 1;
			// Add the emoji dictionary to the emojis array
			emojis.push(emojiData);
		}
		return emojis;
	},
};
exports.generalMsgHnd = general;
// #endregion