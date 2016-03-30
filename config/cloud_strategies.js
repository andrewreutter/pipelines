var cloud_strategy = require('../lib/cloud_strategy');

(function() {

    var strategies = [

        cloud_strategy('local', {
            make_cloud_store:                       cloud_strategy.LOCAL.make_cloud_store,
            make_cloud_store_trigger_for_function:  cloud_strategy.LOCAL.make_cloud_store_trigger_for_function,
            make_post_trigger_for_function:         cloud_strategy.LOCAL.make_post_trigger_for_function
        })

        //cloud_strategy('aws_lambda', {
        //    // TODO: implement me!
        //})
        //
        //cloud_strategy('google_cloud_functions', {
        //    // TODO: implement me!
        //})
    ];

    module.exports = {
        AS_ARRAY: strategies,
        BY_NAME: strategies.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {})
    };

})();