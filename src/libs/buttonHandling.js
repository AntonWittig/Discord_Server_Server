// #region GENERAL
const general = {
	/**
	 * Remove the buttons from the message of an interaction.
	 * @param	{Interaction<CacheType>}	interaction
	 * The interaction to remove all buttons from.
	 * @return	{Promise<Boolean>}			If the removal was successful.
	 */
	removeAllButtons: function(interaction) {
		// Check if the interaction has already been replied to
		if (interaction.replied) {
			// Fetch the reply and edit it to have no components/buttons
			interaction.fetchReply().then(message => {
				interaction.editReply({ content: message.content, components: [] });
			}).then(() => {
				return true;
			});
		}
		else {
			return false;
		}
	},

	/**
	 * Disable the components/buttons of a message/reply which correspond to unempty spaces.
	 * @param	{Array<Array<String>>}		board
	 * The board from which to read the empty and unempty spaces.
	 * @param	{Array<MessageActionRow>}	components
	 * The components of which specific ones should be disabled.
	 * @return {Array<MessageActionRow>}	The components with those corresponding to unempty spaces disabled.
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
