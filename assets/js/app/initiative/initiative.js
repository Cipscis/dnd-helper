define(
	[
		'jquery',
		'templayed'
	],

	function ($, templayed) {

		var Initiative = {
			init: function () {
				Initiative._initEvents();
			},

			_initEvents: function () {
				$(document).on('submit', '.js-initiative__form', Initiative._addEntrySubmit);

				$(document).on('click', '.js-initiative__remove', Initiative._removeEntryClick);
				$(document).on('click', '.js-initiative__select', Initiative._setCurrentClick);
				$(document).on('click', '.js-initiative__up', Initiative._moveUpClick);
				$(document).on('click', '.js-initiative__down', Initiative._moveDownClick);
				$(document).on('click', '.js-initiative__next', Initiative._nextClick);

				$(document).on('submit', '.js-initiative__counter-form', Initiative._addCounterSubmit);

				$(document).on('click', '.js-initiative__counter-remove', Initiative._removeCounterClick);
			},

			_addEntrySubmit: function (e) {
				e.preventDefault();
				Initiative._addEntry($(e.target).closest('.js-initiative__form'));
			},

			_addEntry: function ($form) {
				var formArray, formData, i,
					$template = $('.js-initiative__template'),
					$list = $('.js-initiative__list'),
					$entry, $entries;

				// Create data object from form
				formArray = $form.serializeArray();
				formData = {};
				for (i = 0; i < formArray.length; i++) {
					var name = formArray[i].name,
						value = formArray[i].value;

					formData[name] = value;
				}

				// Transform data to match the template's needs
				formData.hasHp = !!formData.hp;

				$entry = $(templayed($template.html())(formData));
				$entries = $list.find('.js-initiative__item');

				// Assuming the list is sorted - which it
				// may not be - start from the top and keep
				// going until you find something with lower initiative
				for (i = 0; i < $entries.length; i++) {
					if ($entries.eq(i).data('initiative') < +formData.initiative) {
						$entry.insertBefore($entries.eq(i));
						return;
					}
				}

				$list.append($entry);
			},

			_removeEntryClick: function (e) {
				e.preventDefault();
				Initiative._removeEntry($(e.target).closest('.js-initiative__item'));
			},

			_removeEntry: function ($entry) {
				$entry.fadeOut(300, function () {
					if ($entry.hasClass('is-current')) {
						Initiative._next();
					}

					$entry.remove();
				});
			},

			_addCounterSubmit: function (e) {
				e.preventDefault();
				Initiative._addCounter($(e.target).closest('.js-initiative__counter-form'));
			},

			_addCounter: function ($counterForm) {
				var formArray, formData, i,
					$template = $('.js-initiative__counter-template'),
					$entry = $counterForm.closest('.js-initiative__item'),
					$counterList = $entry.find('.js-initiative__counter-list'),
					$counter;

				// Create data object from form
				formArray = $counterForm.serializeArray();
				formData = {};
				for (i = 0; i < formArray.length; i++) {
					var name = formArray[i].name,
						value = formArray[i].value;

					formData[name] = value;
				}

				// Clear form
				$counterForm[0].reset();

				// Transform data to match the template's needs
				if (formData.description) {
					formData.hasDescription = true;
				}

				$counter = $(templayed($template.html())(formData));

				$counterList.append($counter);
			},

			_removeCounterClick: function (e) {
				e.preventDefault();
				Initiative._removeCounter($(e.target).closest('.js-initiative__counter'));
			},

			_removeCounter: function ($counter) {
				$counter.fadeOut(300, function () {
					$counter.remove();
				});
			},

			_decrementCounters: function ($entry) {
				$entry.find('.js-initiative__counter').each(Initiative._decrementCounter);
			},

			_decrementCounter: function () {
				var $counter = $(this),
					$duration = $counter.find('.js-initiative__counter-duration');

				$duration.val($duration.val()-1);

				if ($duration.val() <= 0) {
					Initiative._removeCounter($counter);
				}
			},

			_moveUpClick: function (e) {
				Initiative._move($(e.target).closest('.js-initiative__item'), -1);
			},

			_moveDownClick: function (e) {
				Initiative._move($(e.target).closest('.js-initiative__item'), 1);
			},

			_move: function ($item, offset) {
				var $list = $item.closest('.js-initiative__list'),
					$items = $list.find('.js-initiative__item'),
					index = $items.index($item),
					newIndex = (index + offset + $items.length) % $items.length;

				if (newIndex < index) {
					$item.insertBefore($items.eq(newIndex));
				} else {
					$item.insertAfter($items.eq(newIndex));
				}
			},

			_setCurrentClick: function (e) {
				e.preventDefault();
				Initiative._setCurrent($(e.target).closest('.js-initiative__item'));
			},

			_setCurrent: function ($entry) {
				var $list = $entry.closest('.js-initiative__list');

				$list.find('.is-current').removeClass('is-current');
				$entry.addClass('is-current');
			},

			_nextClick: function (e) {
				e.preventDefault();
				Initiative._next();
			},

			_next: function () {
				var $list = $('.js-initiative__list'),
					$entries = $('.js-initiative__item'),
					$currentEntry = $entries.filter('.is-current'),
					index = $entries.index($currentEntry) || 0,
					$nextEntry = $entries.eq((index+1) % $entries.length);

				$currentEntry.removeClass('is-current');
				$nextEntry.addClass('is-current');

				Initiative._decrementCounters($currentEntry);

				$('html, body').animate({
					scrollTop: $nextEntry.offset().top - 10
				});
			}
		};

		return Initiative;

	}
);