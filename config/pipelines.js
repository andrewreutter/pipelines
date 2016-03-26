var pipeline = require('../lib/pipeline');

(function() {
    module.exports = {

        display_ad: pipeline('display_ad')
            .inputs('pdf')

            .converts('pdf', 'image')
            .converts('pdf', 'text')
            .converts('text', 'html')

            .outputs('image')
            .outputs('html'),

        liner_ad:   pipeline('liner_ad')
            .inputs('html')
            //.inputs('image+')
    };

})();
