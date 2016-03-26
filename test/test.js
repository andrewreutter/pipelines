var pipeline = require('../lib/pipeline'),
    pipelines = require('../config/pipelines')
;

(function() {
    module.exports.test = function() {
        test_bad_pipelines();
        test_pipelines();
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
            return pipelines.BY_NAME['display_ad'].execute(DISPLAY_AD);
        });
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
