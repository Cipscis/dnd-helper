define(
	[
		'jquery',
		'templayed',

		'text!templates/calendar-month.html'
	],

	function ($, templayed, CalendarMonthTemplate) {
		// This helper works with some assumptions about the calendar:

		// There are 13 months of 28 days each

		var selectors = {
			month: '.js-calendar-month'
		};

		var Calendar = {
			init: function () {
				Calendar._loadIndex(Calendar._renderTemplate);
			},

			////////////////////
			// INITIALISATION //
			////////////////////
			_loadIndex: function (callback) {
				var url = '/assets/json/calendar/index.json';

				$.ajax({
					url: url,
					dataType: 'json',
					complete: callback
				});
			},

			_renderTemplate: function (data, statusCode) {
				if (statusCode === 'success') {
					data = Calendar._processData(data.responseJSON);

					$(selectors.month).each(function (i, month) {
						$(month).html(templayed(CalendarMonthTemplate)(data.months[i]));
					});
				} else {
					console.error(arguments);
				}
			},

			/////////////////////////
			// DATA TRANSFORMATION //
			/////////////////////////
			_processData: function (data) {
				// Days require some transformation
				var months = data.months;

				var currentMonth = data.current[0] - 1;
				var currentDay = data.current[1];

				for (let i = 0; i < months.length; i++) {
					let month = months[i];
					let days = month.days;

					let daysArr = [];

					for (let j = 0; j < 28; j++) {
						daysArr[j] = {};
					}

					for (let date in days) {
						let dateString = date + Calendar._getOrdinal(date) + ' of ' + month.name;

						let day = {
							date: dateString,
							content: Calendar._convertLinks(days[date].join(''))
						};

						// Add day to array
						let dateNum = parseInt(date, 10);
						if (isNaN(dateNum)) {
							console.error('Invalid date in calendar month', month.name);
							return;
						}

						// Wrap in hasTooltip 1-element array for Mustache checking
						day = {
							hasTooltip: [day]
						};

						// -1 to convert to 0-based
						daysArr[dateNum-1] = day;
					}

					if (i === currentMonth) {
						daysArr[currentDay-1].isCurrent = true;
					}

					month.days = daysArr;
				}

				return data;
			},

			_convertLinks: function (string) {
				// Convert any text within double square braces into an encyclopedia link

				return string.replace(/\[\[(.*?)\]\]/g, '<a href="/campaign/encyclopedia.html#$1">$1</a>');
			},

			/////////////
			// UTILITY //
			/////////////
			_getOrdinal: function (number) {
				number = number % 10;

				var ordinal = 'th';

				if (number === 1) {
					ordinal = 'st';
				} else if (number === 2) {
					ordinal = 'nd';
				} else if (number === 3) {
					ordinal = 'rd';
				}

				return ordinal;
			}
		};

		return Calendar;
	}
);