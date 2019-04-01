define(
	[
		'jquery',
		'templayed',

		'util/keybinding',
		'util/fileIO',

		'text!templates/encyclopedia-ajax.html',
		'text!templates/encyclopedia-autocomplete-output.html'
	],

	function (
		$,
		templayed,

		keybinding,
		fileIO,

		ajaxTemplate,
		autocompleteOutputTemplate
	)

	{
		var index,
			currentItem,
			unsavedChanges = false;

		var selectors = {
			contentBody: '.js-encyclopedia-content',
			contentTitle: '.js-encyclopedia-title',
			contentIcon: '.js-encyclopedia-icon',
			contentAka: '.js-encyclopedia-aka',
			contentTags: '.js-encyclopedia-tags',

			contentEdit: '.js-encyclopedia-edit',
			contentSave: '.js-encyclopedia-save',

			ajaxLink: '.js-encyclopedia-ajax-link',
			ajaxContainer: '.js-encyclopedia-ajax__container',

			autocompleteInput: '.js-encyclopedia-autocomplete-input',
			autocompleteForm: '.js-encyclopedia-autocomplete-form',
			autocompleteOutput: '.js-encyclopedia-autocomplete-output',
			autocompleteItem: '.js-encyclopedia-autocomplete-item',

			consolidateGrid: '.js-grid-consolidate',

			// Data
			autocompleteDataTags: 'autocomplete-tags',
			dataValue: 'value',
			jsonSrc: 'src'
		};

		var currentDate;
		var calendarDurations;

		var Encyclopedia = {
			init: function () {
				Encyclopedia._initEvents();
				Encyclopedia._initKeys();

				// TODO: Load indices in parallel,
				// but wait for both to be loaded before initialising encyclopedia fully
				Encyclopedia._initCalendarIndex(Encyclopedia._processCalendarIndex);
			},

			_initEvents: function () {
				$(document)
					.on('click', selectors.ajaxLink, Encyclopedia._ajaxLinkClick)

					.on('click', selectors.contentEdit, Encyclopedia._contentEdit)
					.on('click', selectors.contentSave, Encyclopedia._contentSave)

					.on(
						'change input',
						[selectors.contentBody, selectors.contentTitle, selectors.contentIcon, selectors.contentAka, selectors.contentTags].join(', '),
						Encyclopedia._markUnsavedChanges
					)

					.on('focus keyup', selectors.autocompleteInput, Encyclopedia._autocompleteFilter)
					.on('blur', selectors.autocompleteInput, Encyclopedia._resetStoredAutocompleteValue)
					.on('submit', selectors.autocompleteForm, Encyclopedia._autocompleteSubmit)
					.on('click', Encyclopedia._clickOutsideAutocomplete);

				window.onpopstate = Encyclopedia._popState;
			},

			_initKeys: function () {
				keybinding.bindKey('/', Encyclopedia._focusOnAutocomplete);
				keybinding.bindKey('?', Encyclopedia._focusOnAutocomplete);
				keybinding.bindKey('/', Encyclopedia._focusOnAutocomplete, true, true, true);
				keybinding.bindKey('?', Encyclopedia._focusOnAutocomplete, true, true, true);

				keybinding.bindKey('DOWN', Encyclopedia._autocompleteSelectionDown, true, true);
				keybinding.bindKey('UP', Encyclopedia._autocompleteSelectionUp, true, true);

				keybinding.bindKey('ESC', Encyclopedia._hideAutocompleteResults, true);

				keybinding.bindKey('S', Encyclopedia._contentSave, true, false, true);
				keybinding.bindKey('L', Encyclopedia._contentEdit, true, false, true);
			},

			_initCalendarIndex: function (callback) {
				var url = '/assets/json/calendar/index.json';

				$.ajax({
					url: url,
					dataType: 'json',
					complete: callback
				});
			},

			_processCalendarIndex: function (response, status) {
				if (status === 'success') {
					var data = response.responseJSON;

					currentDate = data.current;
					calendarDurations = data.durations;
				}

				Encyclopedia._initAutocomplete();
			},

			//////////
			// AJAX //
			//////////

			_ajaxLinkClick: function (e) {
				e.preventDefault();

				var $link = $(e.target).closest(selectors.ajaxLink),
					url = $link.data(selectors.jsonSrc);

				Encyclopedia._ajaxLoad(url);
			},

			_ajaxLoad: function (url) {
				var $container = $(selectors.ajaxContainer);

				$container.addClass('is-loading');
				Encyclopedia._hideAutocompleteResults();

				$.ajax({
					url: url,
					dataType: 'json',
					cache: false,
					complete: function () {
						$container.removeClass('is-loading');
					},
					success: Encyclopedia._ajaxLoaded,
					error: function () {
						console.error(arguments);
					}
				});
			},

			_ajaxLoaded: function (data) {
				var $container = $(selectors.ajaxContainer),

					$input = $(selectors.autocompleteInput),

					html,
					newUrl;

				currentItem = data;

				html = templayed(ajaxTemplate)(data);
				html = Encyclopedia._convertHtml(html);

				newUrl = document.location.href.replace(/#.*$/, '') + '#' + encodeURIComponent(Encyclopedia._convertStringForMatching(data.title));

				$container.html(html);
				Encyclopedia._consolidateElements();

				document.title = 'Encyclopedia | ' + currentItem.title;
				if (newUrl === document.location.href) {
					history.replaceState({html: html, currentItem: currentItem}, document.title, newUrl);
				} else {
					history.pushState({html: html, currentItem: currentItem}, currentItem.title, newUrl);
				}
			},

			_convertHtml: function (html) {
				html = Encyclopedia._convertImages(html);

				if (currentDate && calendarDurations) {
					html = Encyclopedia._convertSince(html);
				}

				html = Encyclopedia._convertLinks(html);
				html = Encyclopedia._convertMarkdown(html);

				return html;
			},

			_convertImages: function (html) {
				var template = '<div class="grid-f js-grid-consolidate">' +
					'<div class="grid__item flex-1-3 js-image-control">' +
						'<div class="image-control-wrap">' +
							'<div data-src="/assets/images/$3" style="background-image: url(\'/assets/images/$3\');" class="image-control js-image"></div>' +
						'</div>' +
					'</div>' +
				'</div>';

				html = html.replace(/(<p>)?(\[\[img\|(.*?)\]\])(<\/p>)?/g, template);

				return html;
			},

			_convertSince: function (html) {
				var sincePattern = /\[\[since\|[^\]]*\]\]/g;
				var sinceMatches = html.match(sincePattern);

				if (sinceMatches) {
					sinceMatches.forEach(function (match) {
						var date = match.match(/\[\[since\|(.*?)\]\]/)[1];
						var numberDate = date.split('-').map(function (a) { return parseInt(a, 10); });
						var dateDifference = Encyclopedia._getDateDifferenceString(numberDate, currentDate);

						dateDifference = '<span title="' + date + '">' + dateDifference + '</span>';

						html = html.replace(match, dateDifference);
					});
				}

				return html;
			},

			_getDateDifferenceString: function (pastDate, futureDate) {
				var dateDifference = Encyclopedia._getDateDifference(pastDate, futureDate);
				var dateDifferenceString = '[ERROR | Cannot calculate duration]';

				if (dateDifference[0] >= 0) {
					if (dateDifference[0] > 0) {
						dateDifferenceString = dateDifference[0];
						dateDifferenceString += ' year' + (dateDifferenceString > 1 ? 's' : '');
					} else if (dateDifference[1] > 0) {
						dateDifferenceString = dateDifference[1];
						dateDifferenceString += ' month' + (dateDifferenceString > 1 ? 's' : '');
					} else if (dateDifference[2] >= 0) {
						if (dateDifference[2] > 14) {
							dateDifferenceString = Math.floor(dateDifference[2] / 7);
							dateDifferenceString += ' week' + (dateDifferenceString > 1 ? 's' : '');
						} else {
							dateDifferenceString = dateDifference[2];
							dateDifferenceString += ' day' + (dateDifferenceString > 1 ? 's' : '');
						}
					}
				}

				return dateDifferenceString;
			},

			_getDateDifference: function (pastDate, futureDate) {
				var dateDifference;
				var yearDifference = futureDate[0] - pastDate[0];
				var monthDifference = futureDate[1] - pastDate[1];
				var dayDifference = futureDate[2] - pastDate[2];

				if (dayDifference < 0) {
					monthDifference -= 1;

					// Add the number of days in the month before futureDate
					dayDifference += calendarDurations.months[(futureDate[1]+calendarDurations.months.length-1)%calendarDurations.months.length].days;
				}
				if (monthDifference < 0) {
					yearDifference -= 1;

					monthDifference += calendarDurations.months.length;
				}

				dateDifference = [yearDifference, monthDifference, dayDifference];

				return dateDifference;
			},

			_convertLinks: function (html) {
				var i, item,
					names,
					regex,
					link,
					j, name;

				for (i = 0; i < index.items.length; i++) {
					item = index.items[i];

					names = [item.name];
					if (item.aka) {
						names = names.concat(item.aka);
					}
					names = names.join('|');

					// Escape all special characters but | for use in new Regexp()
					names = names.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$]/g, '\\$&');

					regex = new RegExp('\\[\\[(' + names + ')\\]\\]', 'gi');

					link = '<a href="#' + item.name + '" data-' + selectors.jsonSrc + '="' + item.path + '" class="' + selectors.ajaxLink.substr(1) + '">$1</a>';

					for (j = 0; j < names.length; j++) {
						html = html.replace(regex, link);
					}
				}

				// Find any links without anywhere to go and highlight them
				html = html.replace(/\[\[(.*?)\]\]/g, '<span class="encyclopedia-ajax__broken-link">$1</span>');

				return html;
			},

			_convertMarkdown: function (html) {
				// Encyclopedia allows some markdown to be used

				// Headings
				html = html.replace(/^\s*(<p>)?# (.*?)(<\/p>)?$/gm, '<h1>$2</h1>');
				html = html.replace(/^\s*(<p>)?## (.*?)(<\/p>)?$/gm, '<h2>$2</h2>');
				html = html.replace(/^\s*(<p>)?### (.*?)(<\/p>)?$/gm, '<h3>$2</h3>');
				html = html.replace(/^\s*(<p>)?#### (.*?)(<\/p>)?$/gm, '<h4>$2</h4>');
				html = html.replace(/^\s*(<p>)?##### (.*?)(<\/p>)?$/gm, '<h5>$2</h5>');
				html = html.replace(/^\s*(<p>)?###### (.*?)(<\/p>)?$/gm, '<h6>$2</h6>');

				// Bold
				html = html.replace(/(^|[^\\])\*\*(.*?[^\\])\*\*/g, '$1<b>$2</b>');

				// Italics
				html = html.replace(/(^|[^\\])\*(.*?[^\\])\*/g, '$1<i>$2</i>');

				// Strikethrough
				html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

				// Horizontal rules
				html = html.replace(/^\s*(<p>)?\s*[-*_]{3,}\s*(<\/p>)?\s*$/gm, '<hr />');

				// Blockquotes
				html = html.replace(/((^\s*(<p>)?&gt; (.*$))+)/gm, '<blockquote>$4</blockquote>');

				// Consolidate blockquotes
				html = html.replace(/<\/blockquote>\s*($^)?\s*<blockquote>/gm, '');

				// Unordered lists
				html = html.replace(/^\s*(<p>)?- (.*$)/gm, '$1<li>$2</li>');

				// Consolidate unordered lists
				html = html.replace(/<p>\s*<li>/gm, '<ul><li>');
				html = html.replace(/<\/p>\s*<\/li>/gm, '</li></ul>');

				// Ordered lists
				html = html.replace(/^\s*(<p>)?\d+\. (.*$)/gm, '$1<li>$2</li>');

				// Consolidate unordered lists
				html = html.replace(/<p>\s*<li>/gm, '<ol><li>');
				html = html.replace(/<\/p>\s*<\/li>/gm, '</li></ol>');

				// Unescape characters
				html = html.replace(/\\([*])/g, '$1');

				return html;
			},

			_consolidateElements: function () {
				// When grids with the right class have been inserted
				// next to one another, join them so their children are
				// all within a single grid

				var $grids = $(selectors.consolidateGrid);
				var $gridsToJoin = $(selectors.consolidateGrid + ' + ' + selectors.consolidateGrid);

				var i, $grid, $parentGrid;

				for (var i = $gridsToJoin.length-1; i >= 0; i--) {
					$grid = $gridsToJoin.eq(i);
					$parentGrid = $grid.prev(selectors.consolidateGrid);

					$parentGrid.append($grid.children());
					$grid.remove();
				}
			},

			/////////////
			// CONTENT //
			/////////////

			_createContentLinks: function () {
				var $content = $(selectors.content),
					html = $content.html();

				html = Encyclopedia._convertHtml(html);
				$content.html(html);
			},

			_contentEdit: function () {
				// Load the currently viewed entry for editing

				var indexItem,

					$title = $(selectors.contentTitle),
					$aka = $(selectors.contentAka),
					$tags = $(selectors.contentTags),
					$icon = $(selectors.contentIcon),
					$content = $(selectors.contentBody),

					aka,
					tags;

				if (!currentItem) {
					return;
				}

				if (unsavedChanges) {
					if (!confirm('Discard unsaved changes?')) {
						return;
					}
				}

				indexItem = Encyclopedia._getIndexItem(currentItem.title);

				aka = indexItem.aka ? indexItem.aka.join(', ') : '';
				tags = indexItem.tags ? indexItem.tags.join(', ') : '';

				$title.text(currentItem.title);
				$aka.text(aka);
				$tags.text(tags);
				$icon.prop('checked', false).filter('[value="' + indexItem.type + '"]').prop('checked', true);
				$content.html(currentItem.content.join('\n'));
			},

			_contentSave: function () {
				var $title = $(selectors.contentTitle),
					title,

					$content = $(selectors.contentBody),
					content,

					$aka = $(selectors.contentAka),
					aka,

					$tags = $(selectors.contentTags),
					tags,

					i,

					object,
					indexItem;

				title = $title.text();

				content = $content.html();
				content = content.replace(/(<\/p>|<\/?ul>|<\/li>|<br\s*\/?>)/g, '$1\n').trim();
				content = content.split(/\n/);
				for (i = 0; i < content.length; i++) {
					if (content[i] === '') {
						content.splice(i, 1);
						i--;
					}
				}

				aka = $aka.text().replace(/\s*,\s*/g, ',').split(',');
				tags = $tags.text().replace(/\s*,\s*/g, ',').split(',');

				object = {
					item: {
						title: title,
						content: content
					},
					metadata: {
						icon: $(selectors.contentIcon).filter(':checked').val(),
						aka: aka,
						tags: tags
					}
				};

				if (currentItem && (currentItem.title === title)) {
					// Editing the current item
					if (!window.confirm('This will overwrite ' + currentItem.title)) {
						return;
					}

					indexItem = Encyclopedia._getIndexItem(currentItem.title);

					object.metadata.path = indexItem.path;
				}

				// fileIO.saveJson(object, title.toLowerCase().replace(/\s+/g, '-'));
				$.ajax({
					url: '/encyclopedia/add',
					method: 'POST',
					data: JSON.stringify(object),
					contentType: 'application/json',
					success: Encyclopedia._onContentSaveComplete
				});
			},

			_onContentSaveComplete: function () {
				unsavedChanges = false;
				Encyclopedia._initAutocomplete();
			},

			_markUnsavedChanges: function (e) {
				unsavedChanges = true;
			},

			//////////////////
			// AUTOCOMPLETE //
			//////////////////

			_initAutocomplete: function () {
				$.ajax({
					url: '/assets/json/encyclopedia/index.json',
					dataType: 'json',
					success: Encyclopedia._indexLoaded,
					error: function () {
						console.error('Failed to load index');
					}
				});
			},

			_indexLoaded: function (indexData) {
				var $input = $(selectors.autocompleteInput),
					hash, item;

				index = indexData;

				$input.data(selectors.autocompleteDataIndex, index);

				if (document.location.hash.length) {
					hash = decodeURIComponent(document.location.hash.substr(1));
					item = Encyclopedia._getIndexItem(hash);

					if (item) {
						Encyclopedia._ajaxLoad(item.path);
					} else {
						history.replaceState({html: '', currentItem: undefined}, document.title, document.location.href);
					}
				} else {
					history.replaceState({html: '', currentItem: undefined}, document.title, document.location.href);
				}
			},

			_focusOnAutocomplete: function () {
				var $input = $(selectors.autocompleteInput);

				Encyclopedia._resetStoredAutocompleteValue();
				$input.focus().select();
			},

			_resetStoredAutocompleteValue: function () {
				var $input = $(selectors.autocompleteInput);

				// Set old value record to something that must be different
				// from the input's value, so results will always show
				$input.data(selectors.dataValue, {});
			},

			_autocompleteSelectionMove: function (offset, e) {
				var $focus = $(document.activeElement),
					$items = $(selectors.autocompleteInput).add(selectors.autocompleteItem),
					i,
					$nextItem;

				i = $items.index($focus);
				i += offset;
				i = i % $items.length;

				$nextItem = $items.eq(i);

				if ($items.length > 1) {
					if (e) {
						e.preventDefault();
					}
					$nextItem.focus();
				}
			},

			_autocompleteSelectionDown: function (e) {
				Encyclopedia._autocompleteSelectionMove(+1, e);
			},

			_autocompleteSelectionUp: function (e) {
				Encyclopedia._autocompleteSelectionMove(-1, e);
			},

			_autocompleteFilter: function () {
				var $input = $(selectors.autocompleteInput),
					$output = $(selectors.autocompleteOutput),

					val = $input.val(),
					oldValue = $input.data(selectors.dataValue),

					results = {
						items: []
					},
					html,

					i, item, score;

				if (typeof oldValue !== 'undefined') {
					if (val === oldValue) {
						return;
					}
				}
				$input.data(selectors.dataValue, val);

				if (!index) {
					// Index has not loaded yet;
					return;
				}

				for (i = 0; i < index.items.length; i++) {
					item = index.items[i];

					score = Encyclopedia._queryScore(val, item);
					if (score) {
						results.items.push({
							item: item,
							score: score
						});
					}
				}

				// Sort by name first
				results.items.sort(function (a, b) {
					var nameA = a.item.name.toLowerCase();
					var nameB = b.item.name.toLowerCase();

					if (nameA < nameB) {
						return -1;
					} else if (nameA > nameB) {
						return +1;
					} else {
						return 0;
					}
				});

				// Then sort by score
				results.items.sort(function (a, b) {
					return b.score - a.score;
				});

				html = templayed(autocompleteOutputTemplate)(results);
				$output.html(html);
			},

			_clickOutsideAutocomplete: function (e) {
				if ($(e.target).closest(selectors.autocompleteForm).length === 0) {
					Encyclopedia._hideAutocompleteResults();
				}
			},

			_hideAutocompleteResults: function () {
				var $output = $(selectors.autocompleteOutput);

				$output.html('');
			},

			_hideAutocompleteResultsIfEmpty: function () {
				var $input = $(selectors.autocompleteInput);

				if (!$input.val().trim()) {
					Encyclopedia._hideAutocompleteResults();
				}
			},

			_autocompleteSubmit: function () {
				var $input = $(selectors.autocompleteInput),
					$output = $(selectors.autocompleteOutput),
					$links = $output.find(selectors.ajaxLink);

				$input.blur();
				$links.first().trigger('click');

				return false;
			},

			_queryScore: function (query, item) {
				var score,
					scores = [],

					i, queryToken,
					j, tag;

				if (query.trim() === '') {
					return 1;
				}

				// TODO: This will count tags with spaces multiple times
				query = Encyclopedia._convertStringForMatching(query).trim().split(' ');

				for (i = 0; i < query.length; i++) {
					score = 0;
					queryToken = query[i];

					if (Encyclopedia._convertStringForMatching(item.name).match(queryToken)) {
						score += 50;
					}

					if (queryToken.length > 1) {
						if (item.tags) {
							for (j = 0; j < item.tags.length; j++) {
								tag = item.tags[j];

								if (Encyclopedia._convertStringForMatching(tag).match(queryToken)) {
									score += 5;
								}
							}
						}
					}

					scores.push(score);
				}

				score = 0;
				for (i = 0; i < scores.length; i++) {
					score += scores[i];

					// AND filter
					if (scores[i] === 0) {
						score = 0;
						break;
					}
				}

				return score;
			},

			_convertStringForMatching: function (string) {
				return string.toLowerCase().replace(/ā/gi, 'a');
			},

			_getIndexItem: function (name) {
				var i, item,
					j, aka;

				name = Encyclopedia._convertStringForMatching(name);

				for (i = 0; i < index.items.length; i++) {
					item = index.items[i];

					if (name === Encyclopedia._convertStringForMatching(item.name)) {
						return item;
					}

					if (item.aka) {
						for (j = 0; j < item.aka.length; j++) {
							aka = item.aka[j];

							if (name === Encyclopedia._convertStringForMatching(aka)) {
								return item;
							}
						}
					}
				}

				// No matching item found
				return false;
			},

			/////////////
			// HISTORY //
			/////////////

			_popState: function (e) {
				var $container = $(selectors.ajaxContainer);

				if (e.state) {
					$container.html(e.state.html);
					currentItem = e.state.currentItem;
					document.title = currentItem.title;
				}
			}
		};

		return Encyclopedia;
	}
);