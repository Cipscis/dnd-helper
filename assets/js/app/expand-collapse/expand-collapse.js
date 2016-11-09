define(
	[
		'jquery'
	],

	function ($) {

		var ExpandCollapse = {
			init: function () {
				ExpandCollapse._initEvents();
			},

			_initEvents: function () {
				$(document).on('click', '.js-expand-collapse__trigger', ExpandCollapse._processClick);
				$(document).on('click', '.js-expand-collapse__children-trigger', ExpandCollapse._toggleChildren);
			},

			_processClick: function (e) {
				e.preventDefault();

				var $trigger = $(e.target).closest('.js-expand-collapse__trigger'),
					$expandCollapse = $trigger.closest('.js-expand-collapse');

				ExpandCollapse._toggle($expandCollapse);
			},

			_toggleChildren: function (e) {
				e.preventDefault();

				var $trigger = $(e.target).closest('.js-expand-collapse__children-trigger'),
					$parent = $trigger.closest('.js-expand-collapse, body'),
					$children = $parent.find('.js-expand-collapse');

				if ($children.filter('.is-expanded').length) {
					$children.each(function () {
						ExpandCollapse._close($(this));
					});
				} else {
					$children.each(function () {
						ExpandCollapse._open($(this));
					});
				}
			},

			_open: function ($expandCollapse) {
				$expandCollapse.addClass('is-expanded');
			},

			_close: function ($expandCollapse) {
				$expandCollapse.removeClass('is-expanded');
			},

			_toggle: function ($expandCollapse) {
				var $body = $expandCollapse.children('.js-expand-collapse__body');

				if ($expandCollapse.hasClass('is-expanded')) {
					ExpandCollapse._close($expandCollapse);
				} else {
					ExpandCollapse._open($expandCollapse);
				}
			}
		};

		return ExpandCollapse;

	}
);