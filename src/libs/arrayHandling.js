// #region GENERAL
const general = {
	/**
	 * This function reorders any array by a given order. If the order contains an index that is out of range of the array or doesn't contain an index at all, drop the referenced array element from the ordered array.
	 * @param	{Array<T>}			array
	 * The array to reorder.
	 * @param	{Array<Integer>}	order
	 * The order to reorder the array by. Contains integer-index-pointers to elements of the array to reorder.
	 * @returns {Array<T>}			The reordered array.
	 */
	reorderByArray: function(array, order) {
		// Initialize the reordered array
		const orderedArray = [];
		// Loop through the order
		for (let i = 0; i < order.length; i++) {
			// Ignore indices that are out of range of the array
			if (order[i] < 0 || order[i] >= array.length) continue;
			// Add the element to the reordered array
			orderedArray.push(array[order[i]]);
		}
		return orderedArray;
	},
};
exports.generalArrHnd = general;
// #endregion