define(
	[],

	function () {
		var toBaseString = function (base) {
			// Creates a function to convert an integer
			// or a floating point value, which will be
			// rounded down to an integer, to a string
			// in the specified base

			// Supports up to base 16
			// Extend digits to increase support

			return function (a) {
				var i,
					string = '',
					inverseVals = [],
					digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

				if (a < 0) {
					a = -a;
					string += '-';
				}
				a = Math.floor(a);

				for (i = 1; a > 0; i++) {
					var b = a % (Math.pow(base, i));
					inverseVals.push(b / (Math.pow(base, i-1)));
					a -= b;
				}

				for (i = inverseVals.length - 1; i >= 0; i--) {
					string += digits[inverseVals[i]];
				}

				return string || digits[0];
			};
		};

		var toHexString = toBaseString(16);

		var ColourTools = {
			hexStringToRgb: function (originalHexString) {
				// Takes in the hex string of a colour and returns
				// that colour as an arrage of RGB values

				// For example, '#f00' becomes [255, 0, 0]

				var hexString = originalHexString,
					i, components = [];

				if (!hexString) {
					return;
				}

				if (/^#/.test(hexString)) {
					hexString = hexString.substr(1);
				}

				if (hexString.length === 1) {
					components = [
						hexString+hexString,
						hexString+hexString,
						hexString+hexString
					];
				} else if (hexString.length === 3) {
					components = [
						hexString.substr(0, 1) + hexString.substr(0, 1),
						hexString.substr(1, 1) + hexString.substr(1, 1),
						hexString.substr(2, 1) + hexString.substr(2, 1)
					];
				} else if (hexString.length === 6) {
					components = [
						hexString.substr(0, 2),
						hexString.substr(2, 2),
						hexString.substr(4, 2)
					];
				} else {
					console.error('Invalid hex string: ' + originalHexString);
				}

				for (i = 0; i < components.length; i++) {
					components[i] = (new Number('0x' + components[i])).valueOf();
				}

				return components;
			},

			rgbToHexString: function (r, g, b) {
				// Convert RGB values to a hex string for a colour
				// For example: 255, 0, 0 becomes '#f00'

				r = toHexString(r);
				g = toHexString(g);
				b = toHexString(b);

				r = r.length === 1 ? '0' + r : r;
				g = g.length === 1 ? '0' + g : g;
				b = b.length === 1 ? '0' + b : b;

				return '#' + r + g + b;
			},

			rgbToHsl: function (r, g, b) {
				// Convert RGB values to HSL

				r = r/255;
				g = g/255;
				b = b/255;

				var max = Math.max(r, g, b),
					min = Math.min(r, g, b);

				var h, s, l = (max + min) / 2;

				if (max === min) {
					h = s = 0;
				} else {
					var d = max - min;
					s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
					switch (max) {
						case r:
							h = (g - b) / d + (g < b ? 6 : 0);
							break;
						case b:
							h = (r - g) / d + 4;
							break;
						case g:
							h = (b - r) / d + 2;
							break;
					}
					h = h / 6;
				}

				return [h, s, l];
			},

			hslToRgb: function (h, s, l) {
				// Convert HSL values to RGB

				var r, g, b;

				if (s === 0) {
					r = g = b = l;
				} else {
					var hue2rgb = function (p, q, t) {
						if (t < 0) {
							t += 1;
						}
						if (t > 1) {
							t -= 1;
						}
						if (t < 1/6) {
							return p + (q - p) * 6 * t;
						}
						if (t < 1/2) {
							return q;
						}
						if (t < 2/3) {
							return p + (q - p) * (2/3 - t) * 6;
						}
						return p;
					};

					var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
					var p = 2 * l - q;
					r = hue2rgb(p, q, h + 1/3);
					g = hue2rgb(p, q, h);
					b = hue2rgb(p, q, h - 1/3);
				}

				return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
			},

			getAverage: function (image) {
				var $tempCanvas,
					tempContext,
					imageData,

					i, j,
					index, average,
					numPixels = 0,
					sumR = 0,
					sumG = 0,
					sumB = 0;


				// Get Image Data
				imageData = ColourTools.getImageData(image);

				// Apply transformation function to each pixel independently
				for (i = 0; i < image.width; i++) {
					for (j = 0; j < image.height; j++) {
						index = i*image.height*4 + j*4;

						if (imageData.data[index + 3]) {
							// Not 100% transparent
							numPixels += 1;
							sumR += imageData.data[index + 0];
							sumG += imageData.data[index + 1];
							sumB += imageData.data[index + 2];
						}
					}
				}

				average = [
					sumR / numPixels,
					sumG / numPixels,
					sumB / numPixels
				];

				return average;
			},

			getAverageHsl: function (image) {
				var rgb = ColourTools.getAverage(image);

				return ColourTools.rgbToHsl(rgb[0], rgb[1], rgb[2]);
			},

			_withTempContext: function (fn, width, height) {
				var $tempCanvas,
					tempContext,

					returnVal;

				$tempCanvas = $(
					'<canvas' +
					(width ? ' width="' + width + '"' : '') +
					(height ? ' height="' + height + '"' : '') +
					'>'
				);
				tempContext = $tempCanvas[0].getContext('2d');

				returnVal = fn(tempContext);

				$tempCanvas.remove();

				return returnVal;
			},

			getImageData: function (image) {
				// Use a temporary canvas to retrieve the imageData for an image

				var imageData = ColourTools._withTempContext(function (tempContext) {
					tempContext.drawImage(image, 0, 0);
					return tempContext.getImageData(0, 0, image.width, image.height);
				}, image.width, image.height);

				return imageData;
			},

			createImageData: function (imageData) {
				// Allow use of context.createImageData without requiring a context
				// Creates an empty ImageData with the same dimensions as the one passed in

				var newImageData = ColourTools._withTempContext(function (tempContext) {
					return tempContext.createImageData(imageData);
				});

				return newImageData;
			},

			transformImageData: function (imageData, transform) {
				// Accepts an imageData and a transform function
				// Returns a transformed ImageData

				// The transform function takes 4 arguments (r, g, b, a)
				// and returns a corresponding array [r, g, b, a]

				var transformedImageData = ColourTools.createImageData(imageData),
					i, transformedPixel;

				// Apply transformation function to each pixel independently
				for (i = 0; i < imageData.data.length - 3; i += 4) {
					transformedPixel = transform(
						imageData.data[i],
						imageData.data[i+1],
						imageData.data[i+2],
						imageData.data[i+3]
					);

					for (k = 0; k < 4; k++) {
						transformedImageData.data[i+k] = transformedPixel[k];
					}
				}

				return transformedImageData;
			},

			drawImageData: function (context, imageData, width, height) {
				// Draw an ImageData on a canvas without using
				// putImageData, as that erases everything else

				// Do this by creating a temporary canvas, using
				// putImageData on it, then drawing it on the
				// original canvas as an image

				var $tempCanvas = $('<canvas width="' + width + '" height="' + height + '">'),
					tempContext = $tempCanvas[0].getContext('2d');

				tempContext.putImageData(imageData, 0, 0);

				context.drawImage($tempCanvas[0], 0, 0);

				$tempCanvas.remove();
			}
		};

		return ColourTools;
	}
);