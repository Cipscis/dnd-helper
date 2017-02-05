define(
	[
		'jquery'
	],

	function ( $ ) {

		var keyMap = {
			BACKSPACE: { keyCode: 8 },
			ENTER: { keyCode: 13 },
			// SHIFT: { keyCode: 16 },
			CONTROL: { keyCode: 17 },
			ESC: { keyCode: 27 },
			SPACE: { keyCode: 32 },
			' ': { keyCode: 32 },

			PAGEUP: { keyCode: 33 },
			PAGEDOWN: { keyCode: 34 },
			END: { keyCode: 35 },
			HOME: { keyCode: 36 },

			LEFT: { keyCode: 37 },
			UP: { keyCode: 38 },
			RIGHT: { keyCode: 39 },
			DOWN: { keyCode: 40 },

			INSERT: { keyCode: 45 },
			DELETE: { keyCode: 46 },

			'0': { keyCode: 48, shiftKey: false },
			')': { keyCode: 48, shiftKey: true },
			'1': { keyCode: 49, shiftKey: false },
			'!': { keyCode: 49, shiftKey: true },
			'2': { keyCode: 50, shiftKey: false },
			'@': { keyCode: 50, shiftKey: true },
			'3': { keyCode: 51, shiftKey: false },
			'#': { keyCode: 51, shiftKey: true },
			'4': { keyCode: 52, shiftKey: false },
			'$': { keyCode: 52, shiftKey: true },
			'5': { keyCode: 53, shiftKey: false },
			'%': { keyCode: 53, shiftKey: true },
			'6': { keyCode: 54, shiftKey: false },
			'^': { keyCode: 54, shiftKey: true },
			'7': { keyCode: 55, shiftKey: false },
			'&': { keyCode: 55, shiftKey: true },
			'8': { keyCode: 56, shiftKey: false },
			'*': { keyCode: 56, shiftKey: true },
			'9': { keyCode: 57, shiftKey: false },
			'(': { keyCode: 57, shiftKey: true },

			A: { keyCode: 65 },
			B: { keyCode: 66 },
			C: { keyCode: 67 },
			D: { keyCode: 68 },
			E: { keyCode: 69 },
			F: { keyCode: 70 },
			G: { keyCode: 71 },
			H: { keyCode: 72 },
			I: { keyCode: 73 },
			J: { keyCode: 74 },
			K: { keyCode: 75 },
			L: { keyCode: 76 },
			M: { keyCode: 77 },
			N: { keyCode: 78 },
			O: { keyCode: 79 },
			P: { keyCode: 80 },
			Q: { keyCode: 81 },
			R: { keyCode: 82 },
			S: { keyCode: 83 },
			T: { keyCode: 84 },
			U: { keyCode: 85 },
			V: { keyCode: 86 },
			W: { keyCode: 87 },
			X: { keyCode: 88 },
			Y: { keyCode: 89 },
			Z: { keyCode: 90 },

			'NUM0': { keyCode: 96 },
			'NUM1': { keyCode: 97 },
			'NUM2': { keyCode: 98 },
			'NUM3': { keyCode: 99 },
			'NUM4': { keyCode: 100 },
			'NUM5': { keyCode: 101 },
			'NUM6': { keyCode: 102 },
			'NUM7': { keyCode: 103 },
			'NUM8': { keyCode: 104 },
			'NUM9': { keyCode: 105 },
			'NUM*': { keyCode: 106 },
			'NUM+': { keyCode: 107 },
			'NUM-': { keyCode: 109 },
			'NUM/': { keyCode: 111 },

			'-': { keyCode: 189, shiftKey: false },
			'_': { keyCode: 189, shiftKey: true },
			'=': { keyCode: 187, shiftKey: false },
			'+': { keyCode: 187, shiftKey: true },
			',': { keyCode: 188, shiftKey: false },
			'<': { keyCode: 188, shiftKey: true },
			'.': { keyCode: 190, shiftKey: false },
			'>': { keyCode: 190, shiftKey: true },
			'/': { keyCode: 191, shiftKey: false },
			'?': { keyCode: 191, shiftKey: true },
			'`': { keyCode: 192, shiftKey: false },
			'~': { keyCode: 192, shiftKey: true },
			'[': { keyCode: 219, shiftKey: false },
			'\\': { keyCode: 220, shiftKey: false },
			'|': { keyCode: 220, shiftKey: true },
			'{': { keyCode: 219, shiftKey: true },
			']': { keyCode: 221, shiftKey: false },
			'}': { keyCode: 221, shiftKey: true }
		};

		var bindings = {};

		var Keys = {
			_isFocusOnInput: function () {
				var $activeEl = $(document.activeElement);

				return $activeEl.is(':input');
			},

			bindKey: function (key, fn, ctrlKey) {
				var fnWrapper;

				if (typeof key === 'string') {
					key = keyMap[key.toUpperCase()];
				}

				if (key) {
					fnWrapper = function (e) {
						// Don't check key presses if focus is on an input element unless it requires Ctrl
						if (Keys._isFocusOnInput() && !ctrlKey) {
							return;
						}

						if (e.which === key.keyCode) {
							if (typeof key.shiftKey !== 'undefined' && key.shiftKey !== e.shiftKey) {
								return;
							}

							if (!ctrlKey || e.ctrlKey) {
								e.preventDefault();
								return fn.call(this, e);
							}
						}
					};

					$(document).on('keydown', fnWrapper);
					bindings[fn] = {
						key: key,
						fn: fnWrapper
					};
				}
			},

			unbindKey: function (key, fn) {
				if (bindings[fn] && bindings[fn].key === keyMap[key]) {
					$(document).off('keyup', bindings[fn].fn);
				}
			},

			bindKeySequence: function () {
				// Arguments should be a sequence of key names, followed by a function

				var args = Array.prototype.splice.call(arguments, 0),
					fn = args[args.length-1],
					keyNames = args.splice(0, args.length),
					keys = [],
					keysPressed = [];

				for (i = 0; i < keyNames.length-1; i++) {
					keys.push(keyMap[keyNames[i].toUpperCase()]);
				}

				if (keys.indexOf(undefined) === -1) {
					// If all keys are defined
					$(document).on('keyup', function (e) {
						// Record as many of the past keys pressed as required for the sequence

						// Don't check key presses if focus is on an input element
						if (Keys._isFocusOnInput()) {
							return;
						}

						if (e.which !== 16) {
							// Ignore shift, as it's used as a modifier
							keysPressed.push({
								keyCode: e.which,
								shiftKey: e.shiftKey
							});
						}
						if (keysPressed.length > keys.length) {
							keysPressed = keysPressed.splice(1);
						}

						if (e.which === keys[keys.length-1].keyCode) {
							// When the final key is pressed, check if the whole sequence matches
							for (i = 0; i < keys.length; i++) {
								if (keys[i].keyCode !== keysPressed[i].keyCode) {
									break;
								} else if (typeof keys[i].shiftKey !== 'undefined' && keys[i].shiftKey !== keysPressed[i].shiftKey) {
									break;
								}
							}

							// i only reaches keys.length if the break; line was never executed
							if (i === keys.length) {
								fn.call();
							}
						}
					});
				}
			}
		};

		return Keys;

	}
);