define(
	[
		'jquery',
		'templayed',

		'sound/player',

		'text!templates/soundboard.html'
	],

	function ($, templayed, Player, SoundboardTemplate) {

		var selectors = {
			container: '.js-soundboard-container',

			filter: '.js-soundboard-filter',
			section: '.js-soundboard-section',
			item: '.js-soundboard-item',

			title: '.js-soundboard-title',
			tag: '.js-soundboard-tag',

			link: '.js-soundboard-link',
			placeholder: '.js-soundboard-audio-wrapper'
		};

		var dataSelectors = {
			repeat: 'soundboard-repeat',
			player: 'soundboard-player',
			volume: 'soundboard-volume'
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
						if (sound.description) {
							sound.hasDescription = [{description: sound.description}];
						}
						if (sound.volume) {
							sound.hasVolume = [{volume: sound.volume}];
						}
					}
				}

				return data;
			},

			////////////
			// SOUNDS //
			////////////
			_linkClickEvent: function (e) {
				var $link = $(e.target).closest('[href]'),
					href = $link[0].href;

				var type;

				if ((/^https?:\/\/(www\.)?youtube.com/).test(href)) {
					e.preventDefault();
					type = Player.Types.YOUTUBE;
				} else if ((/\.\w+$/.test(href))) {
					e.preventDefault();
					type = Player.Types.HTML;
				}

				if (type) {
					var $item = $link.closest(selectors.item);
					var player = $item.data(dataSelectors.player);

					if (player) {
						player.toggle();
					} else {
						player = Soundboard._initPlayer($link, type);
					}
				}
			},

			_initPlayer: function ($link, type) {
				var $item = $link.closest(selectors.item);
				var $element = $item.find(selectors.placeholder);
				var href = $link[0].href;

				var options = {
					href: href,
					type: type,
					element: $element[0],

					volume: $link.data(dataSelectors.volume || 1),
					loop: $link.data(dataSelectors.repeat) ? 1 : 0
				};

				if (type === Player.Types.YOUTUBE) {
					options.onStateChange = Soundboard._youtubePlayerStateChange;
				} else if (type === Player.Types.HTML) {
					options.onStateChange = Soundboard._soundFileStateChange;
				}

				var player = new Player(options);

				$item.data(dataSelectors.player, player);
				// Can't use cached element as it's possibly been replaced by the Youtube API
				$element = $item.find(selectors.placeholder);
				$element.show();

				return player;
			},

			_youtubePlayerStateChange: function (event) {
				var $player = $(event.target.a);
				var $item = $player.closest(selectors.item);

				if (event.data === YT.PlayerState.PLAYING) {
					$item.addClass('is-playing');
				} else {
					$item.removeClass('is-playing');
				}
			},

			_soundFileStateChange: function (e) {
				var audio = e.target;
				var $item = $(audio).closest(selectors.item);

				if (audio.paused) {
					$item.removeClass('is-playing');
				} else {
					$item.addClass('is-playing');
				}
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