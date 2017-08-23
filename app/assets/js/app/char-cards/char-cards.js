define(
	[
		'jquery',
		'templayed',

		'util/fileIO',
		'util/colour-tools',

		'app/char-cards/pixel-transforms'
	],

	function ($, templayed, fileIO, ColourTools, Transforms) {

		var CharCards;

		CharCards = {
			init: function () {
				CharCards._initEvents();
				CharCards._initCharCards();
			},

			_initEvents: function () {
				$(document).on('change', '.js-char-card__colour', CharCards._processColourChange);
				$(document).on('click', '.js-char-card__save', CharCards._save);
			},

			_processColourChange: function (e) {
				// When a colour input is changed, update
				// that layer's colour and redraw layers

				var $colour = $(e.target).closest('.js-char-card__colour'),
					colour = $colour.val(),

					$card = $colour.closest('.js-char-card'),

					layerName = $colour.data('char-card-layer-name'),
					layers = $card.data('char-card-data').layers,
					i, layer;

				for (i = 0; i < layers.length; i++) {
					layer = layers[i];
					if (layer.name === layerName) {
						break;
					}
				}

				layer.colour = colour;

				CharCards._drawLayers($card);
			},

			_save: function (e) {
				// Construct a JSON Blob of the card and download it

				var $save = $(e.target).closest('.js-char-card__save'),
					$card = $save.closest('.js-char-card'),

					data = $card.data('char-card-data');

				data.name = $card.find('.js-char-card__name').text();
				data.description = $card.find('.js-char-card__description').text();

				fileIO.saveJson(data, data.name || 'Char Card');
			},

			_initCharCards: function () {
				var $charCards = $('.js-char-card');

				$charCards.each(CharCards._initCharCard);
			},

			_initCharCard: function () {
				// Initialise canvas, load data, and do initial render

				var $card = $(this),
					$canvas = $card.find('.js-char-card__portrait'),
					context = $canvas[0].getContext('2d'),

					dataUrl = $card.data('char-card-data-url');

				// Initialise canvas data values
				$card.data('canvas', $canvas[0]);
				$card.data('context', context);

				// Load the data for the card,
				// then draw everything on its canvas
				$.ajax({
					url: dataUrl,
					dataType: 'json',
					success: CharCards._dataLoaded.bind($card)
				});
			},

			_dataLoaded: function (data, responseCode) {
				// Load the image for each of a card's layers,
				// then draw them all on its canvas

				var $card = this,
					layers = data.layers,

					i, layer,
					layersToLoad = layers.length,

					layerLoaded = function () {
						layersToLoad -= 1;
						if (layersToLoad <= 0) {
							CharCards._layersLoaded($card, data);
						}
					};

				// Render details
				CharCards._renderCardDetails($card, data);

				// Load layer images
				for (i = 0; i < layers.length; i++) {
					layers[i].image = new Image();
					layers[i].image.src = layers[i].src;
					layers[i].image.onload = layerLoaded;
				}
			},

			_renderCardDetails: function ($card, data) {
				var $template = $('.js-char-card__details-template'),
					$details = $card.find('.js-char-card__details');

				$details.html(templayed($template.html())(data));
			},

			_layersLoaded: function ($card, data) {
				// Initialise card's layers data,
				// then draw all the layers on the card's canvas

				var $template = $('.js-char-card__controls-template'),
					$controls = $card.find('.js-char-card__controls'),

					i, layer, rgb;

				for (i = 0; i < data.layers.length; i++) {
					layer = data.layers[i];

					// Uncomment this for finding a layer's colour
					/* if (!layer.colour) {
						// If the layer doesn't have a colour, initialise
						// layer colour as average of the layer's image

						rgb = ColourTools.getAverage(layer.image);
						layer.colour = ColourTools.rgbToHexString(rgb[0], rgb[1], rgb[2]);
					} /**/
				}

				// Render controls
				$controls.html(templayed($template.html())(data));

				$card.data('char-card-data', data);

				CharCards._drawLayers($card);
			},

			_drawLayers: function ($card) {
				// Draw all a card's layers in order on its canvas

				var canvas = $card.data('canvas'),
					context = $card.data('context'),
					layers = $card.data('char-card-data').layers,
					i, layer;

				context.clearRect(0, 0, canvas.width, canvas.height);

				for (i = 0; i < layers.length; i++) {
					layer = layers[i];
					CharCards._drawLayer($card, layer);
				}
			},

			_drawLayer: function ($card, layer) {
				// Draw a layer object onto a card's canavs

				var context = $card.data('context'),
					image, imageData,
					transformedImageData, averageL,
					colour = $card.data('char-card-colour') || layer.colour;

				if (typeof colour === 'string') {
					colour = ColourTools.hexStringToRgb(colour);
				}

				image = layer.image;

				if (colour) {
					imageData = ColourTools.getImageData(image);
					averageL = ColourTools.getAverageHsl(image)[2];

					transformedImageData = ColourTools.transformImageData(imageData, Transforms.colouriseWithLOffset(averageL)(colour));
					ColourTools.drawImageData($card.data('context'), transformedImageData, image.width, image.height);
				} else {
					context.drawImage(image, 0, 0);
				}
			}
		};

		return CharCards;

	}
);