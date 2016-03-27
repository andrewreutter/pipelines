var pipeline = require('../lib/pipeline');

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

        var media_store = cloud_strategy.make_cloud_store('resource'),
            conversion_request_store = cloud_strategy.make_cloud_store('conversion_request'),

            create_media_store = media_store.make_create_function('create-resource').trigger_by_post(),
            create_conversion_request = conversion_request_store.make_create_function('create-conversion-request').trigger_by_post()
            ;

        pipelines.forEach(function(pipeline) {

            var cloud_pipeline = cloud_strategy.make_cloud_function('pipeline-' + pipeline.name, exec_pipeline),
                post_to_cloud_pipeline = cloud_pipeline.trigger_by_post()
                ;
            function exec_pipeline(data, context) {
                pipeline.execute(data, {
                    store_resource: function(resource_type_name, resource_content) {
                        return create_media_store({resource_type: resource_type_name, content: resource_content});
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
        });

    }


})();
