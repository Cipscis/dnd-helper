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

			link: '.js-soundboard-link',
			placeholder: '.js-soundboard-audio-wrapper'
		};

		var dataSelectors = {
			repeat: 'soundboard-repeat',
			audio: 'soundboard-audio'
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

				if ((/^https?:\/\/(www\.)?youtube.com/).test(href)) {
					e.preventDefault();
					Soundboard._youtubeClick($link);
				} else if ((/\.\w+$/.test(href))) {
					e.preventDefault();
					Soundboard._soundFileClick($link);
				}
			},

			// Youtube //
			_youtubeClick: function ($link) {
				// On clicking a Youtube link, embed the video in an iframe

				if (!(YT && YT.Player)) {
					console.error('Youtube API not loaded');
					return;
				}

				var $item = $link.closest(selectors.item);
				var player = $item.data(dataSelectors.audio);

				if (player) {
					// On clicks after the first, toggle pause/play
					if (player.getPlayerState() ===  YT.PlayerState.PLAYING) {
						player.pauseVideo();
					} else {
						// Paused, stopped, ended etc.
						player.playVideo();
					}
				} else {
					// On first click, initialise player
					player = Soundboard._initYoutubePlayer($link);
					$item.data(dataSelectors.audio, player);
				}
			},

			_initYoutubePlayer: function ($link) {
				var $item = $link.closest(selectors.item);
				var $placeholder = $item.find(selectors.placeholder);
				var videoUrl = $link[0].href;
				var videoId = videoUrl.match(/\?v=([^&]*)/)[1];

				var events = {
					onReady: Soundboard._youtubePlayerReady,
					onStateChange: Soundboard._youtubePlayerStateChange
				};
				var playerVars = {
					autoplay: 1
				};
				if ($link.data(dataSelectors.repeat)) {
					playerVars.loop = 1;
					playerVars.playlist = videoId; // Required to get looping to work
				}

				// A new YT.Player will play automatically
				var player = new YT.Player($placeholder[0],
					{
						height: $placeholder.height,
						width: $placeholder.width,
						videoId: videoId,
						playerVars: playerVars,
						events: events
					}
				);
				// Re-retrieve placeholder as it's been replaced by the player
				$placeholder = $item.find(selectors.placeholder);
				$placeholder.show();

				return player;
			},

			_youtubePlayerReady: function (event) {
				var player = event.target;

				player.setPlaybackQuality('small');
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

			// SOUND FILE //
			_soundFileClick: function ($link) {
				// On clicking a direct sound file link, embed the sound in an audio tag

				var $item = $link.closest(selectors.item);
				var audio = $item.data(dataSelectors.audio);

				if (audio) {
					if (audio.paused) {
						audio.play();
						$item.addClass('is-playing');
					} else {
						audio.pause();
						$item.removeClass('is-playing');
					}
				} else {
					audio = Soundboard._initSoundFile($link);
					$item.data(dataSelectors.audio, audio);

					audio.play();
					$item.addClass('is-playing');
				}
			},

			_initSoundFile: function ($link) {
				var $item = $link.closest(selectors.item);
				var $placeholder = $item.find(selectors.placeholder);
				var url = $link[0].href;
				var $tag = $(
					'<audio class="soundboard__audio" controls' + ($link.data(dataSelectors.repeat) ? ' loop' : '') + '>' +
						'<source src="' + url + '" type="audio/mpeg" />', +
					'</audio>'
				);

				$placeholder.append($tag);
				$placeholder.show();

				$tag.on('playing ended pause', Soundboard._soundFileStateChange);

				var audio = $tag[0];
				return audio;
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