var pipelines = require('./config/pipelines'),
    cloud_strategies = require('./config/cloud_strategies')
;

(function() {
    pipelines.deploy_using_cloud_strategy(cloud_strategies.BY_NAME.local);
})();