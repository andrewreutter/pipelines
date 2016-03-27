var extend = require('extend'),
    q = require('q'),
    request = require('request')
;

(function() {
    module.exports = cloud_strategy;

    function cloud_strategy(strategy_name, options) {
        options = extend({
            make_cloud_store:           function(storage_name) { throw new Error('cloud_strategy ' + strategy_name + ' does not define make_json_store'); },
            make_post_url_for_function: function(fn_name, fn)  { throw new Error('cloud_strategy ' + strategy_name + ' does not define trigger_function_by_post_to'); }
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
                    return make_cloud_function(fn_name, function(data, context) {
                        var storage_id;
                        try {
                            storage_id = cloud_store.create(data);
                            context.success(storage_id);
                        } catch(e) {
                            context.failure(e);
                        }
                    });
                }
            }, cloud_store);
        }

        function make_cloud_function(fn_name, fn) {
            return {
                trigger_by_post: function() {
                    var post_url = options.make_post_url_for_function(fn_name, fn);
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
})();