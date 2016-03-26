var resource_types = require('./resource_types.js');

(function() {

    module.exports = pipeline; // module acts as a function

    function pipeline(name) {
        var operations = [];

        function chainable(fn) { return function() { fn.apply(this, arguments); return path; }; }

        var path = {
            name: name,

            inputs: chainable(function(from_type, options) {
                if (!(resource_types.BY_NAME[from_type]))
                    throw new Error('can not input ' + from_type);
                operations.push(['input', options, from_type]);
            }),
            converts: chainable(function(from_type, to_type, options) {
                if (!((resource_types.BY_NAME[from_type] || {conversions:{}}).conversions[to_type]))
                    throw new Error('can not convert ' + from_type + ' to ' + to_type);
                operations.push(['convert', options, from_type, to_type]);
            }),
            outputs: chainable(function(from_type, options) {
                operations.push(['output', options, from_type]);
            }),

            execute: function(inputs) {
                var resources_by_type = {}, outputs = [];

                return {
                    operations: operations,
                    operation_results:
                        operations.map(function(operation) {
                            var op_type = operation[0],
                                options = operation[1] || {},
                                from_type = operation[2],
                                to_type = operation[3],

                                ass = options['as'] || null
                                ;
                            return { input: input, convert: convert, output:  output }[op_type]();

                            function input() { return resources_by_type[ass || from_type] = inputs[from_type] = store(from_type, inputs[from_type]); }
                            function convert() { return resources_by_type[ass || to_type] = resources_by_type[from_type].convert_to(to_type); }
                            function output() { var ret; outputs.push(ret = resources_by_type[from_type]); return ret; }
                        }),
                    outputs: outputs.map(function(output) { return output.issue_request(); })
                };
            }
        };

        return path;
    }

    function store(resource_type_name, resource_content) {
        return storage_proxy(resource_type_name, resource_content);
    }

    function storage_proxy(resource_type_name, resource_content) {
        return resource_proxy(resource_type_name, function() {
            return store_resource(resource_type_name, resource_content);
        });
    }

    function conversion_proxy(resource_type_name, parent_resource) {
        return resource_proxy(resource_type_name, function() {
            return store_conversion(resource_type_name, parent_resource.issue_request());
        });
    }

    function resource_proxy(resource_type_name, issue_request) {
        var resource_type, proxyId;

        if (!(resource_type = resource_types.BY_NAME[resource_type_name])) {
            throw new Error('invalid resource type name ' + resource_type_name);
        }

        var ret_proxy = {
            resource_type:  resource_type,
            convert_to:     function(resource_type_name) { return conversion_proxy(resource_type_name, ret_proxy); },
            issue_request:  function() { return proxyId || (proxyId = issue_request()); }
        };
        return ret_proxy;

    }

    // TODO: move storage to a separate module.
    var store_counter = 0; // TODO: use real uuids
    function store_resource(resource_type_name, resource_content) {
        var resource_id = resource_type_name + store_counter++;
        console.log('XXXsend_a_storage_requestXXX', { from_content: resource_content, to_type: resource_type_name, got_id: resource_id });
        return resource_id;
    }
    function store_conversion(resource_type_name, parent_id) {
        var resource_id = parent_id  + '-' + resource_type_name + store_counter++;
        console.log('XXXsend_a_conversion_requestXXX', { from_parent_id: parent_id, to_type: resource_type_name, got_id: resource_id });
        return resource_id;
    }

})();
