define(
	[
		'app/loot-list/enums'
	],

	function (Enums) {

		var Item = function (options) {
			this.name = options.name || 'Unnamed Item';
			this.rarity = options.rarity || Enums.RARITY.COMMON;
			this.tags = options.tags || [];
		};

		Item.prototype.getRarity = function (tagRarity) {
			var i, tag,
				rarity;

			rarity = this.rarity;

			// Modify item rarity by relative rarity of its tags
			if (tagRarity) {
				for (i = 0; i < this.tags.length; i++) {
					tag = this.tags[i];

					if (tag in tagRarity) {
						rarity = rarity * tagRarity[tag];
					}
				}
			}

			return rarity;
		};

		return Item;

	}
);