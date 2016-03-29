var extend = require('extend'),

    pipeline = require('../lib/pipeline');

(function() {

    // Instantiate pipelines; each will receive a POST entry point.
    var pipelines = [

        pipeline('display_ad')
            .inputs('pdf')              // Define one or more required POST inputs...

            .converts('pdf', 'image')   // ...which are fed through a conversion pipeline asynchronously...
            .converts('pdf', 'text')
            .converts('text', 'html')

            .outputs('image')           //...until the outputs are produced.
            .outputs('html'),

        pipeline('liner_ad')
            .inputs('html')
            //.inputs('image+')
    ];

    module.exports = {
        AS_ARRAY: pipelines,
        BY_NAME: pipelines.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {})
    };

})();
