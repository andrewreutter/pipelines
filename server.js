var pipeline = require('./lib/pipeline'),

    pipelines = require('./config/pipelines'),
    cloud_strategies = require('./config/cloud_strategies')
;

(function() {
    pipeline.deploy_pipelines_using_cloud_strategy(pipelines.AS_ARRAY, cloud_strategies.BY_NAME.local);
})();