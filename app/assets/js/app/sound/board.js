define(
	[
		'jquery',
		'templayed',

		'youtube',

		'text!templates/soundboard.html'
	],

	function ($, templayed, YT, SoundboardTemplate) {

		var selectors = {
			container: '.js-soundboard-container',

			filter: '.js-soundboard-filter',
			section: '.js-soundboard-section',
			item: '.js-soundboard-item',

			title: '.js-soundboard-title',
			tag: '.js-soundboard-tag',

			link: '.js-soundboard-link'
		};

		var dataSelectors = {
			repeat: 'soundboard-repeat'
		};

		var Soundboard = {
			init: function () {
				Soundboard._initEvents();
				Soundboard._loadIndex(Soundboard._renderTemplate);
			},

			_initEvents: function () {
				$(document)
					.on('input change', selectors.filter, Soundboard._applyFilter)
					.on('click', selectors.link, Soundboard._linkClickEvent);
			},

			////////////////////
			// INITIALISATION //
			////////////////////
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

			////////////
			// SOUNDS //
			////////////
			_linkClickEvent: function (e) {
				var $link = $(e.target),
					href = $link[0].href;

				if ((/^https?:\/\/(www\.)?youtube.com/).test(href)) {
					e.preventDefault();
					Soundboard._youTubeClick($link);
				} else if ((/\.\w+$/.test(href))) {
					e.preventDefault();
					Soundboard._soundFileClick($link);
				}
			},

			// YOUTUBE //
			_youTubeClick: function ($link) {
				// On clicking a YouTube link, embed the video in an iframe

				if (!(YT && YT.Player)) {
					console.error('YouTube API not loaded');
					return;
				}

				var $item = $link.closest(selectors.item);
				var videoUrl = $link[0].href;
				var videoId = videoUrl.match(/\?v=([^&]*)/)[1];

				var events = {
					onReady: Soundboard._youTubeAutoplay
				};
				if ($link.data(dataSelectors.repeat)) {
					events.onStateChange = Soundboard._youTubeRepeat;
				}

				var player = new YT.Player($link[0],
					{
						height: $item.height,
						width: $item.width,
						videoId: videoId,
						events: events
					}
				);
			},

			_youTubeAutoplay: function (event) {
				event.target.playVideo();
			},

			_youTubeRepeat: function (event) {
				var state = event.data;

				if (state === YT.PlayerState.ENDED) {
					event.target.playVideo();
				}
			},

			// SOUND FILE //
			_soundFileClick: function ($link) {
				// On clicking a direct sound file link, embed the sound in an audio tag

				var $item = $link.closest(selectors.item);
				var url = $link[0].href;
				var $tag = $(
					'<audio class="soundboard__audio" controls loop>' +
						'<source src="' + url + '" type="audio/mpeg" />', +
					'</audio>'
				);

				$link.replaceWith($tag);

				$tag[0].play();
			},

			///////////////
			// FILTERING //
			///////////////
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