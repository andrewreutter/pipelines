(function() {

    var express = require('express'),
        bodyParser = require('body-parser'),

        pipelines = require('./config/pipelines'),

        FIRST_PORT = 3000,
        current_port = FIRST_PORT,
        next_port = function() { return current_port++; }
    ;


    pipelines.AS_ARRAY.forEach(function(pipeline) {
        var app = express(),
            pipeline_url = '/pipeline/' + pipeline.name,
            pipeline_port = next_port()
            ;

        app.use(bodyParser.json());

        pipeline.inputs().forEach(function(input) {
            console.info('\tinput', input)
        });
        pipeline.converts().forEach(function(input) {
            console.info('\tconvert', input)
        });
        pipeline.outputs().forEach(function(input) {
            console.info('\toutput', input)
        });

        app.get(pipeline_url, function (req, res) {
            res.send('Hello ' + pipeline.name + '!')
        });
        app.post(pipeline_url, function (req, res) {
            res.send(pipeline.execute(req.body));
        });

        app.listen(pipeline_port, function () {
            console.info('Serving pipeline at ' + pipeline_url + ':' + pipeline_port);
        });
    });

})();