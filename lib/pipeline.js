/**
 * This module acts as a constructor: require('pipeline')('my_pipeline')
 */
var q = require('q');

var resource_types = require('./resource_types.js');

(function() {

    pipeline.deploy_pipelines_using_cloud_strategy = deploy_pipelines_using_cloud_strategy;
    module.exports = pipeline; // module acts as a function

    function pipeline(name) {
        var operations = [];

        var ret_pipeline = {
            name: name,
            deploy_using_cloud_strategy: deploy_using_cloud_strategy,

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

                return q.all(output_promises);


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

        return ret_pipeline;

        function chainable_getter_adder(operation, fn) {
            return function() {
                if (arguments.length) {
                    fn.apply(this, arguments);
                    return ret_pipeline;
                } else {
                    return operations.filter(function(op) { return op[0] === operation; })
                }
            };
        }

        function deploy_using_cloud_strategy(cloud_strategy, create_media, create_conversion_request) {

            cloud_strategy.make_cloud_function('pipeline-' + ret_pipeline.name, exec_pipeline).trigger_by_post();

            function exec_pipeline(data, context) {
                ret_pipeline.execute(data, {
                    store_resource: function(resource_type_name, resource_content) {
                        return create_media({resource_type: resource_type_name, content: resource_content});
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
        }
    }

    function deploy_pipelines_using_cloud_strategy(pipelines, cloud_strategy) {

        var media_store = cloud_strategy.make_cloud_store('media'),
            create_media = media_store.make_create_function('create-media').trigger_by_post(),
            search_media = media_store.make_search_function('search-media').trigger_by_post(),

            conversion_request_store = cloud_strategy.make_cloud_store('conversion_request'),
            create_conversion_request = conversion_request_store.make_create_function('create-conversion-request').trigger_by_post(),
            search_conversion_request = conversion_request_store.make_search_function('search-conversion-request').trigger_by_post()

            ;

        cloud_strategy.make_cloud_function('process-conversions-from-media', on_media_crud).trigger_by_cloud_store(media_store);
        cloud_strategy.make_cloud_function('process-conversions-from-requests', on_conversion_crud).trigger_by_cloud_store(conversion_request_store);

        pipelines.forEach(function(pipeline) {
            pipeline.deploy_using_cloud_strategy(cloud_strategy, create_media, create_conversion_request);
        });

        function conversions_into_context(data_id, media, conversion, context) {
            search_conversion_request({from_id:data_id})
                .then(
                function(waiting_conversions) {
                    var conversions = waiting_conversions.map(function(conversion_request) {
                        process_conversion(conversion_request, media);
                    });
                    context.success(conversions);
                },
                function(error) {
                    context.error(error);
                }
            );
        }
        function on_media_crud(data, context) {
            if (data.operation === 'create') {
                conversions_into_context(data.data.id, data.data, null, context);
            }
        }
        function on_conversion_crud(data, context) {
            if (data.operation === 'update') {
                conversions_into_context(data.data.id, null, data.data, context);
            }
            if (data.operation === 'create') {
                search_media({id:data.data.from_id})
                    .then(
                    function(medias) {
                        if (medias.length) {
                            process_conversion(data.data, medias[0]);
                        }
                        context.success(data.data)
                    },
                    function(error) {
                        context.error(error);
                    }
                )
            }
        }

        function process_conversion(conversion_request, media) {
            // TODO: use real converters
            var converted_media = {
                id: conversion_request.id,
                resource_type:conversion_request.resource_type,
                content: 'CMCONVERTEDXXX'
            };
            return create_media(converted_media)
                .then(
                function(success) {
                },
                function(error) {}
            )
                ;
        }
    }

})();
