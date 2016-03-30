/**
 * This module acts as a constructor: require('cloud_strategy')('my_strategy', options)
 *
 * An example local implementation using express and in-memory storage is found at require('cloud_strategy').LOCAL
 */
var extend = require('extend'),
    q = require('q'),

    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request')
;

(function() {
    var LOCAL_PORT = 3000,
        current_port = LOCAL_PORT,
        next_port = function() { return current_port++; }
        ;

    cloud_strategy.LOCAL = {
        make_cloud_store:                      make_local_cloud_store,
        make_cloud_store_trigger_for_function: make_local_cloud_store_trigger_for_function,
        make_post_trigger_for_function:        make_local_post_trigger_for_function
    };
    module.exports = cloud_strategy;

    function cloud_strategy(strategy_name, options) {
        options = extend({
            make_cloud_store:               function(storage_name) { throw new Error('cloud_strategy ' + strategy_name + ' does not define make_cloud_store'); },
            make_post_trigger_for_function: function(fn_name, fn)  { throw new Error('cloud_strategy ' + strategy_name + ' does not define make_post_trigger_for_function'); },
            make_cloud_store_trigger_for_function: function(cloud_store, fn)  { throw new Error('cloud_strategy ' + strategy_name + ' does not define make_cloud_store_trigger_for_function'); }
        }, options || {});

        var strategy = {
            name: strategy_name,
            make_cloud_store: make_cloud_store,
            make_cloud_function: make_cloud_function
        };

        return strategy;

        function make_cloud_store(storage_name) {
            var cloud_store = options.make_cloud_store(storage_name);
            return extend({
                make_create_function: function(fn_name) {
                    return make_crud_function(fn_name, cloud_store.create);
                },
                make_update_function: function(fn_name) {
                    return make_crud_function(fn_name, cloud_store.update);
                },
                make_search_function: function(fn_name) {
                    return make_cloud_function(fn_name, function(data, context) {
                        var matches = cloud_store.search(data);
                        context.success(matches);
                    })
                }
            }, cloud_store);

            function make_crud_function(fn_name, cloud_store_method) {
                return make_cloud_function(fn_name, function(data, context) {
                    var storage_id;
                    try {
                        storage_id = cloud_store_method(data);
                        context.success(storage_id);
                    } catch(e) {
                        context.failure(e);
                    }
                });
            }
        }

        function make_cloud_function(fn_name, fn) {
            return {
                trigger_by_cloud_store: function(cloud_store) {
                    return options.make_cloud_store_trigger_for_function(cloud_store, fn);
                },
                trigger_by_post: function() {
                    var post_url = options.make_post_trigger_for_function(fn_name, fn);
                    return post_to;

                    function post_to(content) {
                        var ptq = q.defer();
                        request({ url: post_url, method: 'POST', json: content }, handle_response);
                        return ptq.promise;

                        function handle_response(error, response, body) {
                            if (error || response.statusCode !== 200) {
                                ptq.reject(error || response);
                            } else if (response) {
                                ptq.resolve(body); // has already been JSON.parse()d apparently
                            } else {
                                console.log('WATXXX', arguments);
                            }
                        }
                    }
                }
            };
        }
    }

    function make_local_cloud_store(storage_name) {
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
    }

    function make_local_cloud_store_trigger_for_function(cloud_store, fn) {
        cloud_store.oncrud(function(op, ob) {
            fn({operation:op, data:ob}, {
                success: function(success) {},
                failure: function(failure) {},
                done:    function(message) {}
            });
            console.info('Served function at crud://' + cloud_store.name + '(' + JSON.stringify(ob) + ') => ');
        });
        console.info('Serving function at crud://' + cloud_store.name);
    }

    function make_local_post_trigger_for_function(fn_name, fn) {
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

})();