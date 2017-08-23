define(
	[
		'jquery'
	],

	function ($) {
		var defaults = {
			tileSize: 10,

			scale: 1,
			panX: 0,
			panY: 0,

			image: '/assets/images/combat/field.jpg'
		};

		var Battlefield = function (options) {
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

			if (typeof this.image === 'string') {
				var img = new Image();
				img.src = this.image;

				this.image = img;
			}

			this.canvas = this.canvas || document.createElement('canvas');
			this.context = this.canvas.getContext('2d');
		};

		/************\
		| TRANSFORMS |
		\************/
		Battlefield.prototype.pan = function (x, y) {
			this.panX += x;
			this.panY += y;
		};

		Battlefield.prototype.panTo = function (x, y) {
			this.panX = x;
			this.panY = y;
		};

		Battlefield.prototype.zoom = function (z) {
			this.scale *= z;

			if (this.scale > 0.95 && this.scale < 1.05) {
				// Reset in case of accumulated rounding error
				this.scale = 1;
			}
		};

		Battlefield.prototype.zoomTo = function (z) {
			this.scale = z;
		};

		Battlefield.prototype.getComputedPanX = function () {
			return this.panX*this.scale - ((this.scale-1) * this.canvas.width/2);
		};

		Battlefield.prototype.getComputedPanY = function () {
			return this.panY*this.scale - ((this.scale-1) * this.canvas.height/2);
		};

		Battlefield.prototype.transform = function () {
			this.context.setTransform(this.scale, 0, 0, this.scale, this.getComputedPanX(), this.getComputedPanY());
		};

		Battlefield.prototype.resetTransform = function () {
			this.context.resetTransform();
		};

		/***********\
		| RENDERING |
		\***********/
		Battlefield.prototype.clear = function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		};

		Battlefield.prototype.drawField = function (dt) {
			this.context.drawImage(this.image, 0, 0);
		};

		return Battlefield;
	}
);