var pipeline = require('../lib/pipeline');

(function() {
    var pipelines = [

        pipeline('display_ad')
            .inputs('pdf')

            .converts('pdf', 'image')
            .converts('pdf', 'text')
            .converts('text', 'html')

            .outputs('image')
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
