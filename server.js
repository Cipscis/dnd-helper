var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var encyclopedia = require('./server/encyclopedia');

app.use(express.static('app'));

app.use(bodyParser.json());
app.post('/encyclopedia/add', encyclopedia.add);

app.listen(8080, function () {});