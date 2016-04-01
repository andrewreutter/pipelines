/**
 * This module acts as a constructor: require('cloudable')('my_cloudable', function(input, output) { ... });
 */

var q = require('q'),
    extend = require('extend')
    ;

(function() {

    module.exports = {
        cloudable:        cloudable,
        graph: graph,
        strategy:         strategy,
        //express_strategy: express_strategy
    };

    /**
     *
     * @param cloudable_map {fn_name: cloudable_fn, ...}
     * @returns {*} {fn_name: cloudable, ...}
     */
    function graph(cloudable_map) {
        var graph =  {
            inputs: [],
            connections: {}, // {from: [to, ...]}

            input: function(name) { graph.inputs.push(name); return graph; },
            connect: function(from_name, to_name) {
                ( graph.connections[from_name] = graph.connections[from_name] || [] )
                    .push(to_name);
                return graph;
            },

            by_name: Object.keys(cloudable_map).reduce(
                function(out, name) { out[name] = cloudable(cloudable_map[name]); return out; },
                {}
            )
        };
        return graph;
    }

    /**
     *
     * @param fn: function(input) { return value or return promise or throw an Error(message) }
     * @returns function(input) { return promise(output); }
     */
    function cloudable(fn) {

        return call;

        function call(input) {
            var deferred = q.defer(), output;

            try {
                output = fn(input);
                q.when(output).then(
                    function(success) { deferred.resolve(success); },
                    function(error)   { deferred.reject(error); }
                );
            } catch(e) {
                deferred.reject(e);
            }

            return deferred.promise;
        }
    }


    express_strategy = strategy({
        //post: local_post,
        //pub: local_pub,
        //sub: local_sub
        //make_cloud_store:                      make_local_cloud_store,
        //make_cloud_store_trigger_for_function: make_local_cloud_store_trigger_for_function,
        //make_post_trigger_for_function:        make_local_post_trigger_for_function
    });

    function strategy(transports) {
        return extend({}, transports, {
            deploy: function(graph) {

            }
        });
    }
})();
