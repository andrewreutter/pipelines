var

    pipeline = require('./lib/pipeline'),                   // library for defining and deploying media pipelines

    pipelines = require('./config/pipelines'),              // pipelines defined for this application; read it next!
    cloud_strategies = require('./config/cloud_strategies') // deployment strategies for this application
;

(function() {

    // Deploy the pipelines defined for this application using the "local" deployment strategy.
    pipeline.deploy_pipelines_using_cloud_strategy(pipelines.AS_ARRAY, cloud_strategies.BY_NAME.local);

})();