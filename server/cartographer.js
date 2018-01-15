var fs = require('fs');
var jsonFormat = require('json-format');

var processFileWritten = function (error) {
	if (error) {
		console.error(error);
	}
};

var webPath = '/assets/json/cartographer/';
var fsPathPrefix = 'app/';
var fsPath = fsPathPrefix + webPath;

var Cartographer = {
	add: function (req, res) {

		var newItem = req.body;

		fs.readFile(fsPath + 'index.json', 'utf-8', Cartographer._onIndexReadAdd(newItem, res));
	},

	_onIndexReadAdd: function (item, res) {
		return function (err, data) {
			if (err) {
				return console.error(err);
			}

			var index = JSON.parse(data),
				items = index.maps,
				currentItem, i;

			for (i = 0; i < items.length; i++) {
				if (items[i].name === item.name) {
					currentItem = items[i];
					break;
				}
			}

			if (currentItem) {
				index.maps[i] = item;
			} else {
				index.maps.push(item);
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
	add: Cartographer.add
};