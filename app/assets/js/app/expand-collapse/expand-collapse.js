define(
	[
		'jquery'
	],

	function ($) {

		var selectors = {
			wrapper: '.js-expand-collapse',
			trigger: '.js-expand-collapse__trigger',
			childrenTrigger: '.js-expand-collapse__children-trigger',
			body: '.js-expand-collapse__body'
		};

		var ExpandCollapse = {
			init: function () {
				ExpandCollapse._initEvents();
			},

			_initEvents: function () {
				$(document)
					.on('click', selectors.trigger, ExpandCollapse._processClick)
					.on('click', selectors.childrenTrigger, ExpandCollapse._toggleChildren);
			},

			_processClick: function (e) {
				e.preventDefault();

				var $trigger = $(e.target).closest(selectors.trigger),
					$expandCollapse = $trigger.closest(selectors.wrapper);

				ExpandCollapse._toggle($expandCollapse);
			},

			_toggleChildren: function (e) {
				e.preventDefault();

				var $trigger = $(e.target).closest(selectors.childrenTrigger),
					$parent = $trigger.closest(selectors.wrapper + ', body'),
					$children = $parent.find(selectors.wrapper);

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
				var $body = $expandCollapse.children(selectors.body);

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