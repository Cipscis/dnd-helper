define(
	[
		'jquery',
		'templayed',

		'text!templates/image-control.html'
	],

	function ($, templayed, imageControlTemplate) {

		var ImageControl = {
			init: function () {
				ImageControl._initEvents();
				ImageControl._loadIndex(ImageControl._renderImages);
			},

			_initEvents: function () {
				$(document)
					.on('click', '.js-image-control', ImageControl._selectImage)

					.on('dragover', '.js-image-drop', ImageControl._dragOver)
					.on('drop', '.js-image-drop', ImageControl._drop)

					.on('change', '.js-image-path', ImageControl._changePath);
			},

			_loadIndex: function (callback) {
				var url = '/assets/json/image-control/index.json';

				$.ajax({
					url: url,
					dataType: 'json',
					complete: callback
				});
			},

			_renderImages: function (data, statusCode) {
				if (statusCode === 'success') {
					$('.js-image-container').html(templayed(imageControlTemplate)(data.responseJSON));
				} else {
					console.error(arguments);
				}
			},

			_selectImage: function (e) {
				var $wrap = $(e.target).closest('.js-image-control'),
					$image = $wrap.find('.js-image'),
					imagePath = $image.attr('src'),
					colour = $image.data('colour') || '#000';

				ImageControl._setImage(imagePath, colour);
			},

			_setImage: function (imagePath, colour) {
				imagePath = imagePath || '';
				colour = colour || '#000000';

				// Remove first to ensure an update is detected even
				// if the same image has been selected again
				localStorage.removeItem('image-display');
				localStorage.removeItem('image-display-colour');

				localStorage.setItem('image-display', imagePath);
				localStorage.setItem('image-display-colour', colour);
			},

			_dragOver: function (e) {
				e.preventDefault();
			},

			_drop: function (e) {
				e.preventDefault();

				var dataTransfer = e.originalEvent.dataTransfer,
					image,
					fileReader;

				if (!dataTransfer.files.length) {
					return;
				}

				image = dataTransfer.files[0];

				fileReader = new FileReader();
				fileReader.onload = ImageControl._dropImageLoad;
				fileReader.readAsDataURL(image);
			},

			_dropImageLoad: function (e) {
				var fileReader = e.target,
					dataUrl = fileReader.result;

				ImageControl._setImage(dataUrl);
			},

			_changePath: function (e) {
				var $path = $(e.target).closest('.js-image-path'),
					path = $path.val();

				ImageControl._setImage(path);
			}
		};

		return ImageControl;
	}
);