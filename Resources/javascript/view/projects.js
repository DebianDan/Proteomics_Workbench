//execute on projects page load
$(document).on('pagebeforecreate', '#projects', function (event) {
    //get all projects in database
    pw.projects.getAllProjects(
        //success callback
        function (transaction, results) {
            console.log(results.rows.length + " projects retrieved");
            console.log("rendering projects list");
            var pList = $("#projectList"); //save a reference to the element for efficiency
            for (var i = 0; i < results.rows.length; i++) {
                var row = results.rows.item(i);
                pList.append(projectTemplate.format(row['pid'], row['name']));
            }
            $("#projectList").listview("refresh"); //have to refresh the list after we add elements
        },
        function (transaction, error) {
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    );
});

//bind to the click event of the create new project button
$(document).on('click', "#createProjectPopup :submit", function(){
    console.log("create new project button clicked");
    var title = $("#createProjectPopup .projectTitle").val();
    var description = $("#createProjectPopup .projectDescription").val();
    if(title == ""){
        alert('Project title must be filled in.');
    }else{
        pw.projects.createProject(title, description,
            //success callback
            function(transaction, results){
                var pid = results.insertId; //id of last inserted row
                $("#createProjectPopup").popup("close");
                //clear form data
                $("#createProjectPopup .projectTitle").val('');
                $("#createProjectPopup .projectDescription").val('');
                $("#projectList").prepend(projectTemplate.format(pid, title));
                $("#projectList").listview("refresh"); //have to refresh the list after we add an element
            },
            //error callback
            function(transaction, error){
                alert("there was an error when attempting to create the project: ", error.code);
            }
        );
    }
});

//bind to the click event of the delete project button
$("#deleteProjectPopup #delete").click(function(){
    console.log("delete project button clicked");
    var pid = pw.activeProject;
    pw.projects.deleteProject(pid,
        //success callback
        function(transaction, results){
            //Remove deleted project from the list
            $("#projectList").find("li[data-pid='"+pid+"']").remove();
            //have to refresh the list after we delete an element
            $("#projectList").listview("refresh");
        },
        //error callback
        function(transaction, error){
            alert("there was an error when attempting to delete the project: ", error.code);
        }
    );
});

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

    pw.projects.getProject(pid, function(transaction, results){
        console.log(results.rows.length + " rows returned");
        if(results.rows.length > 0){
            var row = results.rows.item(0); //get first result
            // Get the page we are going to dump our content into.
            var $page = $( pageSelector );
            //put the content into the page

            //can be deleted later, just for DEBUG
            //Code for Edit button: "<a href=\"#\" data-role=\"button\" data-icon=\"edit\" data-iconpos=\"left\" data-mini=\"true\" data-inline=\"true\" data-theme=\"e\">Edit</a>"
            var markup = "Project Name: " + row['name'] + "&nbsp;<a href=\"#editTitlePopup\">Edit</a>" + "<br/>";
            markup += "Project Details: " + row['description'] + "&nbsp;<a href=\"#editDescPopup\">Edit</a>" + "<br/>";
            markup += "Date Created: " + row['date_created'] + "<br/>";
            markup += "PID: " + row['pid'] + "<br/>";

            //set active project (lazy hack for now)
            pw.activeProject = parseInt(row['pid']);

            //inject the pid into the delete button for deletion NEEDED
            $('#delete').attr('data-pid', row['pid']);

            //Forces the project details to be above the asset list
            $("#pDetails").html( markup );
            console.log("should be changing page content to " + markup);
            $("#pTitle").html( row['name'] );

            //Display all the assets for a particular project
            pw.assets.getAllAssets(pid,
                //success callback
                function (transaction, results) {
                    console.log(results.rows.length + " assets retrieved");
                    console.log("rendering assets list");
                    var aList = $("#assetList"); //save a reference to the element for efficiency

                    //clear the assets list to start
                    aList.html("");

                    //loop through rows and add them to asset list
                    for (var i = 0; i < results.rows.length; i++) {
                        var row = results.rows.item(i);
                        var aid = row['aid'];
                        var path = row['path'];
                        var fav = 1;
                        //not in the favorites table
                        if (row['fav'] == null){
                            fav = 0;
                        }
                        addProjectAssetMarkup(aid, path, fav);
                    }
                },
                function (transaction, error) {
                    alert("there was an error when attempting to retrieve the assets: ", error.code);
                }
            );

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
        }

    },function(transaction, error){
        //error on select
    });
}