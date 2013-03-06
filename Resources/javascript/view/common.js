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
		var u2 = $.mobile.path.parseUrl( data.toPage ),
            re2 = /^#scriptExe\?sid=/;
		if ( u.hash.search(re) !== -1 ) {

            // We're being asked to display the items for a specific project.
            showProjectDetails( u, data.options );
			//showScripts();

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            e.preventDefault();
        }
		else if ( u2.hash.search(re2) !== -1 ) {

            // We're being asked to display the items for a specific project.
            showScriptExecution(u2, data.options);

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            e.preventDefault();
        }  
    }
});


$(document).on("click", ".detailsButton", function(e){
    e.preventDefault();
    var container = $(this).parents("label").first().parent();
    var detailsPane = null;
    if(container.length){
        var detailsPane = $(container).next(".detailsPane");
        if(!detailsPane.length){
            detailsPane = $(detailsPaneTemplate);
            container.after(detailsPane);
            var id = $(this).attr("data-id");
            var custom = jQuery.Event("getDetails", {"id" : id});
            detailsPane.trigger(custom);
        }else{
            detailsPane.remove();
        }
    }

    return false;
});

//hide the input after it loses focus
$(document).on('blur', "input.inputFix", function(e){
    var span = $(this).next();
	$(this).hide();
	span.show();
    return false;
});

//show the input when it's clicked
$(document).on('click', "span.inputFix", function(e){
    var input = $(this).prev();
	$(this).hide();
	input.show();
	//forces the cursor to the end of the input
	input.focus().val(input.val());
    return false;
});