var pipeline = require('../lib/pipeline'),
    pipelines = require('../config/pipelines')
;

(function() {
    module.exports.test = function() {
        console.log('\nPATH\n');
        test_bad_pipeline();
        test_pipelines();
    };

    var PDF_BIN = 'XXXpdfcontentXXX',
        DISPLAY_AD = {pdf: PDF_BIN}
    ;

    function test_bad_pipeline() {
        expect_error('can not input nonsense', function() {
            pipeline().inputs('nonsense');
        });
        expect_error('can not convert pdf to html', function() {
            pipeline().inputs('pdf').converts('pdf', 'html');
        });
        console.log('bad_pipeline: PASS');
    }

    function test_pipelines() {
        console.log('XXXtest_ad', {
            in: DISPLAY_AD,
            out: pipelines.display_ad.execute(DISPLAY_AD)
        });
        console.log('pipelines: PASS');
    }

    function expect_error(expected_error, fn) {
        try {
            fn();
            throw new Error('should have received error "' + expected_error + '"');
        } catch(e) {
            if ((e.message || null) != expected_error) {
                throw e
            }
        }
    }

})();

module.exports.test();
