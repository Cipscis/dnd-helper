define(
	[
		'jquery'
	],

	function ($) {
		var defaults = {
			name: 'New Combatant',
			initiative: '10',
			description: '',
			team: 'enemy',

			x: 0,
			y: 0
		};

		var teamColours = {
			player: '#00f',
			enemy: '#f00'
		};

		var Combatant = function (options) {
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

			this.counters = this.counters || [];

			this.hasHp = !!this.hp;

			if (this.image) {
				this.initImage();
			} else if (!this.colour) {
				this.colour = teamColours[this.team];
			}
		};

		Combatant.prototype.initImage = function () {
			var $image = $('<img />');

			$image.attr('src', this.image);

			this.image = $image[0];
		};

		Combatant.prototype.draw = function (ctx, dt, tileSize) {
			ctx.save();

			ctx.translate(this.x * tileSize, this.y * tileSize);

			if (this.image) {
				ctx.drawImage(this.image, 0, 0, tileSize, tileSize);
			} else {
				ctx.fillStyle = this.colour;
				ctx.strokeStyle = '#000';
				ctx.beginPath();
				ctx.arc(tileSize/2, tileSize/2, tileSize/3, 0, Math.PI*2);
				ctx.fill();
				ctx.stroke();
			}

			ctx.restore();
		};

		Combatant.prototype.moveTo = function (x, y) {
			this.x = x;
			this.y = y;
		};

		return Combatant;
	}
);