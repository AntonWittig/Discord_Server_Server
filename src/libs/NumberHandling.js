// #region GENERAL
const generalVars = {
	// Roman numbers mapped to their arabic counterparts
	romanToArabic: {
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
	},
};

const general = {
	/**
	 * This function converts arabic numbers values to roman numbers.
	 * @param	{Integer}	num
	 * The arabic number to convert
	 * @returns	{String}	The roman number representation
	 */
	romanizeArabic: function(num) {
		// Initialize the roman number
		let roman = "";
		if (num) {
			// Loop through the roman numbers
			for (const [key, value] of Object.entries(generalVars.romanToArabic)) {
				// Add the current roman number to the result if the arabic number is divisible by the roman number's arabic counterpart
				while (num >= value) {
					roman += key;
					num -= value;
				}
			}
		}
		// Return the arabic zero as a "roman zero"
		else if (num === 0) { roman = "0"; }
		return roman;
	},
};
exports.generalNumHnd = general;
// #endregion
