(function() {

    var resource_types_array = [
        {name: 'pdf',   conversions: {image: pdf_to_image, text: pdf_to_text}},
        {name: 'image', conversions: {text: image_to_text}},
        {name: 'text',  conversions: {html: text_to_html}},
        {name: 'html',  conversions: {text: html_to_text}}
    ];
    resource_types_array.forEach(function(resource_type) {
        resource_type.toJSON = function() {
            return resource_type.name;
        }
    });

    module.exports = {
        AS_ARRAY: resource_types_array,
        BY_NAME: resource_types_array.reduce(function(RTBN, r_t) { RTBN[r_t.name] = r_t; return RTBN; }, {})
    };

    // TODO: implement
    function pdf_to_image(bin) {}
    function pdf_to_text(bin) {}
    function image_to_text(bin) {}
    function text_to_html(bin) {}
    function html_to_text(bin) {}

})();

