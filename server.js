var q = require('q'),
    request = require('request'),
    extend = require('extend'),
    express = require('express'),
    bodyParser = require('body-parser'),

    pipelines = require('./config/pipelines'),
    cloud_strategies = require('./config/cloud_strategies')
;

(function() {

    var cloud_strategy = cloud_strategies.BY_NAME.local,

        media_store = cloud_strategy.make_cloud_store('resource'),
        conversion_request_store = cloud_strategy.make_cloud_store('conversion_request'),

        create_media_store = media_store.make_create_function('create-resource').trigger_by_post(),
        create_conversion_request = conversion_request_store.make_create_function('create-conversion-request').trigger_by_post()
    ;

    pipelines.AS_ARRAY.forEach(function(pipeline) {

        var cloud_pipeline = cloud_strategy.make_cloud_function('pipeline-' + pipeline.name, exec_pipeline),
            post_to_cloud_pipeline = cloud_pipeline.trigger_by_post()
        ;
        function exec_pipeline(data, context) {
            pipeline.execute(data, {
                store_resource: function(resource_type_name, resource_content) {
                    return create_media_store({resource_type: resource_type_name, content: resource_content});
                },
                store_conversion_request: function(parent_id, resource_type_name) {
                    return create_conversion_request({from_id: parent_id, resource_type: resource_type_name});
                }
            })
                    .then(
                        function(success) { context.success(success); },
                        function(failure) { context.failure(failure); }
                    )
            ;
        }
    });

    // TODO: MURDER

    //var FIRST_PORT = 3000,
    //    current_port = FIRST_PORT,
    //    next_port = function() { return current_port++; }
    //;
    //
    //var storage_counter = 0,
    //    storage = {},
    //    store = function(ob) {
    //        var ob_id = '' + storage_counter++;
    //        storage[ob_id] = JSON.stringify(extend({id: ob_id}, ob));
    //        return ob_id;
    //    },
    //    retrieve = function(id) {
    //        return JSON.parse(storage[ob_id]);
    //    }
    //;
    //
    //var
    //    resource_storage_app = make_storage_app('resource'),
    //    conversion_storage_app = make_storage_app('conversion_request')
    //;
    //
    //pipelines.AS_ARRAY.forEach(function(pipeline) {
    //
    //    var input_strategy = {
    //            store_resource: function(resource_type_name, resource_content) {
    //                return resource_storage_app.post_to({resource_type: resource_type_name, content: resource_content});
    //            },
    //            store_conversion_request: function(parent_id, resource_type_name) {
    //                return conversion_storage_app.post_to({from_id: parent_id, resource_type: resource_type_name});
    //            }
    //        },
    //        input_app = make_app({
    //            port: next_port(),
    //            url: '/pipeline/' + pipeline.name,
    //            get: function(req, res) { res.send('Hello ' + pipeline.url + '!'); },
    //            post: function(req, res) { res.send(pipeline.execute(req.body, input_strategy)); }
    //        })
    //            .listen(function () {
    //                console.info('Serving pipeline at ' + input_app.url);
    //            })
    //    ;
    //
    //    pipeline.inputs().forEach(function(input) {
    //        //var app = make_app('/pipeline/' + pipeline.name, {
    //        //    url: '',
    //        //    get: function() { res.send('Hello ' + pipeline.name + '!'); },
    //        //    post: function() { res.send(pipeline.execute(req.body)); }
    //        //});
    //        //app.listen(pipeline_port, function () {
    //        //    console.info('Serving pipeline storage at :' + pipeline_port + pipeline_port);
    //        //});
    //    });
    //    pipeline.converts().forEach(function(input) {
    //        console.info('\tconvert', input)
    //    });
    //    pipeline.outputs().forEach(function(input) {
    //        console.info('\toutput', input)
    //    });
    //});
    //
    //function make_storage_app(table_name) {
    //    var app = make_app({
    //        port: next_port(),
    //        url: '/pipeline_storage/' + table_name,
    //        get: function(req, res) { res.send('Hello storage ' + app.url + '!'); },
    //        post: function(req, res) { res.send(store(extend({type:table_name}, req.body))); console.log('XXXstorage', storage); }
    //    })
    //        .listen(function () {
    //            console.info('Serving ' + table_name + ' storage at ' + app.url);
    //        })
    //    ;
    //    return app;
    //}
    //
    //function make_app(options) {
    //    var app_port = options.port,
    //        url = function() { return 'http://localhost:' + app_port + options.url; },
    //        app = express()
    //    ;
    //
    //    app.use(bodyParser.json());
    //
    //    app.get (options.url, function (req, res) { return options.get (req, res); });
    //    app.post(options.url, function (req, res) { return options.post(req, res); });
    //
    //    //return app;
    //    var ret = {
    //        app: app,
    //        url: url(),
    //        listen: function(done) {
    //            app.listen(app_port, done);
    //            app.url = url();
    //            return ret;
    //        },
    //        post_to: function(content) {
    //            var ptq = q.defer();
    //            request({
    //                url: url(),
    //                method: 'POST',
    //                json: content
    //            }, function(error, response, body) {
    //                if (error || response.statusCode !== 200) {
    //                    ptq.reject(error || response);
    //                } else if (response) {
    //                    ptq.resolve(JSON.parse(body));
    //                }
    //            });
    //            return ptq.promise;
    //        }
    //    };
    //    return ret;
    //
    //}

})();