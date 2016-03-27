var q = require('q');

var resource_types = require('./resource_types.js');

(function() {

    module.exports = pipeline; // module acts as a function

    function pipeline(name) {
        var operations = [];

        var path = {
            name: name,

            inputs: chainable_getter_adder('input', function(from_type, options) {
                if (!(resource_types.BY_NAME[from_type]))
                    throw new Error('can not input ' + from_type);
                operations.push(['input', options, from_type]);
            }),
            converts: chainable_getter_adder('convert', function(from_type, to_type, options) {
                if (!((resource_types.BY_NAME[from_type] || {conversions:{}}).conversions[to_type]))
                    throw new Error('can not convert ' + from_type + ' to ' + to_type);
                operations.push(['convert', options, from_type, to_type]);
            }),
            outputs: chainable_getter_adder('output', function(from_type, options) {
                operations.push(['output', options, from_type]);
            }),

            execute: function(inputs, strategy) {
                var resources_by_type = {},
                    outputs = [],
                    operation_results = operations.map(function(operation) {
                        var op_type = operation[0],
                            options = operation[1] || {},
                            from_type = operation[2],
                            to_type = operation[3],

                            named = options['named'] || null
                            ;
                        return { input: input, convert: convert, output:  output }[op_type]();

                        function input() { return resources_by_type[named || from_type] = inputs[from_type] = store(from_type, inputs[from_type]); }
                        function convert() { return resources_by_type[named || to_type] = resources_by_type[from_type].convert_to(to_type); }
                        function output() { var ret; outputs.push(ret = resources_by_type[from_type]); return ret; }
                    }),

                    output_promises = outputs.map(function(output) { return output.issue_request(); })
                ;

                return q.all(output_promises)
                    //.then(function(request_ids) {
                    //    return {
                    //        inputs: inputs,
                    //        operations: operations,
                    //        operation_results: operation_results,
                    //        outputs: request_ids
                    //    };
                    //})
                ;


                function store(resource_type_name, resource_content) {
                    return storage_proxy(resource_type_name, resource_content);
                }

                function storage_proxy(resource_type_name, resource_content) {
                    return resource_proxy(resource_type_name, function() {
                        return strategy.store_resource(resource_type_name, resource_content);
                    });
                }

                function conversion_proxy(resource_type_name, parent_resource) {
                    return resource_proxy(resource_type_name, function() {
                        return parent_resource.issue_request()
                            .then(function(parent_id) {
                                return strategy.store_conversion_request(parent_id, resource_type_name);
                            })
                        ;
                    });
                }

                function resource_proxy(resource_type_name, issue_request) {
                    var resource_type, id_promise;

                    if (!(resource_type = resource_types.BY_NAME[resource_type_name])) {
                        throw new Error('invalid resource type name ' + resource_type_name);
                    }

                    var ret_proxy = {
                        resource_type:  resource_type,
                        convert_to:     function(resource_type_name) { return conversion_proxy(resource_type_name, ret_proxy); },
                        issue_request:  function() { return id_promise || (id_promise = issue_request()); }
                    };
                    return ret_proxy;

                }
            }
        };

        return path;

        function chainable_getter_adder(operation, fn) {
            return function() {
                if (arguments.length) {
                    fn.apply(this, arguments);
                    return path;
                } else {
                    return operations.filter(function(op) { return op[0] === operation; })
                }
            };
        }
    }

})();
