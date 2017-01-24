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

				$(document).on('mousedown', '.js-combat__canvas', Combat._canvasMouseEvent);
				$(document).on('click', '.js-combat__map-select', Combat._mapSelectEvent);

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
				battlefield = new Battlefield({
					canvas: $('.js-combat__canvas')[0],
					tileSize: $('.js-combat-field-image').data('tilesize'),
					image: $('.js-combat-field-image')[0]
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

			/////////////////////
			// MAP INTERACTION //
			/////////////////////
			_canvasMouseEvent: function (e) {
				var x = e.offsetX,
					y = e.offsetY,

					combatant,
					i;

				// Captures mouse click on the canvas
				// If clicking on a combatant, selects or deselects it
				// If clicking on an empty space with a combatant selected, moves it there

				if (e.button !== 0) {
					// Left click
					return;
				}

				// Undo transformation
				x = x - battlefield.getComputedPanX();
				y = y - battlefield.getComputedPanY();

				x = x/battlefield.scale;
				y = y/battlefield.scale;

				x = Math.floor(x / battlefield.tileSize);
				y = Math.floor(y / battlefield.tileSize);

				for (i = combatants.length-1; i >= 0; i--) {
					combatant = combatants[i];

					if (combatant.x === x && combatant.y === y) {
						break;
					}
				}

				if (i === -1) {
					// No combatant found, so move the cursor combatant
					if (cursor) {
						cursor.moveTo(x, y);
					}
				} else {
					if (cursor === combatant) {
						// You clicked on the cursor, deselect it
						Combat._mapSelect(undefined);
					} else {
						// There is a combatant here, so select it
						Combat._mapSelect(combatant);
					}
				}
			},

			_mapSelectEvent: function (e) {
				var $btn = $(e.target).closest('.js-combat__map-select'),
					$combatant = $btn.closest('.js-combat__item'),
					combatant = $combatant.data('binder-data');

				Combat._mapSelect(combatant);
			},

			_mapSelect: function (combatant) {
				if (cursor) {
					cursor.cursor = false;
				}

				cursor = combatant;
				if (combatant) {
					combatant.cursor = true;
				}
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

		// For debugging while in development
		window.combatants = combatants;

		return Combat;

	}
);