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

        //pipeline('display_ad_magical')
        //
        //  .inputs('pdf+')                                           // Input one or more PDFs
        //  .inputs('manifest')                                       // and a manifest,
        //  .converts('pdf', {to: 'adrequest', using:'requester'})    // generating an ad for each PDF.
        //
        //  .converts('pdf',      {to:'image',  using:'imager'})
        //  .converts('pdf',      {to:'hash',   using:'hasher'})
        //  .converts('pdf',      {to:'text',   using:'ocr',     as:'autotext'})
        //  .converts('autotext', {to:'text',   using:'review'})
        //  .converts('text',     {to:'text',   using:'slugify', as:'slug'})
        //
        //  .converts('manifest', {to:'entry+', using:'parser'})
        //  .converts('entry', 'text', 'image',
        //    {to:'associations', using:'associator'})                // business, publisher...
        //  .converts('entry', 'text', 'image',
        //    {to:'classifications', using:'classifier'})
        //
        //  .converts('adrequest', 'image', 'hash', 'slug', 'associations', 'classification',
        //    {to:'ad', using:'responder'})
        //
        //  .outputs('ad+'),

        pipeline('liner_ad')
            .inputs('html')
            //.inputs('image+')
    ];

    module.exports = {
        AS_ARRAY: pipelines,
        BY_NAME: pipelines.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {})
    };

})();
