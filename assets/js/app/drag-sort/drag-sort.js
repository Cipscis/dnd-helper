define(
	[
		'jquery'
	],

	function ($) {

		// TODO:
		// Allow previewing of the new location

		var $draggedEl;

		var DragSort = {
			init: function () {
				DragSort._initEvents();
			},

			_initEvents: function () {
				$(document)
					.on('dragstart', '.js-drag-sort-item', DragSort._processDragStart)
					.on('dragenter', '.js-drag-sort-item', DragSort._processDragEnter)
					.on('dragleave', '.js-drag-sort-item', DragSort._processDragLeave)
					.on('dragover', '.js-drag-sort-item', DragSort._processDragOver)
					.on('drop', '.js-drag-sort-item', DragSort._processDrop)
					.on('dragend', DragSort._processDragEnd);
			},

			_processDragStart: function (e) {
				var $target = $(e.target),
					dataTransfer = e.originalEvent.dataTransfer;

				DragSort._startDragging($target);
				dataTransfer.dropEffect = 'move';
			},

			_processDragEnter: function (e) {
				var $target = $(e.target);

				if (
					!$target.is($draggedEl) &&
					$target.closest('.js-drag-sort-list').is($draggedEl.closest('.js-drag-sort-list')) &&
					$target.is('.js-drag-sort-item') &&
					!$target.hasClass('is-droppable')
				) {
					$target.addClass('is-droppable');
				}
			},

			_processDragLeave: function (e) {
				var $target = $(e.target);

				if ($target.is('.js-drag-sort-item') && $target.hasClass('is-droppable')) {
					$target.removeClass('is-droppable');
				}
			},

			_processDragOver: function (e) {
				var $target = $(e.target).closest('.js-drag-sort-item');

				// Can't drag an element onto itself
				if (!$target.is($draggedEl)) {
					// Can't drag an element outside its list
					if ($target.closest('.js-drag-sort-list').is($draggedEl.closest('.js-drag-sort-list'))) {
						e.preventDefault();
					}
				}
			},

			_processDrop: function (e) {
				var $list = $(e.target).closest('.js-drag-sort-list'),
					$items = $list.find('.js-drag-sort-item'),

					$drop = $(e.target).closest('.js-drag-sort-item'),
					$dropWrap = $drop.closest('.js-drag-sort-wrap'),
					dropIndex = $items.index($drop),

					$drag = $draggedEl,
					$dragWrap = $drag.closest('.js-drag-sort-wrap'),
					dragIndex = $items.index($drag);

				// Allow wrapping elements to be moved, for layout purposes
				if ($dropWrap.length) {
					$drop = $dropWrap;
				}
				if ($dragWrap.length) {
					$drag = $dragWrap;
				}

				if (dragIndex < dropIndex) {
					$drag.insertAfter($drop);
				} else {
					$drag.insertBefore($drop);
				}
			},

			_processDragEnd: function (e) {
				DragSort._stopDragging();
			},

			_startDragging: function ($el) {
				$draggedEl = $el;
				$el.addClass('is-dragging');
			},

			_stopDragging: function () {
				$draggedEl.removeClass('is-dragging');
				$draggedEl = undefined;
				$('.is-droppable').removeClass('is-droppable');
			}
		};

		return DragSort;

	}
);