define(
	[
		'jquery',
		'binder',

		'combat/combatant',
		'combat/battlefield',

		'util/form-util',
		'templayed'
	],

	function (
		$,
		Binder,

		Combatant,
		Battlefield,

		FormUtil,
		templayed
	) {

		var combatants = [],
			cursor,
			clickPosition,
			battlefield;

		var Combat = {
			init: function () {
				Combat._initEvents();

				Combat._initRendering();
			},

			_initEvents: function () {
				$(document).on('submit', '.js-combat__form', Combat._addCombatantEvent);
				$(document).on('click', '.js-combat__remove', Combat._removeCombatantEvent);

				$(document).on('submit', '.js-combat__counter-form', Combat._addCounterEvent);
				$(document).on('click', '.js-combat__counter-remove', Combat._removeCounterEvent);

				$(document).on('click', '.js-combat__up', Combat._moveUpEvent);
				$(document).on('click', '.js-combat__down', Combat._moveDownEvent);

				$(document).on('click', '.js-combat__select', Combat._setCurrentEvent);
				$(document).on('click', '.js-combat__next', Combat._nextEvent);

				$(document).on('mousedown', '.js-combat__canvas', Combat._canvasMouseDownEvent);
				$(document).on('mouseup', '.js-combat__canvas', Combat._canvasMouseUpEvent);
				$(document).on('click', '.js-combat__select-on-map', Combat._setMapCursorEvent);

				$(document).on('change', '.js-combat__map-select', Combat._updateMapEvent);

				$(document).on('click', '.js-map-up', Combat._mapUpEvent);
				$(document).on('click', '.js-map-down', Combat._mapDownEvent);
				$(document).on('click', '.js-map-left', Combat._mapLeftEvent);
				$(document).on('click', '.js-map-right', Combat._mapRightEvent);
				$(document).on('click', '.js-map-centre', Combat._mapResetEvent);
				$(document).on('click', '.js-map-zoom-in', Combat._mapZoomInEvent);
				$(document).on('click', '.js-map-zoom-out', Combat._mapZoomOutEvent);
			},

			////////////////////
			// ADD AND REMOVE //
			////////////////////
			_addCombatantEvent: function (e) {
				e.preventDefault();

				var $form = $(e.target).closest('.js-combat__form'),
					formData = FormUtil.getDataFromForm($form);

				switch (formData.name.toLowerCase()) {
					case 'name':
						formData.image = '/assets/images/combat/avatars/name-avatar.png';
						break;
				}

				Combat._addCombatant(formData);
			},

			_addCombatant: function (combatantData) {
				var combatant,

					$template = $('.js-combat__template'),
					$list = $('.js-combat__list'),
					$entry, $combatants,

					i;

				combatant = new Combatant(combatantData);

				$combatant = $(templayed($template.html())(combatant));
				$combatants = $list.find('.js-combat__item');

				// Assuming the list is sorted - which it
				// may not be - start from the top and keep
				// going until you find something with lower initiative
				for (i = 0; i < $combatants.length; i++) {
					if (+$combatants.eq(i).attr('data-binder-attribute-initiative') < +combatant.initiative) {
						$combatant.insertBefore($combatants.eq(i));
						break;
					}
				}

				if (i === $combatants.length) {
					$list.append($combatant);
				}

				combatants.push(Binder.bind(combatant, $combatant));
				Combat._updateLocalStorage();
			},

			_removeCombatantEvent: function (e) {
				e.preventDefault();
				Combat._removeCombatant($(e.target).closest('.js-combat__item').data('binder-data'));
			},

			_removeCombatant: function (combatant) {
				var $combatant = combatant.$el;

				while (combatants.indexOf(combatant) !== -1) {
					combatants.splice(combatants.indexOf(combatant), 1);
				}

				$combatant.fadeOut(300, function () {
					if ($combatant.data('binder-data').current) {
						Combat._next();
					}

					$combatant.remove();
					Combat._updateLocalStorage();
				});
			},

			//////////////
			// COUNTERS //
			//////////////
			_addCounterEvent: function (e) {
				e.preventDefault();

				var $form = $(e.target).closest('.js-combat__counter-form'),
					formData = FormUtil.getDataFromForm($form),

					$combatant = $form.closest('.js-combat__item'),
					combatant = $combatant.data('binder-data');

				Combat._addCounter(formData, combatant);

				$form[0].reset();
			},

			_addCounter: function (counterData, combatant) {
				var $template = $('.js-combat__counter-template'),
					$combatant = combatant.$el,
					$counterList = $combatant.find('.js-combat__counter-list'),
					$counter,

					i;

				// Transform data to match the template's needs
				if (counterData.description) {
					counterData.hasDescription = true;
				}

				$counter = $(templayed($template.html())(counterData));

				// If there's more than one $counterList, make sure all
				// new $counter elements are added to the bound data
				$counter = $counter.appendTo($counterList);

				counterData.$el = $counter;
				combatant.counters.push(Binder.bind(counterData, $counter));
				Combat._updateLocalStorage();
			},

			_removeCounterEvent: function (e) {
				e.preventDefault();

				var $counter = $(e.target).closest('.js-combat__counter'),
					counter = $counter.data('binder-data');

				Combat._removeCounter(counter);
			},

			_removeCounter: function (counter) {
				var $counter = counter.$el,
					$combatant = $counter.closest('.js-combat__item'),
					combatant = $combatant.data('binder-data');

				while (combatant.counters.indexOf(counter) !== -1) {
					combatant.counters.splice(combatant.counters.indexOf(counter), 1);
				}

				$counter.fadeOut(300, function () {
					$counter.remove();
					Combat._updateLocalStorage();
				});
			},

			_decrementCounters: function (combatant) {
				var i, counter;

				for (i = 0; i < combatant.counters.length; i++) {
					counter = combatant.counters[i];
					counter.duration = Math.max(0, +counter.duration - 1);

					if (counter.duration <= 0) {
						Combat._removeCounter(counter);
					}
				}
			},

			/////////////
			// SORTING //
			/////////////
			_moveUpEvent: function (e) {
				e.preventDefault();

				var $combatant = $(e.target).closest('.js-combat__item');

				Combat._move($combatant, -1);
			},

			_moveDownEvent: function (e) {
				e.preventDefault();

				var $combatant = $(e.target).closest('.js-combat__item');

				Combat._move($combatant, 1);
			},

			_move: function ($combatant, offset) {
				var $list = $combatant.closest('.js-combat__list'),
					$combatants = $list.find('.js-combat__item'),
					index = $combatants.index($combatant),
					newIndex = (index + offset + $combatants.length) % $combatants.length;

				if (newIndex < index) {
					$combatant.insertBefore($combatants.eq(newIndex));
				} else {
					$combatant.insertAfter($combatants.eq(newIndex));
				}
			},

			///////////
			// TURNS //
			///////////
			_setCurrentEvent: function (e) {
				e.preventDefault();

				var $combatant = $(e.target).closest('.js-combat__item'),
					combatant = $combatant.data('binder-data');

				Combat._setCurrent(combatant);
			},

			_setCurrent: function (combatant) {
				var $combatant = combatant.$el,
					$list = $combatant.closest('.js-combat__list'),

					$currentCombatant = $list.find('[data-binder-attribute-current="true"]'),
					currentCombatant = $currentCombatant.data('binder-data');

				if (currentCombatant) {
					currentCombatant.current = false;
				}
				combatant.current = true;
			},

			_nextEvent: function (e) {
				e.preventDefault();
				Combat._next();
			},

			_next: function () {
				var $list = $('.js-combat__list'),
					$combatants = $('.js-combat__item'),

					$currentCombatant = $combatants.filter('[data-binder-attribute-current="true"]'),
					currentCombatant = $currentCombatant.data('binder-data'),

					index = $combatants.index($currentCombatant) || 0,

					$nextCombatant = $combatants.eq((index+1) % $combatants.length),
					nextCombatant = $nextCombatant.data('binder-data');

				if (currentCombatant) {
					Combat._decrementCounters(currentCombatant);
				}

				Combat._setCurrent(nextCombatant);

				$('html, body').animate({
					scrollTop: $nextCombatant.offset().top - 10
				});
			},

			/////////////
			// DRAWING //
			/////////////
			_initRendering: function () {
				var img = new Image();
				img.src = $('.js-combat__map-select').val();

				battlefield = new Battlefield({
					canvas: $('.js-combat__canvas')[0],
					tileSize: $('.js-combat__map-select').find(':selected').data('tilesize'),
					image: img
				});

				Combat._startDrawing(Combat._drawFrame, 100, 50000);
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
				var i, combatant;

				battlefield.clear();

				battlefield.transform();

				battlefield.drawField(dt);
				Combat._drawCombatants(dt);
				Combat._drawCursor(dt);

				battlefield.resetTransform();
			},

			_drawCombatants: function (dt) {
				for (i = 0; i < combatants.length; i++) {
					combatant = combatants[i];

					combatant.draw(battlefield.context, dt, battlefield.tileSize);
				}
			},

			_drawCursor: function (dt) {
				var ctx = battlefield.context,
					tileSize = battlefield.tileSize;

				if (!cursor) {
					return;
				}

				ctx.save();

				ctx.translate(cursor.x * tileSize, cursor.y * tileSize);

				ctx.strokeStyle = '#f90';
				ctx.lineWidth = tileSize * 0.1;

				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(tileSize, 0);
				ctx.lineTo(tileSize, tileSize);
				ctx.lineTo(0, tileSize);
				ctx.lineTo(0, 0);
				ctx.stroke();

				ctx.strokeStyle = '#000';
				ctx.lineWidth = 1;

				ctx.beginPath();
				// 5 foot squares, so 6 squares is 30 feet. Add 1/2 for the occupied tile
				ctx.arc(tileSize/2, tileSize/2, tileSize*6.5, 0, Math.PI*2);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(tileSize/2, tileSize/2, tileSize*12.5, 0, Math.PI*2);
				ctx.stroke();

				ctx.restore();
			},

			//////////////////
			// LOCALSTORAGE //
			//////////////////
			_updateLocalStorage: function () {
				var simpleCombatantList = [],
					field = {
						image: battlefield.image.src,
						tileSize: battlefield.tileSize
					},

					i;

				for (i = 0; i < combatants.length; i++) {
					simpleCombatantList.push({
						name: combatants[i].name,
						image: combatants[i].image && combatants[i].image.src,
						team: combatants[i].team,
						x: combatants[i].x,
						y: combatants[i].y
					});
				}

				localStorage.setItem('mirrormap', JSON.stringify({
					combatants: simpleCombatantList,
					battlefield: field
				}));
			},

			/////////////////////
			// MAP INTERACTION //
			/////////////////////
			_canvasMouseDownEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY;

				if (e.button !== 0) {
					// Left click
					return;
				}

				clickPosition = {
					x: x,
					y: y
				};
			},

			_canvasMouseUpEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY,

					initialTilePos,
					tilePos,
					combatant,
					i;

				// Captures mouse click on the canvas

				if (e.button !== 0) {
					// Left click
					return;
				}

				initialTilePos = Combat._getTileAtMousePos(clickPosition.x, clickPosition.y);
				tilePos = Combat._getTileAtMousePos(x, y);

				clickPosition = undefined;

				if (initialTilePos.x === tilePos.x && initialTilePos.y === tilePos.y) {
					// Clicked on the same tile

					// If clicking on a combatant, selects or deselects it
					// If clicking on an empty space with a combatant selected, moves it there

					for (i = combatants.length-1; i >= 0; i--) {
						combatant = combatants[i];

						if (combatant.x === tilePos.x && combatant.y === tilePos.y) {
							break;
						}
					}

					if (i === -1) {
						// No combatant found, so move the cursor combatant
						if (cursor) {
							cursor.moveTo(tilePos.x, tilePos.y);
							Combat._updateLocalStorage();
						}
					} else {
						if (cursor === combatant) {
							// You clicked on the cursor, deselect it
							Combat._setMapCursor(undefined);
						} else {
							// There is a combatant here, so select it
							Combat._setMapCursor(combatant);
						}
					}
				} else {
					battlefield.pan(
						battlefield.tileSize * (tilePos.x - initialTilePos.x),
						battlefield.tileSize * (tilePos.y - initialTilePos.y)
					);
				}
			},

			_getTileAtMousePos: function (x, y) {
				// Undo transformation
				x -= battlefield.getComputedPanX();
				y -= battlefield.getComputedPanY();

				x /= battlefield.scale;
				y /= battlefield.scale;

				x = Math.floor(x / battlefield.tileSize);
				y = Math.floor(y / battlefield.tileSize);

				return {
					x: x,
					y: y
				};
			},

			_setMapCursorEvent: function (e) {
				var $btn = $(e.target).closest('.js-combat__select-on-map'),
					$combatant = $btn.closest('.js-combat__item'),
					combatant = $combatant.data('binder-data');

				Combat._setMapCursor(combatant);
			},

			_setMapCursor: function (combatant) {
				if (cursor) {
					cursor.cursor = false;
				}

				cursor = combatant;
				if (combatant) {
					combatant.cursor = true;
				}
			},

			_updateMapEvent: function (e) {
				var $select = $(e.target).closest('.js-combat__map-select');

				Combat._updateMap($select.val(), $select.find(':selected').data('tilesize'));
			},

			_updateMap: function (src, tileSize) {
				var img = new Image();
				img.src = src;

				battlefield.image = img;
				battlefield.tileSize = tileSize;

				Combat._updateLocalStorage();
			},

			_mapUpEvent: function (e) {
				e.preventDefault();
				battlefield.pan(0, +battlefield.tileSize);
			},

			_mapDownEvent: function (e) {
				e.preventDefault();
				battlefield.pan(0, -battlefield.tileSize);
			},

			_mapLeftEvent: function (e) {
				e.preventDefault();
				battlefield.pan(+battlefield.tileSize, 0);
			},

			_mapRightEvent: function (e) {
				e.preventDefault();
				battlefield.pan(-battlefield.tileSize, 0);
			},

			_mapResetEvent: function (e) {
				e.preventDefault();
				battlefield.panTo(0, 0);
				battlefield.zoomTo(1);
			},

			_mapZoomInEvent: function (e) {
				e.preventDefault();
				battlefield.zoom(2);
			},

			_mapZoomOutEvent: function (e) {
				e.preventDefault();
				battlefield.zoom(0.5);
			}
		};

		return Combat;

	}
);