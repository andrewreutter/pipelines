(function() {

    var express = require('express'),
        bodyParser = require('body-parser'),

        pipelines = require('./config/pipelines')
        ;

    var app = express();
    app.use(bodyParser.json());

    pipelines.AS_ARRAY.forEach(function(pipeline) {
        var pipeline_url = '/pipeline/' + pipeline.name;
        console.info('serving pipeline at ' + pipeline_url);

        //pipeline.inputs().forEach(function(input) {
        //    console.log('XXXInput', input)
        //});

        app.get(pipeline_url, function (req, res) {
            res.send('Hello ' + pipeline.name + '!')
        });
        app.post(pipeline_url, function (req, res) {
            res.send(pipeline.execute(req.body));
        });
    });

    app.get('/', function (req, res) {
        res.send('Hello World!');
    });

    app.listen(3000, function () {
        console.log('Example app listening on port 3000!');
    });
})();