/**
 * This module acts as a constructor: require('cloudable')('my_cloudable', function(input, output) { ... });
 */

var q = require('q');

(function() {

    module.exports = {
        cloudable:        cloudable,
        named_cloudables: named_cloudables
    };
    //cloudable.deploy_pipelines_using_cloud_strategy = deploy_pipelines_using_cloud_strategy; TODO: remove or replace

    /**
     *
     * @param cloudable_map {fn_name: cloudable_fn, ...}
     * @returns {*} {fn_name: cloudable, ...}
     */
    function named_cloudables(cloudable_map) {
        return Object.keys(cloudable_map).reduce(
            function(out, name) { out[name] = cloudable(cloudable_map[name]); return out; },
            {}
        );
    }

    /**
     *
     * @param fn: function(input, output) { output.[success|failure|promise|trycatch](...); }
     * @returns function(input) { return promise(output); }
     */
    function cloudable(fn) {

        return call;

        function call(input) {
            var deferred = q.defer();
            var output = {

                // Like GButt functions
                success: function(success) { deferred.resolve(success); },
                failure: function(failure) { deferred.reject(failure); },

                // Common patterns atop success/failure.
                promise: function(promise) {
                    promise.then(
                        function(success) { output.success(success); },
                        function(failure) { output.failure(failure); }
                    );
                },
                trycatch: function(fn) {
                    try {
                        output.success(fn());
                    } catch(e) {
                        output.failure(e);
                    }
                }
            };

            try {
                fn(input, output);
            } catch(e) {
                output.failure(e);
            }

            return deferred.promise;
        }
    }
})();
