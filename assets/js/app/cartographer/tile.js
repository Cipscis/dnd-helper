define(
	[
	],

	function (
	) {

		var defaults = {
			colour: '#000000'
		};

		var Tile = function (options) {
			var prop;

			for (prop in options) {
				if (options.hasOwnProperty(prop)) {
					this[prop] = options[prop];
				}
			}

			for (prop in defaults) {
				if (defaults.hasOwnProperty(prop)) {
					if (typeof this[prop] === 'undefined') {
						this[prop] = defaults[prop];
					}
				}
			}
		};

		Tile.prototype.draw = function (context, x, y, tileSize, gridGutter) {
			context.save();

			context.fillStyle = this.colour;

			context.translate(x * tileSize, y * tileSize);
			context.fillRect(0, 0, (tileSize-gridGutter), (tileSize-gridGutter));

			context.restore();
		};

		return Tile;

	}
);