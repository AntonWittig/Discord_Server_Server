// #region GENERAL
const general = {
	/**
	 * Calculate a random integer between two given integers.
	 * @param	{Integer}	min
	 * The minimum integer to calculate the random integer between.
	 * @param	{Integer}	max
	 * The maximum integer to calculate the random integer between.
	 * @returns	{Integer}	The random integer.
	 */
	randInt: function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	},

	/**
	 * Calculate a random float between zero and the maximum number.
	 * @returns	{Float}	The random float.
	 */
	randMax: function() {
		return Math.random() * Number.MAX_VALUE;
	},

	/**
	 * Pick a random element from an array.
	 * @param	{Array<T>}				array
	 * The array to pick a random element from.
	 * @param	{(Integer) => Integer}	randFnct
	 * The function to use to calculate the random index.
	 * @returns	{T}					T	he random element.
	 */
	randFromArray: function(array, randFnct = undefined) {
		// Check if a random function has been provided
		if (randFnct) {
			return array[randFnct(array.length)];
		}
		// Return a random element from the array
		else {
			return array[Math.floor(Math.random() * array.length)];
		}
	},
};
exports.generalRndHnd = general;
// #endregion