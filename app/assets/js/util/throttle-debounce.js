define(
	[],

	function () {
		var ThrottleDebounce = {
			throttle: function (fn, delay) {
				// Create a version of fn that will execute only if
				// it hasn't been called within the last delay ms

				var timeout;

				return function () {
					if (timeout) {
						window.clearTimeout(timeout);
					} else {
						fn.apply(this, arguments);
					}

					timeout = window.setTimeout(function () {
						timeout = undefined;
					}, delay);
				};
			},

			debounce: function (fn, delay) {
				// Used to create a version of fn that will execute only
				// after no attempt to call it has been made for delay ms

				// Note this will uncouple the callback from user input,
				// if used as an event callback. This can cause popup blockers etc.

				// This throttling is useful, for example, for waiting until
				// the user has stopped typing before executing a keyup callback

				var timeout;

				return function () {
					var self = this;
					var args = arguments;

					if (timeout) {
						window.clearTimeout(timeout);
					}

					timeout = window.setTimeout(function () {
						timeout = undefined;
						fn.apply(self, args);
					}, delay);
				};
			}
		};

		return ThrottleDebounce;
	}
);