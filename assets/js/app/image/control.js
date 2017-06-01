define(
	[
		'jquery'
	],

	function ($) {
		var ImageControl = {
			init: function () {
				ImageControl._initEvents();
			},

			_initEvents: function () {
				$(document)
					.on('click', '.js-image-control', ImageControl._selectImage);
			},

			_selectImage: function (e) {
				var $wrap = $(e.target).closest('.js-image-control'),
					$image = $wrap.find('.js-image'),
					imagePath = $image.attr('src'),
					colour = $image.data('colour') || '#000';

				$('.js-image-control.is-selected').removeClass('is-selected');
				$wrap.addClass('is-selected');

				localStorage.setItem('image-display', imagePath);
				localStorage.setItem('image-display-colour', colour);
			}
		};

		return ImageControl;
	}
);