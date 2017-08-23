define(
	[],

	function () {

		var defaults = {
			name: 'New Item',
			description: '',
			weight: 0,
			quantity: 1
		};

		var InventoryItem = function (options) {
			options = options || {};

			this.name = options.name || defaults.name;
			this.description = options.description || defaults.description;
			this.weight = options.weight || defaults.weight;
			this.quantity = options.quantity || defaults.quantity;
		};

		return InventoryItem;

	}
);