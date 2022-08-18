const general = {
	capitalizeFirst: function(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	matchPercentage: function(str1, str2) {
		let longer = str1.toLowerCase();
		let shorter = str2.toLowerCase();
		if (str1.length < str2.length) {
			longer = str2;
			shorter = str1;
		}
		const longerLength = longer.length;
		if (longerLength == 0) {
			return 1.0;
		}

		const costs = new Array();
		for (let i = 0; i <= longer.length; i++) {
			let lastValue = i;
			for (let j = 0; j <= shorter.length; j++) {
				if (i == 0) { costs[j] = j; }
				else if (j > 0) {
					let newValue = costs[j - 1];
					if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
						newValue = Math.min(Math.min(newValue, lastValue),
							costs[j]) + 1;
					}
					costs[j - 1] = lastValue;
					lastValue = newValue;
				}
			}
			if (i > 0) { costs[shorter.length] = lastValue; }
		}

		return (longerLength - costs[shorter.length]) / parseFloat(longerLength);
	},
};
exports.generalStrHnd = general;