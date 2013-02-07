//define our proteomics workbench namespace to hold all of our stuff
var pw = {};

//DATABASE STUFF
(function() {
    var _db; //private variable to hold the returned database object
    //we define this getter so that it will only try to retrieve the database one time
    pw.__defineGetter__("db", function(){
        shortName = 'pwDB';
        version = '1.0';
        displayName = 'Database for the Proteomics Workbench software';
        maxSize = 52428800; // 50MB
        if(_db == undefined){ //only retrieve the database & create tables on program start
            console.log("getting the database");
            _db = openDatabase(shortName, version, displayName, maxSize);
            console.log("creating initial tables")
            _db.transaction(
                function(transaction){
                    //projects table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS projects('pid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'name' VARCHAR NOT NULL , 'description' VARCHAR, 'active' BOOL NOT NULL  DEFAULT 1, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
					//assets table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS assets('aid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'pid' INTEGER NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'label' VARCHAR, 'filetype' VARCHAR NOT NULL, 'fav' BOOL DEFAULT 0, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
                }
            );
        }
        return _db;
    });

    //function used to execute sql
    pw.db.execute = function(sql, dataHandler, errorHandler){
        console.log(sql);
        pw.db.transaction(
            function(transaction){
                transaction.executeSql(sql, [], dataHandler, errorHandler);
            }
        );
    }
})(pw); //this ensures that the closure is in the context of the pw object

//PROJECTS STUFF
pw.projects = {
    project : function(name, description){
        this.name = name;
        this.description = description;
        return this;
    },
    getProject : function(pid, onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = " + pid;
        if(pid == undefined){
            onError("pid must be specified when calling getProject()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllProjects : function(onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
    },
    createProject : function(name, description, onSuccess, onError){
        var sql = "INSERT INTO projects (name, description, active, date_created) VALUES('" + name + "', '" + description +"', 1, DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteProject : function(id, onSuccess, onError){
		var sql = "DELETE FROM projects WHERE pid=" + id + "";
        pw.db.execute(sql, onSuccess, onError);
    }
};

//bind to the click event of the create new project button
$("#createProjectPopup :submit").click(function(){
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
                $("#projectList").prepend("<li data-pid=" + pid + "><a href=\"#project-details?pid=" + pid + "\">"+ title +"</li>");
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
    var pid = $("#delete").attr('data-pid');
	pw.projects.deleteProject(pid,
		//success callback
		function(transaction, results){
//TODO get project list to update after the delete!!!!!!!
			$("#projectList").listview("refresh"); //have to refresh the list after we add an element
		},
		//error callback
		function(transaction, error){
			alert("there was an error when attempting to delete the project: ", error.code);
		}
	);
});

//execute on projects page load
$('#projects').live('pagebeforecreate', function (event) {
    //get all projects in database
    pw.projects.getAllProjects(
        //success callback
        function (transaction, results) {
            console.log(results.rows.length + " projects retrieved");
            console.log("rendering projects list");
            var pList = $("#projectList"); //save a reference to the element for efficiency
            for (var i = 0; i < results.rows.length; i++) {
                var row = results.rows.item(i);
                pList.append("<li data-pid=" + row['pid'] + "><a href=\"#project-details?pid=" + row['pid'] + "\">" + row['name'] + "</li>");
            }
            $("#projectList").listview("refresh"); //have to refresh the list after we add elements
        },
        function (transaction, error) {
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    );
});

// Listen for any attempts to call changePage().
$(document).bind("pagebeforechange", function( e, data ) {

    // We only want to handle changePage() calls where the caller is
    // asking us to load a page by URL.
    if ( typeof data.toPage === "string" ) {
        // We are being asked to load a page by URL, but we only
        // want to handle URLs that request the data for a specific
        // category.
        var u = $.mobile.path.parseUrl( data.toPage ),
            re = /^#project-details/;
        if ( u.hash.search(re) !== -1 ) {

            // We're being asked to display the items for a specific project.
            showProjectDetails( u, data.options );

            // Make sure to tell changePage() we've handled this call so it doesn't
            // have to do anything.
            e.preventDefault();
        }
    }
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
            var $page = $( pageSelector ),
            // Get the header for the page.
            $header = $page.children( ":jqmData(role=header)" ),
            // Get the content area element for the page.
            $content = $page.children( ":jqmData(role=content)" );
            //put the content into the page

            //can be deleted later, just for DEBUG
			//Code for Edit button: "<a href=\"#\" data-role=\"button\" data-icon=\"edit\" data-iconpos=\"left\" data-mini=\"true\" data-inline=\"true\" data-theme=\"e\">Edit</a>"
			var markup = "Project Name: " + row['name'] + "&nbsp;<a href=\"#\">Edit</a>" + "<br/>";
            markup += "Project Details: " + row['description'] + "&nbsp;<a href=\"#\">Edit</a>" + "<br/>";
			markup += "Date Created: " + row['date_created'] + "<br/>";
			markup += "PID: " + row['pid'] + "<br/>";
			
			//inject the pid into the delete button for deletion NEEDED
			$('#delete').attr('data-pid', row['pid']);

            //$content.prepend( markup);
			//Forces the project details to be above the asset list
			$content.find( "h4" ).html( markup );
            console.log("should be changing page content to " + markup);
            $header.find( "h1" ).html( row['name'] );

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

