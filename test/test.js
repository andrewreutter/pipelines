var q = require('q'),

    pipeline = require('../lib/pipeline'),
    pipelines = require('../config/pipelines')
;

(function() {
    module.exports.test = function() {
        test_bad_pipelines();
        test_pipelines();
        test_cloud_strategies();
    };

    var PDF_BIN = 'XXXpdfcontentXXX',
        DISPLAY_AD = {pdf: PDF_BIN}
    ;

    function test_bad_pipelines() {
        expect_success('bad_pipelines', function() {
            expect_error('can not input nonsense', function() {
                pipeline().inputs('nonsense');
            });
            expect_error('can not convert pdf to html', function() {
                pipeline().inputs('pdf').converts('pdf', 'html');
            });
        });
    }

    function test_pipelines() {
        expect_success('pipelines.display_ad', function() {
            return pipelines.BY_NAME['display_ad'].execute(DISPLAY_AD, {
                store_resource: function(resource_type_name, resource_content) { return q.defer().promise; },
                store_conversion_request: function(parent_id, resource_type_name) { return q.defer().promise; }
            });
        });
    }

    function test_cloud_strategies() {

        cloud_strategies.AS_ARRAY.map(test_strategy);
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
    function expect_success(label, fn) {
        var out;
        try {
            out = fn();
            console.log('PASS: ' + label + '\n', {
                output: out
            });
        } catch(e) {
            console.log('FAIL: ' + label + '\n', e);
            throw e
        }

    }

    function expect_error(expected_error, fn) {
        try {
            fn();
            console.log('FAIL: ' + expected_error + ' was not received');
        } catch(e) {
            if (e.message === expected_error) {
                console.log('PASS: ' + expected_error);
            } else {
                console.log('FAIL: ' + expected_error);
                throw e;
            }
        }
    }

})();

module.exports.test();


