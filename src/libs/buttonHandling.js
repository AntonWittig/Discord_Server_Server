// #region GENERAL
const general = {
	/**
	 * Remove the buttons from the message of an interaction.
	 * @param	{Interaction<CacheType>}	interaction
	 * The interaction to remove all buttons from.
	 * @return	{Promise<Boolean>}			If the removal was successful.
	 */
	removeAllReplyButtons: function(interaction) {
		try {
			// Fetch the reply and edit it to have no components/buttons
			return interaction.fetchReply()
				.then(() => {
					interaction.editReply({ components: [] })
						.then(() => {
							return Promise.resolve(true);
						});
				});
		}
		catch (e) {
			console.error(e);
			return Promise.reject(false);
		}
	},

	/**
	 * Remove all interactable buttons from a message.
	 * @param	{Message}			message
	 * The message to remove all buttons from.
	 * @returns	{Promise<Boolean>}	If the removal was successful.
	 */
	removeAllMessageButtons: function(message) {
		// Check if the message exists and edit components to none
		try {
			// Edit the message by appending the content
			message.edit({ components: [] });
			return Promise.resolve(true);
		}
		catch (e) {
			console.error(e);
			return Promise.reject(false);
		}
	},

	/**
	 * Disable the components/buttons of a message/reply which correspond to unempty spaces.
	 * @param	{Array<Array<String>>}		board
	 * The board from which to read the empty and unempty spaces.
	 * @param	{Array<MessageActionRow>}	components
	 * The components of which specific ones should be disabled.
	 * @return {Array<MessageActionRow>}	The components matrix with those corresponding to unempty spaces disabled.
	 */
	disableUnempty: function(board, components) {
		// Loop through the boards rows
		for (let i = 0; i < board.length; i++) {
			// Loop through the boards columns
			for (let j = 0; j < board[i].length; j++) {
				// Check if the space is not empty and disable the component if so
				const piece = board[i][j];
				if (piece !== "e") {
					components[i].components[j].setDisabled(true);
				}
			}
		}
		return components;
	},
};
exports.generalBtnHnd = general;
// #endregion
