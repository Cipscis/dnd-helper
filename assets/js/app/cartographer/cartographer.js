define(
	[
		'jquery',

		'cartographer/tile',

		'util/fileIO',
		'util/keybinding'
	],

	function (
		$,

		Tile,

		fileIO,
		keybinding
	) {

		var canvas,
			context,
			tileSize = $('.cartographer__tile-size').val() || 20,
			gridGutter = $('.cartographer__grid-gutter').val() || 1,

			tiles,
			history = [],
			historyPosition = 0,
			maxHistoryLength = 20,

			firstTileX,
			firstTileY,
			mousedown = -1;

		var Cartographer = {
			init: function () {
				Cartographer._initContext();
				Cartographer._setCanvasSize();
				Cartographer._initRendering();

				Cartographer._initEvents();
				Cartographer._initKeybinding();
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

				Cartographer._updateHistory();
			},

			//////////////////
			// COLOUR TOOLS //
			//////////////////

			_makeFullHex: function (colour) {
				if (/^#[0-9a-f]{3}$/.test(colour)) {
					colour = colour.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3');
				}

				return colour;
			},

			_isSameColour: function (colourA, colourB) {
				if (colourA === colourB) {
					return true;
				}

				// Convert values like #000 to full #000000
				colourA = Cartographer._makeFullHex(colourA);
				colourB = Cartographer._makeFullHex(colourB);

				if (colourA === colourB) {
					return true;
				}
			},

			/////////////////
			// INTERACTION //
			/////////////////
			_initEvents: function () {
				$(document).on('mousedown', '.js-cartographer__canvas', Cartographer._mousedownEvent);
				$(document).on('mousemove', '.js-cartographer__canvas', Cartographer._mousemoveEvent);
				$(document).on('mouseup mouseout', '.js-cartographer__canvas', Cartographer._mouseupEvent);

				// Prevent context menu so right click can be used for other things
				$(document).on('contextmenu', '.js-cartographer__canvas', Cartographer._preventEvent);

				$(document).on('click', '.js-cartographer__save-image', Cartographer._saveImageEvent);
				$(document).on('click', '.js-cartographer__save-json', Cartographer._saveJsonEvent);
				$(document).on('click', '.js-cartographer__load-json', Cartographer._loadJsonEvent);

				$(document).on('change', '.js-cartographer__grid-gutter', Cartographer._gridGutterChangeEvent);
				$(document).on('change', '.js-cartographer__tile-size', Cartographer._tileSizeChangeEvent);
				$(document).on('change', '.js-cartographer__canvas-width, .js-cartographer__canvas-height', Cartographer._canvasSizeChangeEvent);

				$(document).on('click', '.js-cartographer__undo', Cartographer._undo);
				$(document).on('click', '.js-cartographer__redo', Cartographer._redo);
			},

			_initKeybinding: function () {
				keybinding.bindKey('Z', Cartographer._undo, true);
				keybinding.bindKey('Y', Cartographer._redo, true);

				keybinding.bindKey('S', Cartographer._saveJsonEvent, true);
				keybinding.bindKey('L', Cartographer._loadJsonEvent, true);

				keybinding.bindKey('R', Cartographer._selectRectangleTool);
				keybinding.bindKey('I', Cartographer._selectColourPickerTool);
				keybinding.bindKey('F', Cartographer._selectFillTool);
			},

			_mousedownEvent: function (e) {
				e.preventDefault();

				mousedown = e.button;

				if ($('.js-cartographer__tool-rectangle').is(':checked')) {
					Cartographer._rectangleMouseDownEvent(e);
				} else if ($('.js-cartographer__tool-colour-picker').is(':checked')) {
					Cartographer._colourPickerMouseDownEvent(e);
				} else if ($('.js-cartographer__tool-fill').is(':checked')) {
					Cartographer._fillMouseDownEvent(e);
				} else if ($('.js-cartographer__tool-replace').is(':checked')) {
					Cartographer._replaceMouseDownEvent(e);
				}
			},

			_mousemoveEvent: function (e) {
				if ($('.js-cartographer__tool-rectangle').is(':checked')) {
					Cartographer._rectangleMouseMoveEvent(e);
				}
			},

			_mouseupEvent: function (e) {
				if (mousedown !== -1) {
					mousedown = -1;
					if ($('.js-cartographer__tool-rectangle').is(':checked')) {
						Cartographer._rectangleMouseUpEvent(e);
					}
				}
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

			_getTileFromEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY,

					tile;

				x = Math.floor(x / tileSize);
				y = Math.floor(y / tileSize);

				tile = tiles[x][y];

				return tile;
			},

			////////////////////
			// TOOL SELECTION //
			////////////////////
			_selectRectangleTool: function (e) {
				$('.js-cartographer__tool-rectangle').trigger('click');
			},
			_selectColourPickerTool: function (e) {
				$('.js-cartographer__tool-colour-picker').trigger('click');
			},
			_selectFillTool: function (e) {
				$('.js-cartographer__tool-fill').trigger('click');
			},

			////////////////////
			// RECTANGLE TOOL //
			////////////////////
			_rectangleMouseDownEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY;

				x = Math.floor(x / tileSize);
				y = Math.floor(y / tileSize);

				firstTileX = x;
				firstTileY = y;

				Cartographer._rectangleMouseMoveEvent(e);
			},

			_rectangleMouseMoveEvent: function (e) {
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

			_rectangleMouseUpEvent: function (e) {
				firstTileX = firstTileY = undefined;

				Cartographer._wipeOldColour();
				Cartographer._updateHistory();
			},

			////////////////////////
			// COLOUR PICKER TOOL //
			////////////////////////
			_colourPickerMouseDownEvent: function (e) {
				var tile = Cartographer._getTileFromEvent(e),
					button = e.button,
					colour = Cartographer._makeFullHex(tile.colour);

				if (button === 0) {
					// Left click
					$('.js-cartographer__colour-primary').val(colour);
				} else if (button === 2) {
					// Right click
					$('.js-cartographer__colour-secondary').val(colour);
				}
			},

			///////////////
			// FILL TOOL //
			///////////////
			_fillMouseDownEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY,
					i, j,

					tile = Cartographer._getTileFromEvent(e),
					colourToMatch = tile.colour,
					tileGroup = [],

					frontier = [],
					currentTile,
					checkedTiles = [],

					colours = {
						0: $('.js-cartographer__colour-primary').val(), // Left
						2: $('.js-cartographer__colour-secondary').val() // Right
					};

				x = Math.floor(x / tileSize);
				y = Math.floor(y / tileSize);

				for (i = 0; i < tiles.length; i++) {
					checkedTiles.push([]);
					for (j = 0; j < tiles[i].length; j++) {
						checkedTiles[i].push(false);
					}
				}

				// Build tile group
				checkedTiles[x][y] = true;

				frontier = [{
					tile: tile,
					x: x,
					y: y
				}];
				while (frontier.length) {
					currentTile = frontier[0].tile;
					x = frontier[0].x;
					y = frontier[0].y;

					// Check if this tile should be added to the tileGroup
					if (Cartographer._isSameColour(currentTile.colour, colourToMatch)) {
						tileGroup.push(currentTile);

						// If the tile matches, use it to expand the frontier
						if ((x-1) in tiles) {
							if (!checkedTiles[x-1][y]) {
								checkedTiles[x-1][y] = true;
								frontier.push({
									tile: tiles[x-1][y],
									x: x-1,
									y: y
								});
							}
						}
						if ((x+1) in tiles) {
							if (!checkedTiles[x+1][y]) {
								checkedTiles[x+1][y] = true;
								frontier.push({
									tile: tiles[x+1][y],
									x: x+1,
									y: y
								});
							}
						}
						if ((y-1) in tiles[x]) {
							if (!checkedTiles[x][y-1]) {
								checkedTiles[x][y-1] = true;
								frontier.push({
									tile: tiles[x][y-1],
									x: x,
									y: y-1
								});
							}
						}
						if ((y+1) in tiles[x]) {
							if (!checkedTiles[x][y+1]) {
								checkedTiles[x][y+1] = true;
								frontier.push({
									tile: tiles[x][y+1],
									x: x,
									y: y+1
								});
							}
						}
					}

					// Remove 0th element from frontier
					frontier.splice(0, 1);
				}

				// Paint all tiles in the group
				for (i = 0; i < tileGroup.length; i++) {
					tileGroup[i].colour = colours[e.button];
				}

				Cartographer._updateHistory();
			},

			//////////////////
			// REPLACE TOOL //
			//////////////////
			_replaceMouseDownEvent: function (e) {
				var i, j,

					tile = Cartographer._getTileFromEvent(e),
					colourToMatch = tile.colour,

					colours = {
						0: $('.js-cartographer__colour-primary').val(), // Left
						2: $('.js-cartographer__colour-secondary').val() // Right
					};

				// Paint all tiles in the group
				for (i = 0; i < tiles.length; i++) {
					for (j = 0; j < tiles[i].length; j++) {
						if (tiles[i][j].colour === colourToMatch) {
							tiles[i][j].colour = colours[e.button];
						}
					}
				}

				Cartographer._updateHistory();
			},

			/////////////////////
			// CANVAS SETTINGS //
			/////////////////////
			_canvasSizeChangeEvent: function (e) {
				Cartographer._setCanvasSize();
			},

			_setCanvasSize: function () {
				var $width = $('.js-cartographer__canvas-width'),
					$height = $('.js-cartographer__canvas-height'),

					width = $width.val() || 100,
					height = $height.val() || 100;

				canvas.width = width*tileSize;
				canvas.height = height*tileSize;

				Cartographer._initTiles(tiles);
			},

			_gridGutterChangeEvent: function (e) {
				gridGutter = $('.js-cartographer__grid-gutter').val();
			},

			_tileSizeChangeEvent: function (e) {
				tileSize = $('.js-cartographer__tile-size').val();
				Cartographer._setCanvasSize();
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

			_saveJsonEvent: function () {
				var data = {};

				data.tiles = tiles;
				data.tileSize = tileSize;

				fileIO.saveJson(data, 'New Map');
			},

			//////////
			// LOAD //
			//////////
			_loadJsonEvent: function (e) {
				fileIO.loadFile(Cartographer._loadFromJson);
			},

			_loadFromJson: function (data) {
				try {
					data = JSON.parse(data);
					$('.js-cartographer__tile-size').val(data.tileSize).trigger('change');
					Cartographer._initTiles(data.tiles);
				} catch (error) {
					console.error(error);
				}
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
						tiles[x][y].draw(context, x, y, tileSize, gridGutter);
					}
				}
			},

			/////////////
			// HISTORY //
			/////////////
			_updateHistory: function () {
				var newHistoryStep = Cartographer._buildHistoryStep();

				if (historyPosition < history.length-1) {
					// Overwrite redo history
					history.splice(historyPosition+1);
				}

				if (history.length >= maxHistoryLength) {
					// Don't record too much
					history = history.splice(maxHistoryLength - history.length + 1);
				}

				history.push(newHistoryStep);
				historyPosition = history.length-1;
			},

			_buildHistoryStep: function () {
				var x, y,
					historyStep = {
						tiles: []
					};

				for (x = 0; x < tiles.length; x++) {
					historyStep.tiles.push([]);
					for (y = 0; y < tiles[x].length; y++) {
						historyStep.tiles[x].push({
							colour: tiles[x][y].colour
						});
					}
				}

				return historyStep;
			},

			_undo: function () {
				if ((historyPosition-1) in history) {
					Cartographer._enforceHistoryStep(historyPosition-1);
				}
			},

			_redo: function () {
				if ((historyPosition+1) in history) {
					Cartographer._enforceHistoryStep(historyPosition+1);
				}
			},

			_enforceHistoryStep: function (index) {
				var x, y,
					historyStep = history[index],
					historyTiles = historyStep.tiles;

				historyPosition = index;

				for (x = 0; x < historyTiles.length; x++) {
					for (y = 0; y < historyTiles[x].length; y++) {
						tiles[x][y].colour = historyTiles[x][y].colour;
					}
				}
			}
		};

		return Cartographer;

	}
);