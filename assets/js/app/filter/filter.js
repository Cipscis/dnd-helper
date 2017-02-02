define(
	[
		'jquery',
		'filter/index-item'
	],

	function ($, IndexItem) {
		var Filter = {

			init: function () {
				Filter._initEvents();
				$('.js-filter').each(Filter._buildIndex);
			},

			_initEvents: function () {
				$(document).on('input', '.js-filter__input', Filter._runFilter);
			},

			_buildIndex: function (n, filter) {
				var $filter = $(filter),
					$items = $filter.find('.js-filter__item'),
					$item,
					index = [],
					i;

				for (i = 0 ; i < $items.length; i++) {
					$item = $items.eq(i);

					index.push(new IndexItem({
						$el: $item
					}));
				}

				$filter.data('filter-index', index);

				return index;
			},

			_runFilter: function (e) {
				var $input = $(e.target).closest('.js-filter__input'),
					$filter = $input.closest('.js-filter'),

					index = $filter.data('filter-index'),
					query,

					indexItem,
					$el,
					relevance,
					i,

					$itemsToToggle = $(),
					results = [];

				try {
					query = new RegExp($input.val(), 'gi');
				} catch (error) {
					// Invalid regular expression, don't change anything
					return;
				}

				if ($input.val().trim()) {
					// There is a query
					for (i = 0; i < index.length; i++) {
						indexItem = index[i];
						$el = indexItem.$el;

						relevance = indexItem.getRelevance(query);

						results.push({
							$el: $el,
							relevance: relevance
						});

						// Record the default order
						if (typeof $el.data('filter-original-index') === 'undefined') {
							$el.data('filter-original-index', $el.index());
						}

						// Instead of hiding/showing everything, record only necessary changes
						if ((!!relevance) !== $el.is(':visible')) {
							$itemsToToggle = $itemsToToggle.add($el);
						}
					}
				} else {
					// Show the default order
					for (i = 0; i < index.length; i++) {
						indexItem = index[i];
						$el = indexItem.$el;

						// Negative so larger indices have lower relevance
						// Add 1 first so it won't be 0, which gets ignored
						relevance = -($el.data('filter-original-index') + 1);

						if (typeof relevance === 'undefined') {
							// A filter has not yet been run
							return;
						}

						results.push({
							$el: $el,
							relevance: relevance
						});

						// Show all hidden results
						if (!($el.is(':visible'))) {
							$itemsToToggle = $itemsToToggle.add($el);
						}
					}
				}

				results.sort(function (a, b) {
					return b.relevance - a.relevance;
				});

				for (i = 0; i < index.length; i++) {
					if (results[i].relevance === 0) {
						// Don't bother reordering anything that didn't match
						break;
					}

					results[i].$el.appendTo($filter);
				}

				$itemsToToggle.toggle();
			}
		};

		return Filter;
	}
);