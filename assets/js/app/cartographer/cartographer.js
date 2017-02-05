define(
	[
		'jquery',

		'cartographer/tile',

		'util/fileIO'
	],

	function (
		$,

		Tile,

		fileIO
	) {

		var canvas,
			context,
			tileSize = 20,
			tiles,

			firstTileX,
			firstTileY,
			mousedown = -1;

		var Cartographer = {
			init: function () {
				Cartographer._initContext();
				Cartographer._initTiles();
				Cartographer._initRendering();

				Cartographer._initEvents();
			},

			_initContext: function () {
				canvas = $('.js-cartographer__canvas')[0];
				context = canvas.getContext('2d');
			},

			_initTiles: function (options) {
				var tilesX = Math.floor(canvas.width / tileSize),
					tilesY = Math.floor(canvas.height / tileSize),

					x, y;

				tiles = [];
				for (x = 0; x < tilesX; x++) {
					tiles[x] = [];
					for (y = 0; y < tilesY; y++) {
						if (options && (x in options) && (y in options[x])) {
							tiles[x][y] = new Tile(options[x][y]);
						} else {
							tiles[x][y] = new Tile();
						}
					}
				}

				window.tiles = tiles;
			},

			///////////////
			// RENDERING //
			///////////////
			_initRendering: function () {
				Cartographer._startDrawing(Cartographer._drawFrame, 100, 50000);
			},

			_startDrawing: function (callback, maxDt, inactiveTimeout) {
				var time = 0;

				var doCallback = function (timestamp) {
					var dt = time ? (timestamp - time)/1000 : 0;

					time = timestamp;

					if (inactiveTimeout && dt > inactiveTimeout) {
						dt = 0;
					} else if (maxDt && dt > maxDt) {
						dt = maxDt;
					}

					callback(dt);

					requestAnimationFrame(doCallback);
				};

				requestAnimationFrame(doCallback);
			},

			_drawFrame: function (dt) {
				Cartographer._clear();
				Cartographer._drawTiles(dt);
			},

			_clear: function () {
				context.clearRect(0, 0, canvas.width, canvas.height);
			},

			_drawTiles: function (dt) {
				var x, y;

				for (x = 0; x < tiles.length; x++) {
					for (y = 0; y < tiles[x].length; y++) {
						tiles[x][y].draw(context, x, y, tileSize);
					}
				}
			},

			/////////////////
			// INTERACTION //
			/////////////////
			_initEvents: function () {
				$(document).on('mousedown', '.js-cartographer__canvas', Cartographer._mousedownEvent);
				$(document).on('mousemove', '.js-cartographer__canvas', Cartographer._mousemoveEvent);
				$(document).on('mouseup mouseout', '.js-cartographer__canvas', Cartographer._mouseupEvent);

				$(document).on('contextmenu', '.js-cartographer__canvas', Cartographer._preventEvent);

				$(document).on('click', '.js-cartographer__save-image', Cartographer._saveImageEvent);
				$(document).on('click', '.js-cartographer__save-json', Cartographer._saveJsonEvent);
				$(document).on('click', '.js-cartographer__load-json', Cartographer._loadJsonEvent);
			},

			_mousedownEvent: function (e) {
				e.preventDefault();

				var x = e.offsetX,
					y = e.offsetY,

					tile;

				x = Math.floor(x / tileSize);
				y = Math.floor(y / tileSize);

				tile = tiles[x][y];

				mousedown = e.button;
				firstTileX = x;
				firstTileY = y;

				Cartographer._mousemoveEvent(e);
			},

			_mousemoveEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY,

					minX, maxX,
					minY, maxY,

					i, j,

					colours = {
						0: $('.js-cartographer__colour-primary').val(), // Left
						2: $('.js-cartographer__colour-secondary').val() // Right
					};

				if (mousedown === -1) {
					return;
				}

				x = Math.floor(x / tileSize);
				y = Math.floor(y / tileSize);

				minX = Math.min(x, firstTileX);
				maxX = Math.max(x, firstTileX);

				minY = Math.min(y, firstTileY);
				maxY = Math.max(y, firstTileY);

				for (x = 0; x < tiles.length; x++) {
					for (y = 0; y < tiles[x].length; y++) {
						if (tiles[x][y].oldColour) {
							tiles[x][y].colour = tiles[x][y].oldColour;
						}
					}
				}

				for (x = minX; x <= maxX; x++) {
					for (y = minY; y <= maxY; y++) {
						if (!tiles[x][y].oldColour) {
							tiles[x][y].oldColour = tiles[x][y].colour;
						}
						tiles[x][y].colour = colours[mousedown];
					}
				}
			},

			_mouseupEvent: function (e) {
				mousedown = -1;
				firstTileX = firstTileY = undefined;

				Cartographer._wipeOldColour();
			},

			_wipeOldColour: function () {
				var x, y;

				for (x = 0; x < tiles.length; x++) {
					for (y = 0; y < tiles[x].length; y++) {
						delete tiles[x][y].oldColour;
					}
				}
			},

			_preventEvent: function (e) {
				e.preventDefault();
			},

			//////////
			// SAVE //
			//////////
			_saveImageEvent: function (e) {
				Cartographer._saveImage();
			},

			_saveImage: function () {
				window.open(canvas.toDataURL('image/png'));
			},

			_saveJsonEvent: function (e) {
				Cartographer._saveJson();
			},

			_saveJson: function () {
				var data = {};

				data.tiles = tiles;
				data.tileSize = tileSize;

				fileIO.saveJson(data, 'New Map');
			},

			//////////
			// LOAD //
			//////////
			_loadJsonEvent: function (e) {
				var $loadJsonFile = $('.js-cartographer__load-json-file');

				$loadJsonFile.trigger('click');

				// Run _loadJsonChangeEvent once a file has been selected
				$loadJsonFile.one('change', Cartographer._loadJsonChangeEvent);
			},

			_loadJsonChangeEvent: function (e) {
				var file = e.target.files[0],
					reader = new FileReader();

				reader.onload = Cartographer._loadJsonReadEvent;
				reader.readAsText(file);
			},

			_loadJsonReadEvent: function (e) {
				var reader = e.target,
					data;

				if (reader.readyState === 2) {
					// DONE
					try {
						data = JSON.parse(reader.result);

						Cartographer._loadFromJson(data);
					} catch (error) {
						console.error(error);
					}
				}
			},

			_loadFromJson: function (data) {
				var x, y;

				tileSize = data.tileSize;
				Cartographer._initTiles(data.tiles);
			}
		};

		return Cartographer;

	}
);