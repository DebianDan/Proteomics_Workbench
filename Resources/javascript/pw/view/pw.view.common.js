// Listen for any attempts to call changePage().
// checks to the url to see what page it is being changed to and keeps the pw.activeProject or pw.activeScript fresh
// this ensures that it is indeed always the active script or project
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
            pw.activeProject = u.hash.replace( /.*pid=/, "" );
            // We're being asked to display the items for a specific project.
            //showProjectDetails( u, data.options );
			//showScripts();

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            //e.preventDefault();
        }
		else if ( u2.hash.search(re2) !== -1 ) {
            pw.activeScript = u2.hash.replace( /.*sid=/, "" );
            // We're being asked to display the items for a specific project.
            //showScriptExecution(u2, data.options);

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            //e.preventDefault();
        }  
    }
});

//this will be fired when anything with the class dirBrowserButton is clicked
//if that element has a data-target attribute, that will be assumed to be the ID of the input whose value will be updated with the selected directory path
$(document).on('click', '.dirBrowserButton', function(e){
    //see if there is a data-for attribute so we can update that
    var targetID = $(this).attr("data-target");
    chooseFile("#directoryInput", function(evt){
        var newValue = $(this).val();
        if(targetID){
            updateInputAndBlur(targetID, newValue);
        }
    });
    return false;
});

//this will be fired when anything with the class fileBrowserButton is clicked
//if that element has a data-target attribute, that will be assumed to be the ID of the input whose value will be updated with the selected file path
$(document).on('click', '.fileBrowserButton', function(e){
    //see if there is a data-for attribute so we can update that
    var targetID = $(this).attr("data-target");
    chooseFile("#fileInput", function(evt){
        var newValue = $(this).val();
        if(targetID){
            updateInputAndBlur(targetID, newValue);
        }
    });
    return false;
});