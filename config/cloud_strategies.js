var express = require('express'),
    bodyParser = require('body-parser'),
    extend = require('extend'),

    cloud_strategy = require('../lib/cloud_strategy')
;

(function() {
    var LOCAL_PORT = 3000,
        current_port = LOCAL_PORT,
        next_port = function() { return current_port++; };

    var strategies = [
        cloud_strategy('local', {
            make_cloud_store: function(storage_name) {
                var storage_counter = 0,
                    storage = {},
                    oncruds = []
                ;
                return {
                    name: storage_name,

                    create: function(ob) {
                        var ob_with_id = store(storage_name + '.' + storage_counter++, ob);
                        send_cruds('create', ob_with_id);
                        return ob_with_id.id;
                    },
                    update: function(ob) {
                        var ob_with_id = store(ob.id, ob);
                        send_cruds('update', ob_with_id);
                        return ob_with_id.id;
                    },
                    search: function(filter) {
                        var filter_keys = Object.keys(filter);
                        var matches = Object.keys(storage)
                            .map(function(key) { return JSON.parse(storage[key]); })
                            .filter(function(ob) {
                                return !filter_keys.some(function(filter_key) {
                                    return filter[filter_key] !== ob[filter_key];
                                })
                            });
                        return matches;
                    },
                    read: function(ob_id) {
                        var val = storage[ob_id];
                        return (val ? JSON.parse(val) : nil);
                    },
                    delete: function(ob_id) {
                        var val = storage[ob_id],
                            ret = null
                        ;
                        if (val) {
                            var ob_with_id = JSON.parse(val);
                            delete storage[ob_id];
                            send_cruds('delete', ob_with_id);
                            ret = ob_with_id.id;
                        }
                        return ret;
                    },
                    oncrud: function(callback) { oncruds.push(callback); }
                };

                function store(ob_id, ob) {
                    var ob_with_id = extend({id: ob_id}, ob);
                    storage[ob_id] = JSON.stringify(ob_with_id);
                    return ob_with_id;
                }

                function send_cruds(op, ob) {
                    setTimeout(function() {
                        oncruds.forEach(function(callback) { callback(op, ob); });
                    });
                }
            },
            make_cloud_store_trigger_for_function: function(cloud_store, fn) {
                cloud_store.oncrud(function(op, ob) {
                    fn({operation:op, data:ob}, {
                        success: function(success) {},
                        failure: function(failure) {},
                        done:    function(message) {}
                    });
                    console.info('Served function at crud://' + cloud_store.name + '(' + JSON.stringify(ob) + ') => ');
                });
                console.info('Serving function at crud://' + cloud_store.name);
            },
            make_post_trigger_for_function: function(fn_name, fn) {
                var app_port = next_port(),
                    route = '/' + fn_name,
                    url = 'http://localhost:' + app_port + route,
                    app = express()
                ;

                app.use(bodyParser.json());
                app.post(route, function (req, res) {
                    var context = {
                        success: function(message) {
                            console.info('Served function at ' + url + '(' + JSON.stringify(req.body) + ') =>', message);
                            res.send(JSON.stringify(message || ''));
                        },
                        failure: function(message) {
                        },
                        done: function(message) { message ? context.failure(message) : context.success(); }
                    };
                    fn(req.body, context);
                });
                app.listen(app_port, function() {
                    console.info('Serving function at ' + url);
                });

                return url;
            }
        })
    ];

    module.exports = {
        AS_ARRAY: strategies,
        BY_NAME: strategies.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {}),
        test: test
    };

    function test() {

        module.exports.AS_ARRAY.map(test_strategy);

        function test_strategy(strategy) {
            var cloud_hellos = strategy.make_cloud_store('hellos'),
                cloud_create_hello = cloud_hellos.make_create_function('create-hello', cloud_hellos),
                post_to_cloud_create_hello = cloud_create_hello.trigger_by_post(),

                cloud_helloworld = strategy.make_cloud_function('helloworld', helloworld),
                post_to_helloworld = cloud_helloworld.trigger_by_post()
            ;

            post_to_helloworld({wat: 'I am that I am'})
                .then(function(message) {
                    console.log('PASS post_to_helloworld:', message);
                }, function(error) {
                    console.log('FAIL post_to_helloworld:', error);
                })
            ;

            function helloworld(data, context) {
                post_to_cloud_create_hello(data)
                    .then(function(message) {
                        console.log('PASS post_to_cloud_create_hello:', message);
                        context.success(message);
                    }, function(error) {
                        console.log('FAIL post_to_cloud_create_hello:', error);
                        context.failure(error);
                    })
                ;
            }
        }
    }
})();