var cloud_strategy = require('../lib/cloud_strategy');

(function() {

    var strategies = [
        cloud_strategy('local', {
            make_cloud_store:                       cloud_strategy.LOCAL.make_cloud_store,
            make_cloud_store_trigger_for_function:  cloud_strategy.LOCAL.make_cloud_store_trigger_for_function,
            make_post_trigger_for_function:         cloud_strategy.LOCAL.make_post_trigger_for_function
        })
    ];

    module.exports = {
        AS_ARRAY: strategies,
        BY_NAME: strategies.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {}),
        test: test
    };

    function test() {

        module.exports.AS_ARRAY.map(test_strategy);

        function test_strategy(strategy) {
            var cloud_hellos = strategy.make_cloud_store('hellos'),
                cloud_create_hello = cloud_hellos.make_create_function('create-hello', cloud_hellos),
                post_to_cloud_create_hello = cloud_create_hello.trigger_by_post(),

                cloud_helloworld = strategy.make_cloud_function('helloworld', helloworld),
                post_to_helloworld = cloud_helloworld.trigger_by_post()
            ;

            post_to_helloworld({wat: 'I am that I am'})
                .then(function(message) {
                    console.log('PASS post_to_helloworld:', message);
                }, function(error) {
                    console.log('FAIL post_to_helloworld:', error);
                })
            ;

            function helloworld(data, context) {
                post_to_cloud_create_hello(data)
                    .then(function(message) {
                        console.log('PASS post_to_cloud_create_hello:', message);
                        context.success(message);
                    }, function(error) {
                        console.log('FAIL post_to_cloud_create_hello:', error);
                        context.failure(error);
                    })
                ;
            }
        }
    }

})();