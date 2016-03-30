var q = require('q'),

    cloudable = require('../lib/cloudable'),
    pipeline = require('../lib/pipeline'),

    cloud_strategies = require('../config/cloud_strategies'),
    pipelines = require('../config/pipelines')
;

(function() {
    module.exports.test = function() {
        test_cloudables();
        test_bad_pipelines();
        test_pipelines();
        test_cloud_strategies();
    };

    function test_cloudables() {
        expect_success('cloudables', function() {
            var cloudables = cloudable.named_cloudables({
                    echo: function(input, output) { output.success(input); }
                })
            ;

            expect_promise('cloudables.echo', cloudables.echo('Hello world'));
        });
    }

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
            return 'yay';
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
            return; // TODO: this hangs because it starts express servers started :-(
            var cloud_hellos = strategy.make_cloud_store('hellos'),
                cloud_create_hello = cloud_hellos.make_create_function('create-hello', cloud_hellos),
                post_to_cloud_create_hello = cloud_create_hello.trigger_by_post(),
                cloud_helloworld = strategy.make_cloud_function('helloworld', helloworld),
                post_to_helloworld = cloud_helloworld.trigger_by_post()
                ;
            expect_promise('post_to_helloworld', post_to_helloworld({wat: 'I am that I am'}));
            function helloworld(data, context) {
                expect_promise('post_to_cloud_create_hello', post_to_cloud_create_hello(data));
            }
        }
    }

    function expect_promise(label, promise) {
        return promise.then(
            function(success) { console.log('PASS:', label, success); },
            function(error)   { console.log('FAIL:', label, error); }
        );
    }

    function expect_success(label, fn) {
        var out;
        try {
            out = fn();
            console.log('PASS:', label, out);
        } catch(e) {
            console.log('FAIL:', label, e);
            throw e;
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


