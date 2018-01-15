define(
	[
		'jquery',
		'templayed',

		'text!templates/soundboard.html'
	],

	function ($, templayed, SoundboardTemplate) {

		var selectors = {
			container: '.js-soundboard-container',
			filter: '.js-soundboard-filter',
			section: '.js-soundboard-section',
			item: '.js-soundboard-item',
			title: '.js-soundboard-title',
			tag: '.js-soundboard-tag'
		};

		var Soundboard = {
			init: function () {
				Soundboard._initEvents();
				Soundboard._loadIndex(Soundboard._renderTemplate);
			},

			_initEvents: function () {
				$(document)
					.on('input change', selectors.filter, Soundboard._applyFilter);
			},

			_loadIndex: function (callback) {
				var url = '/assets/json/soundboard/index.json';

				$.ajax({
					url: url,
					dataType: 'json',
					complete: callback
				});
			},

			_renderTemplate: function (data, statusCode) {
				if (statusCode === 'success') {
					data = Soundboard._processData(data.responseJSON);

					$(selectors.container).html(templayed(SoundboardTemplate)(data));
				} else {
					console.error(arguments);
				}
			},

			_processData: function (data) {
				var sections = data.sections;

				for (let i = 0; i < sections.length; i++) {
					let section = sections[i];
					let sounds = section.sounds;

					for (let j = 0; j < sounds.length; j++) {
						let sound = sounds[j];

						sound.sectionTitle = section.title;
					}
				}

				return data;
			},

			_applyFilter: function (e) {
				e.preventDefault();

				var $filter = $(this);
				var q = $filter.val();

				var $sections = $(selectors.section);
				var $items = $(selectors.item);

				$sections.show();
				$items.show();

				$items.each(Soundboard._filterItem(q));
				$sections.each(Soundboard._hideSectionIfEmpty);
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

		return Soundboard;
	}
);