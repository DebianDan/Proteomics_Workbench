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
					transaction.executeSql("CREATE TABLE IF NOT EXISTS assets('aid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'pid' INTEGER NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'label' VARCHAR, 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
					//favorites table
					transaction.executeSql("CREATE TABLE IF NOT EXISTS favorites('pid' INTEGER NOT NULL, 'aid' INTEGER NOT NULL, 'fav' INTEGER NOT NULL DEFAULT 1)");
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

//I'm going to continue to follow the pattern of the 'projects' object above but
//part of me feels like 'asset' should be an object on its own containing references to
//the functions that can change it (setFavorite(), etc). Then the 'project' object can have an array
//of asset objects...
pw.assets = {
    asset : function(name, path){
        //TODO: fill out asset object
		this.name = name;
		//asset won't have description
        //this.description = description;
		this.path = path;
        return this;
    },
	getAsset : function(aid, onSuccess, onError){
        var sql = "SELECT aid, pid, path, filename, label, filetype, path, date_created FROM assets WHERE aid = " + aid;
        if(aid == undefined){
            onError("aid must be specified when calling getAsset()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllAssets : function(pid, onSuccess, onError){
        var sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.label, assets.filetype, assets.path, assets.date_created, favorites.fav FROM assets LEFT JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+pid+" ORDER BY assets.date_created DESC";
        if(pid == undefined){
            onError("pid must be specified when calling getAllAssets()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    addAsset : function(pid, path, label, onSuccess, onError){
		//TODO update when add assets supplies full path
		//var filename = everything after last \ or /
		var filename = path;
		//just the file extension ex: jpg txt csv
		var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO assets (pid, path, filename, label, filetype, date_created) VALUES('" + pid + "', '" + path +"', '" +filename+"', '"+label+"', '"+filetype+"', DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteAsset : function(id, onSuccess, onError){
		var sql = "DELETE FROM assets WHERE aid=" + id + "";
        pw.db.execute(sql, onSuccess, onError);
    },
	//Add functionality
    addFavorite : function(pid, aid, onSuccess, onError){
        var sql = "INSERT INTO favorites VALUES(" + pid + ", "+ aid + ",1)";
        pw.db.execute(sql, onSuccess, onError);
    },
    removeFavorite : function(pid, aid, onSuccess, onError){
        var sql = "DELETE FROM favorites WHERE pid=" + pid + " AND aid="+ aid;
        pw.db.execute(sql, onSuccess, onError);
    }
}

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
				//clear form data
				$("#createProjectPopup .projectTitle").val('');
				$("#createProjectPopup .projectDescription").val('');
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
	//TODO decide whether to embed pid or have active project????
	//var pid = $("#delete").attr('data-pid');
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

//bind to the click event of the add assets button
$("#addAssetPopup :submit").click(function(){
    console.log("add asset button clicked");
    var label = $("#addAssetPopup .assetLabel").val();
    var path = $("#addAssetPopup .assetFile").val();
	var pid = pw.activeProject;
    if(path == ""){
        alert('Asset File must be chosen.');
    }else{
		pw.assets.addAsset(pid, path, label,
            //success callback
            function(transaction, results){
                var aid = results.insertId; //id of last inserted row
                $("#addAssetPopup").popup("close");
				//clear form data
				$("#addAssetPopup .assetLabel").val('');
				$("#addAssetPopup .assetFile").val('');
                $("#assetList").prepend('<input type="checkbox" name="aid-'+aid+'" id="aid-'+aid+'" data-theme="c" /><a class="fav" data-aid="'+aid+'" data-fav="0" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="c">Favorite</a><label for="aid-'+aid+'">' + label + '</label>').trigger("create");
            },
            //error callback
            function(transaction, error){
                alert("there was an error when attempting to create the project: ", error.code);
            }
        );
    }
});

//TODO after delete asset button is in place
//bind to the click event of the delete asset button
/*
$("#deleteAssetPopup #delete").click(function(){
    console.log("delete asset button clicked");
	//find where data-aid will be taken from
	var aid = $("#delete").attr('data-aid');
	pw.assets.deleteAsset(aid,
		//success callback
		function(transaction, results){
			//Remove deleted asset from the list
			//Have to get it to remove whole asset list item
			$("#assetList").find("input[data-aid='"+aid+"']").remove().page(); 
		},
		//error callback
		function(transaction, error){
			alert("there was an error when attempting to delete the project: ", error.code);
		}
	);
});
*/

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
					for (var i = 0; i < results.rows.length; i++) {
						var row = results.rows.item(i);
						//initially a favorite
						var fav = 1;
						var theme = 'e';
						//if NOT labeled as a favorite
						if(row['fav'] !== 1){
							fav = 0;
							theme = 'c';
						}
						aList.append('<input type="checkbox" name="aid-'+row['aid']+'" id="aid-'+row['aid']+'" data-theme="c" /><a class="fav" data-aid="'+row['aid']+'" data-fav="'+fav+'" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme='+theme+'>Favorite</a><label for="aid-'+row['aid']+'">' + row['label'] + '</label>').trigger("create");
					}
				},
				function (transaction, error) {
					alert("there was an error when attempting to retrieve the projects: ", error.code);
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

$(".fav").live("click", function(event, ui){
    var self = this; //keep reference to this scope
    var success = function(transaction, results){
            console.log("favorite toggle success");
            $(self).buttonMarkup({theme:theme}); //set the theme color based on toggle status
            $(self).attr("data-fav", Math.abs(fav-1)); //toggle value
        },
        fail = function(transaction, error){
            console.log("favorite toggle fail: " + error.code);
        };

    var aid = $(this).attr("data-aid"), //get asset id
    fav = parseInt($(this).attr("data-fav")), //is this favorited? (0 or 1)
    theme = (fav == 0) ? 'e' : 'c'; //if not favorited set to e, otherwise c

    if(fav == 0){
        pw.assets.addFavorite(pw.activeProject, aid, success, fail);
    }else{
        pw.assets.removeFavorite(pw.activeProject, aid, success, fail);
    }


})

