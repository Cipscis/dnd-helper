var express = require('express');
var app = express();

app.get('/', function (request, response) {
	response.sendFile(__dirname + '/index.html');
});

app.use('/assets', express.static('assets'));
app.use('/campaign', express.static('campaign'));
app.use('/helpers', express.static('helpers'));
app.use('experiments', express.static('experiments'));

app.listen(8080, function () {});