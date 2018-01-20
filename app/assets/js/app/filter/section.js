define(
	[
		'jquery'
	],

	function ($) {
		var selectors = {
			query: '.js-section-filter-query',
			section: '.js-section-filter-section',
			item: '.js-section-filter-item',

			title: '.js-section-filter-title',
			tag: '.js-section-filter-tag'
		};

		var SectionFilter = {
			init: function (options) {
				options = options || {};

				SectionFilter._initEvents();

				if (options.keybinding === true) {
					SectionFilter._initKeybinding();
				}
			},

			_initEvents: function () {
				$(document)
					.on('input change', selectors.query, SectionFilter._applyFilter);
			},

			_initKeybinding: function () {
				require(['util/keybinding'], function (keybinding) {
					keybinding.bindKey('/', SectionFilter._focusOnQuery);
					keybinding.bindKey('?', SectionFilter._focusOnQuery);
				});
			},

			_focusOnQuery: function (e) {
				$(selectors.query).focus();
			},

			_applyFilter: function (e) {
				e.preventDefault();

				var $filter = $(this);
				var q = $filter.val();

				var $sections = $(selectors.section);
				var $items = $(selectors.item);

				$sections.show();
				$items.show();

				$items.each(SectionFilter._filterItem(q));
				$sections.each(SectionFilter._hideSectionIfEmpty);
			},

			_filterItem: function (q) {
				var qRegex = new RegExp(q, 'i');

				return function () {
					var $item = $(this);

					var $title = $item.find(selectors.title);
					var title = $title.html();

					var $tags = $item.find(selectors.tag);

					var match = qRegex.test(title);

					// Check if any of the tags match
					for (var i = 0; i < $tags.length; i++) {
						if (match) {
							break;
						}
						match = match || qRegex.test($tags.eq(i).html());
					}

					if (!match) {
						$item.hide();
					}
				};
			},

			_hideSectionIfEmpty: function () {
				var $section = $(this);
				var $items = $section.find(selectors.item);

				if ($items.filter(':visible').length === 0) {
					$section.hide();
				}
			}
		};

		return {
			init: SectionFilter.init
		};
	}
);