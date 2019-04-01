define(
	[
		'jquery'
	],

	function ($) {
		var ImageDisplay = {
			init: function () {
				ImageDisplay._initEvents();
			},

			_initEvents: function () {
				window.addEventListener('storage', ImageDisplay._storageEvent);
			},

			_storageEvent: function (e) {
				ImageDisplay._updateImage();
			},

			_updateImage: function () {
				var imagePath = localStorage.getItem('image-display'),
					image = new Image();

				$('.js-image-display').addClass('is-loading');

				image.src = imagePath;
				image.onload = ImageDisplay._imageLoaded;
			},

			_imageLoaded: function (e) {
				var imagePath = localStorage.getItem('image-display'),
					colour = localStorage.getItem('image-display-colour');

				$('.js-image-display')
					.removeClass('is-loading')
					.css({
						'background-image': 'url(\'' + imagePath + '\')',
						'background-color': colour
					});
			}
		};

		return ImageDisplay;
	}
);