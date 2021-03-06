var express = require('express');
var app = express();

var bodyParser = require('body-parser');

var encyclopedia = require('./encyclopedia');
var cartographer = require('./cartographer');

app.use(express.static('app'));

app.use(bodyParser.json());
app.post('/encyclopedia/add', encyclopedia.add);
app.get('/encyclopedia/missing-links', encyclopedia.collectMissingLinks);
app.use('/encyclopedia/links-to', encyclopedia.getLinksTo);

app.post('/cartographer/add', cartographer.add);

app.listen(8080, function () {});