/**
 * This module acts as a constructor: require('cloudable')('my_cloudable', function(input, output) { ... }); TODO: lies!
 */

var q = require('q'),
    extend = require('extend')
    ;

(function() {

    module.exports = {
        fn:       fn,
        graph:    graph,
        strategy: strategy
        //express_strategy: express_strategy
    };

    /**
     *
     * @param fn: function(input) { return value or return promise or throw an Error(message) }
     * @returns function(input) { return promise(output); }
     */
    function fn(fn) {

        return call;

        function call(input, siblings) {
            var deferred = q.defer(), output;

            try {
                output = fn(input, siblings || {});
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

    /**
     *
     * @param cloudable_map {fn_name: fn, ...}
     * @returns {*} {fn_name: cloudables.fn, ...}
     */
    function graph(cloudable_map) {
        var graph =  {
            inputs: [],
            connects: {}, // {from: [to, ...]}

            input: function(name) { graph.inputs.push(name); return graph; },
            connect: function(from_name, to_name) {
                ( graph.connects[from_name] = graph.connects[from_name] || [] )
                    .push(to_name);
                return graph;
            },

            by_name: Object.keys(cloudable_map).reduce(
                function(out, name) {
                    var fn = module.exports.fn(cloudable_map[name]);
                    out[name] = function(input, siblings) {
                        return fn(input, siblings || graph.by_name);
                    };
                    return out;
                }, {} // last {} initializes out
            )
        };
        return graph;
    }

    /**
     *
     * @param transports {input}
     * @returns {*}
     */
    function strategy(transports) {
        var ret;
        return ret = extend({}, transports, {
            by_name: {},
            deploy: function(graph) {
                Object.keys(graph.by_name).forEach(function(name) {
                    ret.by_name[name] = function(input, siblings) {
                        return graph.by_name[name](input, siblings || ret.by_name);
                    };
                });
                graph.inputs.forEach(function(input_name) {
                    transport.post(input_name, wrap_fn(input_name));
                });

                // Wrap functions that broadcast and TODO pub them
                Object.keys(graph.connects).forEach(function(from_name) {
                    var old_fn = ret.by_name[from_name],
                        to_names = graph.connects[from_name]
                        ;
                    ret.by_name[from_name] = function(input, siblings) {
                        return old_fn(input, siblings).then(
                            function(success) { transport.pub(from_name, success); }
                        );
                    };
                    graph.connects[from_name].forEach(function(to_name) {
                        transport.sub(from_name, ret[by_name]);
                    });
                });
            }
        });
    }

    express_strategy = strategy({
        //post: local_post,
        //pub: local_pub,
        //sub: local_sub
        //make_cloud_store:                      make_local_cloud_store,
        //make_cloud_store_trigger_for_function: make_local_cloud_store_trigger_for_function,
        //make_post_trigger_for_function:        make_local_post_trigger_for_function
    });

})();
