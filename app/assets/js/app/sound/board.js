define(
	[
		'jquery',
		'templayed',

		'sound/player',
		'filter/section',

		'text!templates/soundboard.html'
	],

	function ($, templayed, Player, SectionFilter, SoundboardTemplate) {

		var selectors = {
			container: '.js-soundboard-container',
			item: '.js-soundboard-item',

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
				SectionFilter.init({
					keybinding: true
				});
				Soundboard._loadIndex(Soundboard._renderTemplate);
			},

			_initEvents: function () {
				$(document)
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
			}
		};

		return Soundboard;
	}
);