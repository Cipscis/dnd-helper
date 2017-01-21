define(
	[
		'jquery',
		'binder',

		'templayed'
	],

	function ($, Binder, templayed) {

		var getDataFromForm = function ($form) {
			// Helper function to get a data object instead of an array from serializeArray
			var formArray,
				formData;

			formArray = $form.serializeArray();
			formData = {};
			for (i = 0; i < formArray.length; i++) {
				var name = formArray[i].name,
					value = formArray[i].value;

				formData[name] = value;
			}

			return formData;
		};

		var combatants = [];

		var Combat = {
			init: function () {
				Combat._initEvents();
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
			},

			////////////////////
			// ADD AND REMOVE //
			////////////////////
			_addCombatantEvent: function (e) {
				e.preventDefault();
				Combat._addCombatant($(e.target).closest('.js-combat__form'));
			},

			_addCombatant: function ($form) {
				var data,

					$template = $('.js-combat__template'),
					$list = $('.js-combat__list'),
					$entry, $combatants,

					i;

				// Create data object from form
				data = getDataFromForm($form);

				// Transform data to match the template's needs
				data.hasHp = !!data.hp;

				$combatant = $(templayed($template.html())(data));
				$combatants = $list.find('.js-combat__item');

				// Assuming the list is sorted - which it
				// may not be - start from the top and keep
				// going until you find something with lower initiative
				for (i = 0; i < $combatants.length; i++) {
					if ($combatants.eq(i).data('initiative') < +data.initiative) {
						$combatant.insertBefore($combatants.eq(i));
						return;
					}
				}

				$list.append($combatant);

				combatants.push(Binder.bind(data, $combatant));
			},

			_removeCombatantEvent: function (e) {
				e.preventDefault();
				Combat._removeCombatant($(e.target).closest('.js-combat__item'));
			},

			_removeCombatant: function ($combatant) {
				var data = $combatant.data('binder-data');

				$combatant.fadeOut(300, function () {
					if ($combatant.hasClass('is-current')) {
						Combat._next();
					}

					$combatant.remove();
				});

				while (combatants.indexOf(data) !== -1) {
					combatants.splice(combatants.indexOf(data), 1);
				}
			},

			//////////////
			// COUNTERS //
			//////////////
			_addCounterEvent: function (e) {
				e.preventDefault();
				Combat._addCounter($(e.target).closest('.js-combat__counter-form'));
			},

			_addCounter: function ($form) {
				var formData, i,
					$template = $('.js-combat__counter-template'),
					$combatant = $form.closest('.js-combat__item'),
					$counterList = $combatant.find('.js-combat__counter-list'),
					$counter;

				// Create data object from form
				formData = getDataFromForm($form);

				// Clear form
				$form[0].reset();

				// Transform data to match the template's needs
				if (formData.description) {
					formData.hasDescription = true;
				}

				$counter = $(templayed($template.html())(formData));

				$counterList.append($counter);
			},

			_removeCounterEvent: function (e) {
				e.preventDefault();
				Combat._removeCounter($(e.target).closest('.js-combat__counter'));
			},

			_removeCounter: function ($counter) {
				$counter.fadeOut(300, function () {
					$counter.remove();
				});
			},

			_decrementCounters: function ($combatant) {
				$combatant.find('.js-combat__counter').each(Combat._decrementCounter);
			},

			_decrementCounter: function () {
				var $counter = $(this),
					$duration = $counter.find('.js-combat__counter-duration');

				$duration.val($duration.val()-1);

				if ($duration.val() <= 0) {
					Combat._removeCounter($counter);
				}
			},

			/////////////
			// SORTING //
			/////////////
			_moveUpEvent: function (e) {
				Combat._move($(e.target).closest('.js-combat__item'), -1);
			},

			_moveDownEvent: function (e) {
				Combat._move($(e.target).closest('.js-combat__item'), 1);
			},

			_move: function ($item, offset) {
				var $list = $item.closest('.js-combat__list'),
					$items = $list.find('.js-combat__item'),
					index = $items.index($item),
					newIndex = (index + offset + $items.length) % $items.length;

				if (newIndex < index) {
					$item.insertBefore($items.eq(newIndex));
				} else {
					$item.insertAfter($items.eq(newIndex));
				}
			},

			///////////
			// TURNS //
			///////////
			_setCurrentEvent: function (e) {
				e.preventDefault();
				Combat._setCurrent($(e.target).closest('.js-combat__item'));
			},

			_setCurrent: function ($combatant) {
				var $list = $combatant.closest('.js-combat__list');

				$list.find('.is-current').removeClass('is-current');
				$combatant.addClass('is-current');
			},

			_nextEvent: function (e) {
				e.preventDefault();
				Combat._next();
			},

			_next: function () {
				var $list = $('.js-combat__list'),
					$combatants = $('.js-combat__item'),
					$currentCombatant = $combatants.filter('.is-current'),
					index = $combatants.index($currentCombatant) || 0,
					$nextEntry = $combatants.eq((index+1) % $combatants.length);

				$currentCombatant.removeClass('is-current');
				$nextEntry.addClass('is-current');

				Combat._decrementCounters($currentCombatant);

				$('html, body').animate({
					scrollTop: $nextEntry.offset().top - 10
				});
			}
		};

		return Combat;

	}
);