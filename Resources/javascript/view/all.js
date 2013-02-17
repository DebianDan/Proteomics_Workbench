// Listen for any attempts to call changePage().
$(document).bind("pagebeforechange", function( e, data ) {

    // We only want to handle changePage() calls where the caller is
    // asking us to load a page by URL.
    if ( typeof data.toPage === "string" ) {
        // We are being asked to load a page by URL, but we only
        // want to handle URLs that request the data for a specific
        // category.
        var u = $.mobile.path.parseUrl( data.toPage ),
            re = /^#project-details\?pid=/;
        if ( u.hash.search(re) !== -1 ) {

            // We're being asked to display the items for a specific project.
            showProjectDetails( u, data.options );

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            e.preventDefault();
        }
    }
});

$(document).on("click", ".editButton", function(e){
    e.preventDefault();
    $(this).next(".editPanel").toggle(); //get the sibling edit panel to show
    return false;
});