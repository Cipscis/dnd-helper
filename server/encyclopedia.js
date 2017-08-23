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
	}
};

module.exports = {
	add: Encyclopedia.add
};