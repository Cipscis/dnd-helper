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
			currentItem;

		var selectors = {
			contentBody: '.js-encyclopedia-content',
			contentTitle: '.js-encyclopedia-title',
			contentIcon: '.js-encyclopedia-icon',
			contentLoad: '.js-encyclopedia-load',
			contentEdit: '.js-encyclopedia-edit',
			contentSave: '.js-encyclopedia-save',

			ajaxLink: '.js-encyclopedia-ajax-link',
			ajaxContainer: '.js-encyclopedia-ajax__container',

			autocompleteInput: '.js-encyclopedia-autocomplete-input',
			autocompleteForm: '.js-encyclopedia-autocomplete-form',
			autocompleteOutput: '.js-encyclopedia-autocomplete-output',
			autocompleteItem: '.js-encyclopedia-autocomplete-item',

			// Data
			autocompleteDataTags: 'autocomplete-tags',
			dataValue: 'value'
		};

		var Encyclopedia = {
			init: function () {
				Encyclopedia._initEvents();
				Encyclopedia._initKeys();
				Encyclopedia._initAutocomplete();
			},

			_initEvents: function () {
				$(document)
					.on('click', selectors.ajaxLink, Encyclopedia._ajaxLinkClick)

					.on('click', selectors.contentLoad, Encyclopedia._contentLoad)
					.on('click', selectors.contentEdit, Encyclopedia._contentEdit)
					.on('click', selectors.contentSave, Encyclopedia._contentSave)

					.on('focus keyup', selectors.autocompleteInput, Encyclopedia._autocompleteFilter)
					.on('blur', selectors.autocompleteInput, Encyclopedia._resetStoredAutocompleteValue)
					.on('submit', selectors.autocompleteForm, Encyclopedia._autocompleteSubmit)
					.on('click', Encyclopedia._clickOutsideAutocomplete);

				window.onpopstate = Encyclopedia._popState;
			},

			_initKeys: function () {
				keybinding.bindKey('/', Encyclopedia._focusOnAutocomplete);
				keybinding.bindKey('?', Encyclopedia._focusOnAutocomplete);

				keybinding.bindKey('DOWN', Encyclopedia._autocompleteSelectionDown, true, true);
				keybinding.bindKey('UP', Encyclopedia._autocompleteSelectionUp, true, true);

				keybinding.bindKey('ESC', Encyclopedia._hideAutocompleteResults, true);
			},

			//////////
			// AJAX //
			//////////

			_ajaxLinkClick: function (e) {
				e.preventDefault();

				var $link = $(e.target).closest(selectors.ajaxLink),
					url = $link.attr('href');

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
					newUrl,

					section, i,
					subsection, j;

				currentItem = data;

				// Convert data
				data = Encyclopedia._convertSectionData(data);

				if (data.sections) {
					for (i = 0; i < data.sections.length; i++) {
						data.sections[i] = Encyclopedia._convertSectionData(data.sections[i]);

						for (j = 0; j < data.sections[i].subsections.length; j++) {
							data.sections[i].subsections[j] = Encyclopedia._convertSectionData(data.sections[i].subsections[j]);
						}
					}
				}

				html = templayed(ajaxTemplate)(data);
				html = Encyclopedia._convertLinks(html);

				newUrl = document.location.href.replace(/#.*$/, '') + '#' + encodeURIComponent(Encyclopedia._convertStringForMatching(data.title));

				$container.html(html);

				document.title = currentItem.title;
				if (newUrl === document.location.href) {
					history.replaceState({html: html, currentItem: currentItem}, document.title, newUrl);
				} else {
					history.pushState({html: html, currentItem: currentItem}, currentItem.title, newUrl);
				}
			},

			_convertSectionData: function (section ) {
				if (section.title) {
					section.hasTitle = [{
						title: section.title
					}];
				} else {
					section.hasTitle = false;
				}

				if (section.images) {
					section.hasImages = [{
						images: section.images
					}];
				} else {
					section.hasImages = false;
				}

				section.content = section.content || [];
				section.subsections = section.subsections || [];

				return section;
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

					link = '<a href="' + item.path + '" class="' + selectors.ajaxLink.substr(1) + '">$1</a>';

					for (j = 0; j < names.length; j++) {
						html = html.replace(regex, link);
					}
				}

				// Find any links without anywhere to go and highlight them
				html = html.replace(/\[\[(.*?)\]\]/g, '<span class="encyclopedia-ajax__broken-link">$1</span>');

				return html;
			},

			/////////////
			// CONTENT //
			/////////////

			_createContentLinks: function () {
				var $content = $(selectors.content),
					html = $content.html();

				html = Encyclopedia._convertLinks(html);
				$content.html(html);
			},

			_contentLoad: function () {
				// Pick a JSON file manually from the file system
				// and load it for editing

				fileIO.loadFile(Encyclopedia._contentLoadCallback);
			},

			_contentLoadCallback: function (json) {
				// Current only supports files with no sections
				// Does not support images

				var $title = $(selectors.contentTitle),
					$content = $(selectors.contentBody),
					data;

				try {
					data = JSON.parse(json);

					$title.text(data.title);
					$content.html(data.content.join('\n'));
				} catch (e) {
					console.error(e);
				}
			},

			_contentEdit: function () {
				// Load the currently viewed entry for editing

				var indexItem,

					$title = $(selectors.contentTitle),
					$icon = $(selectors.contentIcon),
					$content = $(selectors.contentBody);

				if (!currentItem) {
					return;
				}

				indexItem = Encyclopedia._getIndexItem(currentItem.title);

				// Currently only supports files with no sections
				// Does not support images

				$title.text(currentItem.title);
				$icon.prop('checked', false).filter('[value="' + indexItem.type + '"]').prop('checked', true);
				$content.html(currentItem.content.join('\n'));
			},

			_contentSave: function () {
				// Currently only supports files with no sections
				// Does not support images

				var $title = $(selectors.contentTitle),
					title,

					$content = $(selectors.contentBody),
					content,

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

				object = {
					item: {
						title: title,
						content: content
					},
					metadata: {
						icon: $(selectors.contentIcon).filter(':checked').val()
					}
				};

				if (currentItem && (currentItem.title === title)) {
					// Editing the current item
					if (!window.confirm('This will overwrite ' + currentItem.title)) {
						return;
					}

					indexItem = Encyclopedia._getIndexItem(currentItem.title);

					object.metadata.path = indexItem.path;
					object.metadata.tags = indexItem.tags;
					object.metadata.aka = indexItem.aka;
				}

				// fileIO.saveJson(object, title.toLowerCase().replace(/\s+/g, '-'));
				$.ajax({
					url: '/encyclopedia/add',
					method: 'POST',
					data: JSON.stringify(object),
					contentType: 'application/json',
					success: Encyclopedia._initAutocomplete
				});
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

				// TODO: This will count tags with spaces multiple times
				query = Encyclopedia._convertStringForMatching(query).trim().split(' ');

				for (i = 0; i < query.length; i++) {
					score = 0;
					queryToken = query[i];

					if (Encyclopedia._convertStringForMatching(item.name).match(queryToken)) {
						score += 50;

						// Better score for a total match
						score += queryToken.length / item.name.length;
					}

					if (item.tags) {
						for (j = 0; j < item.tags.length; j++) {
							tag = item.tags[j];

							if (Encyclopedia._convertStringForMatching(tag).match(queryToken)) {
								score += 5;

								// Better score for a total match
								score += queryToken.length / item.name.length;
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