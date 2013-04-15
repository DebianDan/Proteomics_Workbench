//execute on project details page load
$(document).on('pagebeforeshow', '#project-details', function (event) {

    //var pid = urlObj.hash.replace( /.*pid=/, "" ),

    // The pages we use to display our content are already in
    // the DOM. The id of the page we are going to write our
    // content into is specified in the hash before the '?'.
        //pageSelector = urlObj.hash.replace( /\?.*$/, "" );
    pw.projects.getProjectEx(
        {'pid' : pw.activeProject},
        //success callback
        function(myProject){
            // Get the page we are going to dump our content into.
            //var $page = $( pageSelector );
            //pw.activeProject = pid;
            pw.activeProjectObject = myProject;
            renderProjectDetails(myProject);
            renderAssetsList(myProject);
            renderProjectDetailsScripts();

            // Pages are lazily enhanced. We call page() on the page
            // element to make sure it is always enhanced before we
            // attempt to enhance the listview markup we just injected.
            // Subsequent calls to page() are ignored since a page/widget
            // can only be enhanced once.

            //$page.page();

            // We don't want the data-url of the page we just modified
            // to be the url that shows up in the browser's location field,
            // so set the dataUrl option to the URL for the category
            // we just loaded.
            //options.dataUrl = urlObj.href;

            // Now call changePage() and tell it to switch to
            // the page we just modified.
            //$.mobile.changePage( $page, options );

            //console.log("OPTIONS: " + JSON.stringify(options));
        },function(e){
            console.log("ERROR in showProjectDetails: {0}".format(JSON.stringify(e)));
        }
    );
});

//adds a script to the project details page (display only)
function addProjectDetailsScriptMarkup(sid, path){
    var filename = path.replace(/^.*[\\\/]/, '');
    var sList = $("#scriptList-project");
    if(sList){
        var markup = scriptProjectDetailsTemplate.format(sid, filename);
        sList.append(markup);
    }
    sList.trigger('create');
}

//TODO: can applying templates be a more generic function than this? Making new names is a drag
function renderProjectDetailsScripts(){
    //get all scripts in database
    pw.scripts.getAllScripts({
        success: function(data){
            var template = $("#tplProjectDetailsScripts").html(),
                html = Mustache.to_html(template, data),
                sList = $("#scriptList-project");
            //clear the assets list to start
            sList.html(html).trigger('create');
        },
        error : function(error){ //TODO: check to make sure arguments list is correct for this function
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    });
}

function renderAssetsList(project){
    console.log("rendering project details assets list");
    var template = $("#tplProjectDetailsAssets").html(),
        html = Mustache.to_html(template, project);
    //$("#assetList").html(html).trigger('create');
    $("#assetList").html(html);
	//set the sort by to Newest everytime
	$("select[name=sortAssetsBy]").val(1).change();
}

function renderProjectDetails(project){
    console.log("rendering project details");
    var template = $("#tplProjectDetailsHeader").html(),
    	html = Mustache.to_html(template, project);
    $("#projectDetailsHeader").html(html).trigger('create');
}


// Load the data for a specific category, based on
// the URL passed in. Generate markup for the items in the
// category, inject it into an embedded page, and then make
// that page the current active page.
function showProjectDetails( urlObj, options )
{
    var pid = urlObj.hash.replace( /.*pid=/, "" ),

    // The pages we use to display our content are already in
    // the DOM. The id of the page we are going to write our
    // content into is specified in the hash before the '?'.
        pageSelector = urlObj.hash.replace( /\?.*$/, "" );
    pw.projects.getProjectEx(
        {'pid' : pid},
        //success callback
        function(myProject){
            // Get the page we are going to dump our content into.
            var $page = $( pageSelector );
            pw.activeProject = pid;
            pw.activeProjectObject = myProject;
            renderProjectDetails(myProject);
			renderAssetsList(myProject);
            renderProjectDetailsScripts();

            // Pages are lazily enhanced. We call page() on the page
            // element to make sure it is always enhanced before we
            // attempt to enhance the listview markup we just injected.
            // Subsequent calls to page() are ignored since a page/widget
            // can only be enhanced once.
            $page.page();

            // We don't want the data-url of the page we just modified
            // to be the url that shows up in the browser's location field,
            // so set the dataUrl option to the URL for the category
            // we just loaded.
            options.dataUrl = urlObj.href;

            // Now call changePage() and tell it to switch to
            // the page we just modified.
            $.mobile.changePage( $page, options );

            //console.log("OPTIONS: " + JSON.stringify(options));
        },function(e){
            console.log("ERROR in showProjectDetails: {0}".format(JSON.stringify(e)));
        }
    );
}

$(document).on("click", ".detailsButton", function(e){
    e.preventDefault();
    var aid = $(this).attr("data-id");
    if(aid){
        $("#detailsPane-{0}".format(aid)).fadeToggle();
    }

    return false;
});

$(document).on("click", ".openFile", function(e){
    var path = $(this).attr("data-path");
    if(path){
        gui.Shell.openItem(path);
    }
});

$(document).on("click", ".openFileLocation", function(e){
    var path = $(this).attr("data-path");
    if(path){
        gui.Shell.showItemInFolder(path);
    }
});