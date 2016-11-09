define(
	[],

	function () {

		var List = function (options) {
			this.items = options.items || [];
			this.tagRarity = options.tagRarity || {};
			this.size = options.size || 100;

			this.rarityTable = this.createRarityTable();
			this.rollTable = this.createRollTable();
		};

		List.prototype.createRarityTable = function () {
			var i, item,
				table = [];

			for (i = 0; i < this.items.length; i++) {
				item = this.items[i];

				table[i] = {
					item: item,
					rarity: item.getRarity(this.tagRarity)
				};
			}

			return table;
		};

		List.prototype.createRollTable = function () {
			// Converts a list of x items each with its
			// own rarity into a table of length n containing
			// either all those items or a subset, according
			// to their relative rarities

			var i, j,

				total = 0,
				item, size,
				chance, chanceSuccess,
				dirtySize, numToCorrect,

				sizes = [],
				rollTable = [];

			for (i = 0; i < this.rarityTable.length; i++) {
				item = this.rarityTable[i];

				total += item.rarity;
			}

			for (i = 0; i < this.rarityTable.length; i++) {
				item = this.rarityTable[i];

				// Apply weighting
				// Split into size - number of guaranteed space
				// and chance - left over value used to calculate
				// whether or not this item gets a bonus space

				size = item.rarity / total * this.size;
				chance = size % 1;
				size = Math.floor(size);

				// Apply bonus spaces
				// Each item has a chance for a bonus space depending
				// on its weighting value. For example, 1.9 means
				// 1 guaranteed space and a 90% chance of a bonus space

				// This will prevent rounding from creating lists
				// that have any length from 0 to 2n, but will not
				// guarantee that lists have length n

				// It also delegates some of the randomness from
				// the die roll to when the table is being built.
				// The same table will be different if built again.

				chanceSuccess = Math.random() < chance;
				if (chanceSuccess) {
					size += 1;
				}

				// probability is the chance of getting this result,
				// using negative numbers to indicate failure.
				// It's used for cleaning up the table to be the correct size
				sizes.push({
					name: item.item.name,
					size: size,
					probability: chanceSuccess ? chance : chance-1
				});
			}

			// Clean up sizes by altering the most unlikely outcomes
			// until the total matches the prescribed size of the table
			dirtySize = sizes.reduce(function (sum, o) {
				return sum + o.size;
			}, 0);

			if (dirtySize != this.size) {
				var unlikelySizes = [];
				for (i = 0; i < sizes.length; i++) {
					if (dirtySize < this.size) {
						// Table is too small, so reverse failures
						if (sizes[i].probability < 0) {
							unlikelySizes.push(sizes[i]);
						}
					} else {
						// Table is too large, so reverse successes
						if (sizes[i].probability > 0) {
							unlikelySizes.push(sizes[i]);
						}
					}
				}

				// First, randomise the order of unlikelySizes.
				// This ensures the relative positions of items
				// with equal probabilities are independent of
				// their initial positions

				// Durstenfeld shuffle algorithm
				for (i = unlikelySizes.length - 1; i > 0; i--) {
					var newIndex = Math.floor(Math.random() * (i + 1));
					var temp = unlikelySizes[i];
					unlikelySizes[i] = unlikelySizes[newIndex];
					unlikelySizes[newIndex] = temp;
				}

				unlikelySizes.sort(function (a, b) {
					return Math.abs(a.probability) - Math.abs(b.probability);
				});

				// Reverse as many unlikely results as necessary to get the
				// table to the prescribed size.
				// As it's altering the attributes of objects also stored in
				// the sizes array, this will affect the final result
				numToCorrect = Math.abs(dirtySize - this.size);
				for (i = 0; i < numToCorrect; i++) {
					if (dirtySize < this.size) {
						unlikelySizes[i].size += 1;
					} else {
						unlikelySizes[i].size -= 1;
					}

					unlikelySizes[i].probability = 1-unlikelySizes[i].probability;
				}
			}

			// this.rarityTable and sizes should have the same length
			for (i = 0; i < sizes.length; i++) {
				item = this.rarityTable[i];

				for (j = 0; j < sizes[i].size; j++) {
					rollTable.push(item.item);
				}
			}

			return rollTable;
		};

		return List;

	}
);