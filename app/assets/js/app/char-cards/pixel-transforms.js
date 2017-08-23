define(
	[
		'util/colour-tools'
	],

	function (ColourTools) {
		return {
			identity: function (r, g, b, a) {
				// Identity transform: change nothing

				return [r, g, b, a];
			},
			invert: function (r, g, b, a) {
				// Invert r, g, b

				return [255-r, 255-g, 255-b, a];
			},
			greyscale: function (r, g, b, a) {
				// Convert r, g, and b to the average of all 3 values

				var average = (r + g + b) / 3;

				return [average, average, average, a];
			},
			colourFilter: function (filterR, filterG, filterB) {
				// Apply a colour filter,
				// like holding up cellophane in front

				if (filterR instanceof Array) {
					filterB = filterR[2];
					filterG = filterR[1];
					filterR = filterR[0];
				}

				return function (r, g, b, a) {
					return [r*filterR/255, g*filterG/255, b*filterB/255, a];
				};
			},
			colourise: function (colourR, colourG, colourB) {
				// Override hue and saturation,
				// apply luminosity by multiplying
				// them together then dividing by
				// the average of possible values

				if (colourR instanceof Array) {
					colourB = colourR[2];
					colourG = colourR[1];
					colourR = colourR[0];
				}

				var colourHsl = ColourTools.rgbToHsl(colourR, colourG, colourB),
					h = colourHsl[0],
					s = colourHsl[1];

				return function (r, g, b, a) {
					var hsl = ColourTools.rgbToHsl(r, g, b),
						l = hsl[2] * colourHsl[2] / 0.5,

						rgb = ColourTools.hslToRgb(h, s, l);

					r = rgb[0];
					g = rgb[1];
					b = rgb[2];

					return [r, g, b, a];
				};
			},
			colouriseWithLOffset: function (baseL) {
				return function (colourR, colourG, colourB) {
					// Override hue and saturation,
					// apply luminosity by maintaining
					// a constant offset from a given value

					if (colourR instanceof Array) {
						colourB = colourR[2];
						colourG = colourR[1];
						colourR = colourR[0];
					}

					var colourHsl = ColourTools.rgbToHsl(colourR, colourG, colourB),
						h = colourHsl[0],
						s = colourHsl[1];

					return function (r, g, b, a) {
						var hsl = ColourTools.rgbToHsl(r, g, b),
							l = hsl[2] - baseL + colourHsl[2],

							rgb = ColourTools.hslToRgb(h, s, l);

						r = rgb[0];
						g = rgb[1];
						b = rgb[2];

						return [r, g, b, a];
					};
				};
			},
			hueShift: function (amount) {
				return function (r, g, b, a) {
					var hsl = ColourTools.rgbToHsl(r, g, b),
						hue = hsl[0] + amount % 1,
						rgb = ColourTools.hslToRgb(hue, hsl[1], hsl[2]);

					return [rgb[0], rgb[1], rgb[2], a];
				};
			}
		};
	}
);