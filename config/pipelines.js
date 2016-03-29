var extend = require('extend'),

    pipeline = require('../lib/pipeline');

(function() {
    var pipelines = [

        pipeline('display_ad')
            .inputs('pdf')

            .converts('pdf', 'image')
            .converts('pdf', 'text')
            .converts('text', 'html')

            .outputs('image')
            .outputs('html'),

        pipeline('liner_ad')
            .inputs('html')
            //.inputs('image+')
    ];

    module.exports = {
        AS_ARRAY: pipelines,
        BY_NAME: pipelines.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {}),
        deploy_using_cloud_strategy: deploy_using_cloud_strategy
    };

    function deploy_using_cloud_strategy(cloud_strategy) {

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
