define(
	[
		'youtube'
	],

	function (YT) {
		var Player = function (options) {
			this.type = options.type;

			if (this.type === Player.Types.YOUTUBE) {
				_initYoutubePlayer.apply(this, arguments);
			} else if (this.type === Player.Types.HTML) {
				_initHtmlPlayer.apply(this, arguments);
			}
		};

		Player.Types = {
			YOUTUBE: 1,
			HTML: 2
		};

		////////////////////
		// INITIALISATION //
		////////////////////

		// Youtube
		var _initYoutubePlayer = function (options) {
			var videoId = options.href.match(/\?v=([^&]*)/)[1];

			var playerVars = {
				autoplay: 1,
				iv_load_policy: 3
			};
			if (options.loop) {
				playerVars.loop = 1;
				playerVars.playlist = videoId; // Required to get looping to work
			}

			var events = {
				onReady: _onYoutubePlayerReady(this, options)
			};
			if (options.onStateChange) {
				events.onStateChange = options.onStateChange;
			}

			this.player = new YT.Player(options.element,
				{
					height: options.element.height,
					width: options.element.width,
					videoId: videoId,
					playerVars: playerVars,
					events: events
				}
			);

			return this.player;
		};

		var _onYoutubePlayerReady = function (playerObj, options) {
			return function (event) {
				var player = event.target;

				player.setPlaybackQuality('small');

				if (options.volume) {
					playerObj.setVolume(options.volume);
				}
			};
		};

		// Html
		var _initHtmlPlayer = function (options) {
			this.player = document.createElement('audio');
			this.player.classList.add('soundboard__audio');
			this.player.setAttribute('controls', 'controls');

			if (options.loop) {
				this.player.setAttribute('loop', 'loop');
			}

			var $source = document.createElement('source');
			$source.setAttribute('src', options.href);
			$source.setAttribute('type', 'audio/mpeg');

			options.element.append(this.player);
			this.player.append($source);

			if (options.onStateChange) {
				this.player.addEventListener('playing', options.onStateChange);
				this.player.addEventListener('ended', options.onStateChange);
				this.player.addEventListener('pause', options.onStateChange);
			}

			if (options.volume) {
				this.setVolume(options.volume);
			}

			this.player.play();

			return this.player;
		};

		//////////////
		// CONTROLS //
		//////////////
		Player.prototype.isPlaying = function () {
			var isPlaying;

			if (this.type === Player.Types.YOUTUBE) {
				isPlaying = this.player.getPlayerState() === YT.PlayerState.PLAYING;
			} else if (this.type === Player.Types.HTML) {
				isPlaying = !this.player.paused;
			}

			return isPlaying;
		};

		Player.prototype.play = function () {
			if (this.type === Player.Types.YOUTUBE) {
				this.player.playVideo();
			} else if (this.type === Player.Types.HTML) {
				this.player.play();
			}
		};

		Player.prototype.pause = function () {
			if (this.type === Player.Types.YOUTUBE) {
				this.player.pauseVideo();
			} else if (this.type === Player.Types.HTML) {
				this.player.pause();
			}
		};

		Player.prototype.toggle = function () {
			if (this.isPlaying()) {
				this.pause();
			} else {
				this.play();
			}
		};

		Player.prototype.setVolume = function (volume) {
			if (this.type === Player.Types.YOUTUBE) {
				// Multiply by 100 as the Youtube API expects a value from 0-100, not 0-1
				this.player.setVolume(volume*100);
			} else if (this.type === Player.Types.HTML) {
				this.player.volume = volume;
			}
		};

		return Player;
	}
);