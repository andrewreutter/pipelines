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

        var media_store = cloud_strategy.make_cloud_store('media'),
            conversion_request_store = cloud_strategy.make_cloud_store('conversion_request'),

            create_media = media_store.make_create_function('create-media').trigger_by_post(),
            create_conversion_request = conversion_request_store.make_create_function('create-conversion-request').trigger_by_post()
            ;
        pipelines.forEach(function(pipeline) {
            pipeline.deploy_using_cloud_strategy(cloud_strategy, create_media, create_conversion_request);
        });
    }


})();
