var fs = require('fs');
var jsonFormat = require('json-format');

var processFileWritten = function (error) {
	if (error) {
		console.error(error);
	}
};

var webPath = '/assets/json/encyclopedia/';
var fsPathPrefix = 'app/';
var fsPath = fsPathPrefix + webPath;

var Encyclopedia = {
	// Add
	add: function (req, res) {

		var item = req.body.item,
			filename = item.title.replace(/ā/g, 'a').replace(/\s+/g, '-').toLowerCase() + '.json',

			fileLocation,
			indexEntry;

		// Create encyclopedia entry in index
		indexEntry = {
			name: item.title,
			type: req.body.metadata.icon,
			path: webPath + filename
		};

		if (req.body.metadata.path) {
			indexEntry.path = req.body.metadata.path;
			fileLocation = fsPathPrefix + indexEntry.path;
		}
		if (req.body.metadata.tags) {
			indexEntry.tags = req.body.metadata.tags;
		}
		if (req.body.metadata.aka) {
			indexEntry.aka = req.body.metadata.aka;
		}

		// Create encyclopedia entry file
		fs.writeFile(
			fileLocation || (fsPath + filename),
			jsonFormat(req.body.item),
			processFileWritten
		);

		fs.readFile(fsPath + 'index.json', 'utf-8', Encyclopedia._onIndexReadAdd(indexEntry, res));
	},

	_onIndexReadAdd: function (indexEntry, res) {
		return function (err, data) {
			if (err) {
				return console.error(err);
			}

			var index = JSON.parse(data),
				items = index.items,
				currentItem, i;

			for (i = 0; i < items.length; i++) {
				if (items[i].name === indexEntry.name) {
					currentItem = items[i];
					break;
				}
			}

			if (currentItem) {
				index.items[i] = indexEntry;
			} else {
				index.items.push(indexEntry);
			}

			fs.writeFile(
				fsPath + 'index.json',
				jsonFormat(index),
				function (error) {
					if (error) {
						res.sendStatus(500);
						console.error(error);
					} else {
						res.sendStatus(200);
					}
				}
			);
		};
	},

	// Collect Missing Links
	collectMissingLinks: function (req, res) {
		fs.readFile(fsPath + 'index.json', 'utf-8', Encyclopedia._onIndexReadCollectMissingLinks(res));
	},

	_onIndexReadCollectMissingLinks: function (res) {
		return function (err, index) {
			if (err) {
				return console.error(err);
			}

			index = JSON.parse(index);

			var missingLinks = [];
			var filesToProcess = index.items.length;

			var collectLinksFromIndexEntry = function (err, indexEntry) {
				if (err) {
					return console.error(err);
				}

				indexEntry = JSON.parse(indexEntry);

				var html = indexEntry.content.join('');

				var links = html.match(/\[\[(.*?)\]\]/gm);
				if (links !== null) {
					missingLinks = missingLinks.concat(links)
				}

				filesToProcess--;

				if (filesToProcess === 0) {
					missingLinks = Encyclopedia._cleanLinksList(missingLinks);
					missingLinks = Encyclopedia._removeActiveLinks(missingLinks, index);
					res.send(missingLinks);
				}
			};

			var i, item;
			for (i = 0; i < index.items.length; i++) {
				item = index.items[i];

				fs.readFile(fsPathPrefix + item.path, 'utf-8', collectLinksFromIndexEntry);
			}
		};
	},

	_cleanLinksList: function (links) {
		var cleanLinks = [];

		var i,
			link;

		for (i = 0; i < links.length; i++) {
			link = links[i];

			// Remove brackets
			link = link.replace(/^\[\[(.*?)\]\]$/, '$1');

			// Convert to lower case
			link = link.toLowerCase();

			links[i] = link;
		}

		for (i = 0; i < links.length; i++) {
			link = links[i];

			// Exclude images
			if ((/^img\|/).test(link)) {
				continue;
			}

			// Remove duplicates
			if (links.indexOf(link) === i) {
				cleanLinks.push(link);
			}
		}

		cleanLinks = cleanLinks.sort();

		return cleanLinks;
	},

	_removeActiveLinks: function (links, index) {
		var missingLinks = [];

		var i,
			item,
			linkNames = [];

		// Collect the names of all active links
		for (i = 0; i < index.items.length; i++) {
			item = index.items[i];

			linkNames.push(item.name);
			if (item.aka) {
				linkNames = linkNames.concat(item.aka);
			}
		}

		for (i = 0; i < linkNames.length; i++) {
			// Ensure all linkNames are in lower case
			linkNames[i] = linkNames[i].toLowerCase();
		}

		// Compare collected links with active link names
		for (i = 0; i < links.length; i++) {
			item = links[i];

			if (linkNames.indexOf(item) === -1) {
				missingLinks.push(item);
			}
		}

		return missingLinks;
	},

	// Get links to a page
	getLinksTo: function (req, res, next) {
		var path = req.path.toLowerCase().replace(/^\//, '');

		fs.readFile(fsPath + 'index.json', 'utf-8', Encyclopedia._onIndexReadGetLinksTo(res, path));
	},

	_onIndexReadGetLinksTo: function (res, name) {
		return function (err, index) {
			if (err) {
				console.error(err);
				return;
			}

			index = JSON.parse(index);

			var i, item,
				namesToMatch = [];
				names = [];

			for (i = 0; i < index.items.length; i++) {
				item = index.items[i];

				namesToMatch = item.aka || [];
				namesToMatch.push(item.name.toLowerCase());

				if (namesToMatch.indexOf(name) === -1) {
					res.send(namesToMatch);
				}
			}

			res.send(name);
		};
	}
};

module.exports = {
	add: Encyclopedia.add,
	collectMissingLinks: Encyclopedia.collectMissingLinks,
	getLinksTo: Encyclopedia.getLinksTo
};