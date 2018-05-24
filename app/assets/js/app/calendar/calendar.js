define(
	[
		'jquery',
		'templayed',

		'text!templates/calendar-years.html',
		'text!templates/calendar-month.html'
	],

	function ($, templayed, CalendarYearsTemplate, CalendarMonthTemplate) {
		// This helper works with some assumptions about the calendar:

		// There are 13 months of 28 days each

		var selectors = {
			area: '.js-calendar-area',
			year: '.js-calendar-year',
			month: '.js-calendar-month',
			filter: '.js-calendar-filter'
		};

		var index;

		var Calendar = {
			init: function () {
				Calendar._initEvents();

				Calendar._loadIndex(Calendar._indexLoaded);
			},

			_initEvents: function () {
				$(document)
					.on('change', selectors.filter, Calendar._applyFilter);
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

			_indexLoaded: function (data, statusCode) {
				if (statusCode === 'success') {
					index = data.responseJSON;

					Calendar._renderFilter(index);
					Calendar._renderTemplate(index);
				} else {
					console.error(arguments);
				}
			},

			///////////////
			// RENDERING //
			///////////////
			_renderFilter: function (data) {
				var tags = [];

				// Collect all tags
				for (let h = 0; h < data.years.length; h++) {
					let year = data.years[h];
					for (let i = 0; i < year.months.length; i++) {
						let month = year.months[i];
						for (let j in month.days) {
							let day = month.days[j];

							if (day.tags) {
								for (let k = 0; k < day.tags.length; k++) {
									let tag = day.tags[k];

									if (tags.indexOf(tag) === -1) {
										tags.push(tag);
									}
								}
							}
						}
					}
				}

				// Add tags to filter
				var $filter = $(selectors.filter);
				for (let i = 0; i < tags.length; i++) {
					tag = tags[i];

					$filter.append($('<option value="' + tag + '">' + tag + '</option>'));
				}
			},

			_renderTemplate: function (data) {
				var transformedData = Calendar._processData(data);

				$(selectors.area).html(templayed(CalendarYearsTemplate)(data));

				$(selectors.year).each(function (i, year) {
					$(year).find(selectors.month).each(function (j, month) {
						$(month).html(templayed(CalendarMonthTemplate)(transformedData.years[i].months[j]));
					});
				});
			},

			/////////////////////////
			// DATA TRANSFORMATION //
			/////////////////////////
			_processData: function (data) {
				data = $.extend(true, {}, data);

				// Days require some transformation before being passed to mustache
				var years = data.years;

				var currentYear = data.current[0];
				var currentMonth = data.current[1] - 1;
				var currentDay = data.current[2];

				for (let h = 0; h < years.length; h++) {
					let year = years[h];
					for (let i = 0; i < year.months.length; i++) {
						let month = year.months[i];
						let days = month.days;

						let daysArr = [];

						for (let j = 0; j < 28; j++) {
							daysArr[j] = {};
						}

						for (let date in days) {
							let dateString = date + Calendar._getOrdinal(date) + ' of ' + month.name;

							let day = {
								date: dateString,
								content: Calendar._convertLinks(days[date].content.join(''))
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

						if ((year.num === currentYear) && (i === currentMonth)) {
							daysArr[currentDay-1].isCurrent = true;
						}

						month.days = daysArr;
					}
				}

				return data;
			},

			_convertLinks: function (string) {
				// Convert any text within double square braces into an encyclopedia link

				return string.replace(/\[\[(.*?)\]\]/g, '<a href="/campaign/encyclopedia.html#$1" tabindex="-1" target="_blank">$1</a>');
			},

			///////////////
			// FILTERING //
			///////////////
			_applyFilter: function (e) {
				// Don't show tooltips for days that
				// don't have a tag matching the selected filter

				var $filter = $(selectors.filter);
				var query = $filter.val();

				var data = $.extend(true, {}, index);

				if (query) {
					for (let h = 0; h < data.years.length; h++) {
						let year = data.years[h];
						for (let i = 0; i < year.months.length; i++) {
							let month = year.months[i];

							for (let j in month.days) {
								let day = month.days[j];

								if (day.tags.indexOf(query) === -1) {
									delete month.days[j];
								}
							}
						}
					}
				}

				Calendar._renderTemplate(data);
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