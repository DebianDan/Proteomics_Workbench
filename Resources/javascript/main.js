///////////////////
// UTILITY STUFF //
///////////////////
// TODO: (should be in its own file)

//String.format() utility function, replaces {0} ... {n} in string with supplied arguments based on argument position
//first, checks if it isn't implemented yet
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

//the HTML template for the assets inside of a project -- use with String.format()
var assetTemplate = '<input type="checkbox" data-aid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<a class="fav" data-aid="{0}" data-fav="{3}" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="{2}">Favorite</a>' +
    '<label for="checkbox-{0}" data-aid="{0}">{1}</label>';
	
//the HTML template for the scripts -- use with String.format()
var scriptTemplate = '<input type="checkbox" data-sid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-sid="{0}">{1}</label>';

///////////////////////
// END UTILITY STUFF //
///////////////////////


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
					transaction.executeSql("CREATE TABLE IF NOT EXISTS assets('aid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'pid' INTEGER NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
					//favorites table
					transaction.executeSql("CREATE TABLE IF NOT EXISTS favorites('pid' INTEGER NOT NULL, 'aid' INTEGER NOT NULL, 'fav' INTEGER NOT NULL DEFAULT 1)");
					//scripts table
					transaction.executeSql("CREATE TABLE IF NOT EXISTS scripts('sid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
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

    //used to handle multiple statements in a single transaction. sqlArray is plaintext array of statements to execute
    //not sure if necessary yet
    pw.db.executeStatements = function(sqlArray, dataHandler, errorHandler){
        pw.db.transaction(
            function(transaction){
                $.each(sqlArray, function(sql){
                    transaction.executeSql(sql, [], dataHandler, errorHandler);
                });
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
		this.name = name;
		this.path = path;
        return this;
    },
	getAsset : function(aid, onSuccess, onError){
        var sql = "SELECT aid, pid, path, filename, filetype, path, date_created FROM assets WHERE aid = " + aid;
        if(aid == undefined){
            onError("aid must be specified when calling getAsset()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllAssets : function(pid, onSuccess, onError){
        var sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.path, assets.date_created, favorites.fav FROM assets LEFT JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+pid+" ORDER BY assets.date_created DESC";
        if(pid == undefined){
            onError("pid must be specified when calling getAllAssets()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    addAsset : function(pid, path, onSuccess, onError){
		//regex to extract filename works for both \ and / file separators
		var filename = path.replace(/^.*[\\\/]/, '');
		//just the file extension ex: jpg txt csv
		var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO assets (pid, path, filename, filetype, date_created) VALUES('" + pid + "', '" + path +"', '" +filename+"', '"+filetype+"', DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteAssets : function(aids, onSuccess, onError){
		//remove assets and also remove if its in favorites
		var sql = "DELETE FROM assets WHERE aid=";
		var sqlFav = "DELETE FROM favorites WHERE aid=";
		for (var i = 0; i < aids.length; i++) {
			//treat the last aid differently
			if (i === aids.length-1){
				sql += aids[i];
				sqlFav += aids[i];
			}
			else{
				sql += aids[i] + " OR aid=";
				sqlFav += aids[i] + " OR aid=";
			}
		}
        pw.db.execute(sql, onSuccess, onError);
		pw.db.execute(sqlFav, onSuccess, onError);
    },
    deleteAsset : function(aid, onSuccess, onError){
        iAid = parseInt(aid);
        if(iAid >= 0 && iAid){
            var sqlFav = "DELETE FROM favorites WHERE aid={0}".format(aid);
            var sql = "DELETE FROM assets WHERE aid={0}".format(aid);
            pw.db.execute(sqlFav);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("asset ID {0} is not a positive integer.".format(aid));
        }
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

pw.scripts = {
    script : function(filename, path){
		this.filename = filename;
		this.path = path;
        return this;
    },
	getScript : function(sid, onSuccess, onError){
        var sql = "SELECT sid, path, filename, filetype, path, date_created FROM scripts WHERE sid = " + sid;
        if(sid == undefined){
            onError("sid must be specified when calling getScript()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllScripts : function(onSuccess, onError){
        var sql = "SELECT * FROM scripts WHERE 1=1 ORDER BY date_created DESC";
            pw.db.execute(sql, onSuccess, onError);
    },
    addScript : function(path, onSuccess, onError){
		//regex to extract filename works for both \ and / file separators
		var filename = path.replace(/^.*[\\\/]/, '');
		//just the file extension ex: jpg txt csv
		var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO scripts (path, filename, filetype, date_created) VALUES('" + path +"', '" +filename+"', '"+filetype+"', DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteScripts : function(sids, onSuccess, onError){
		//remove scripts
		var sql = "DELETE FROM scripts WHERE sid=";
		for (var i = 0; i < sids.length; i++) {
			//treat the last aid differently
			if (i === sids.length-1){
				sql += sids[i];
			}
			else{
				sql += sids[i] + " OR sid=";
			}
		}
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteScript : function(sid, onSuccess, onError){
        iSid = parseInt(sid);
        if(iSid >= 0 && iSid){
            var sql = "DELETE FROM scripts WHERE sid={0}".format(sid);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("script ID {0} is not a positive integer.".format(sid));
        }
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

/***************/
/*ADDING ASSETS*/
/***************/

//clear list of added assets and close the dialog
function clearAssetPicker(){
    $("#assetPickerList").html("");
    $("#addAssetPopup").popup("close");
    return false;
}

//adds an asset to the project details page (display only)
function addProjectAssetMarkup(aid, path, fav){
    if(!fav){
        fav = 0;
    }
    var theme = (fav == 0) ? 'c' : 'e';

    var aList = $("#assetList");
    if(aList){
        var markup = assetTemplate.format(aid, path, theme, fav);
        aList.append(markup);
    }
    aList.trigger('create');
}

//removes the asset from the list of assets to be added
$("#assetPickerList li .cancel").live("click", function(e){
  $(this).parent().parent().remove();
  e.preventDefault();
})

$("#addAssetPopup .close").live("click", function(e){
    clearAssetPicker();
    e.preventDefault();
});

//launches the file browser dialogue when adding an asset
$("input.chooseFiles").click(function(){
    var path = Ti.UI.openFileChooserDialog(function(path){
        //callback after dialog close
        for(i = 0; i < path.length; i++){
            $("#assetPickerList").append("<li data-path='"+path[i]+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path[i]+"'/></li>");
        }
    }, {multiple:'true',title:'Select data file(s) to add to project'});
    $("#assetPickerList").trigger('create');
});

//bind to the click event of the add assets button
$("#addAssetPopup .save").click(function(){
    console.log("add asset button clicked");
    //get the paths for the added files
    $("#assetPickerList li").each(function(e){
        var path = $(this).attr("data-path");
        //add the asset to the database and then add to the page
        pw.assets.addAsset(pw.activeProject, path, function(transaction, results){
            addProjectAssetMarkup(results.insertId, path, 0);
        });
    });
    clearAssetPicker();
});

/*******************/
/*END ADDING ASSETS*/
/*******************/

//bind to the click event of the delete asset button
$("#deleteAssetPopup #delete").click(function(){
    var aids = new Array(); //array of asset id's to delete (keeping this so we can do something else if large number of deletes)
    $('#assetList input[data-aid]:checked').each(function () { //get all inputs that are checked and have an attribute of data-aid
        var aid = $(this).attr('data-aid');
        if(aid){
            var self = this;
            aids.push(aid);
            pw.assets.deleteAsset(aid, function(transaction, results){
                $("#assetList [data-aid='" + aid +"']").remove(); //remove elements with the specified attribute
                console.log("deleted asset with id {0}".format(aid));
            },function(transaction, error){
                console.log("error deleting asset {0}: {1}".format(aid, error.message));
            })
        }
    });

    if(aids.length){
        $("#assetList").trigger('create'); //we removed some stuff so refresh the list
    }

    /*
    console.log("delete asset button clicked");
	var numChecked = $( "input:checked" ).length;
	if (numChecked === 0){
		alert('Choose at least 1 asset to Delete.');
	}
	else{
		//fill up an array of all the assets aid to be deleted

		pw.assets.deleteAssets(aids,
			//success callback
			function(transaction, results){
				//Remove all deleted assets completely from the list
				for (var i = 0; i < aids.length; i++) {
					//find div that wraps all of the asset, empty, remove, then remove favorite
					var checkBox = $("#assetList").find("input[name='aid-"+aids[i]+"']").parent();
					checkBox.empty();
					checkBox.remove();
					$("#assetList").find("a[data-aid='"+aids[i]+"']").remove();	
				}
			},
			//error callback
			function(transaction, error){
				alert("there was an error when attempting to delete the checked assets: ", error.code);
			}
		);
	}*/
});

/*********************/
/*END DELETING ASSETS*/
/*********************/

//clear list of added assets and close the dialog
function clearScriptPicker(){
    $("#scriptPickerList").html("");
    $("#addScriptPopup").popup("close");
    return false;
}

//adds a script to the scripts page (display only)
function addProjectScriptMarkup(sid, path){
    var sList = $("#scriptList");
    if(sList){
        var markup = scriptTemplate.format(sid, path);
        sList.append(markup);
    }
    sList.trigger('create');
}

//removes the script from the list of scripts to be added
$("#scriptPickerList li .cancel").live("click", function(e){
  $(this).parent().parent().remove();
  e.preventDefault();
})

$("#addScriptPopup .close").live("click", function(e){
    clearScriptPicker();
    e.preventDefault();
});

//launches the file browser dialogue when adding a script
$("input.chooseScripts").click(function(){
    var path = Ti.UI.openFileChooserDialog(function(path){
        //callback after dialog close
        for(i = 0; i < path.length; i++){
            $("#scriptPickerList").append("<li data-path='"+path[i]+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path[i]+"'/></li>");
        }
    }, {multiple:'false',title:'Select script to add'});
    $("#scriptPickerList").trigger('create');
});

//bind to the click event of the add assets button
$("#addScriptPopup .save").click(function(){
    console.log("add script button clicked");
    //get the paths for the added files
    $("#scriptPickerList li").each(function(e){
        var path = $(this).attr("data-path");
        //add the asset to the database and then add to the page
        pw.scripts.addScript(path, function(transaction, results){
            addProjectScriptMarkup(results.insertId, path);
        });
    });
    clearScriptPicker();
});

/********************/
/*END ADDING SCRIPTS*/
/********************/

//bind to the click event of the delete asset button
$("#deleteScriptPopup #delete").click(function(){
    var sids = new Array(); //array of asset id's to delete (keeping this so we can do something else if large number of deletes)
    $('#scriptList input[data-sid]:checked').each(function () { //get all inputs that are checked and have an attribute of data-sid
        var sid = $(this).attr('data-sid');
        if(sid){
            var self = this;
            sids.push(sid);
            pw.scripts.deleteScript(sid, function(transaction, results){
                $("#scriptList [data-sid='" + sid +"']").remove(); //remove elements with the specified attribute
                console.log("deleted script with id {0}".format(sid));
            },function(transaction, error){
                console.log("error deleting script {0}: {1}".format(sid, error.message));
            })
        }
    });

    if(sids.length){
        $("#scriptList").trigger('create'); //we removed some stuff so refresh the list
    }

    /*  !!!NEED TO UPDATE FOR SCRIPTS IF WE DECIDE TO USE THIS METHODS INSTEAD!!!
    console.log("delete asset button clicked");
	var numChecked = $( "input:checked" ).length;
	if (numChecked === 0){
		alert('Choose at least 1 asset to Delete.');
	}
	else{
		//fill up an array of all the assets aid to be deleted

		pw.assets.deleteAssets(aids,
			//success callback
			function(transaction, results){
				//Remove all deleted assets completely from the list
				for (var i = 0; i < aids.length; i++) {
					//find div that wraps all of the asset, empty, remove, then remove favorite
					var checkBox = $("#assetList").find("input[name='aid-"+aids[i]+"']").parent();
					checkBox.empty();
					checkBox.remove();
					$("#assetList").find("a[data-aid='"+aids[i]+"']").remove();	
				}
			},
			//error callback
			function(transaction, error){
				alert("there was an error when attempting to delete the checked assets: ", error.code);
			}
		);
	}*/
});

/**********************/
/*END DELETING SCRIPTS*/
/**********************/

//execute on scripts page load
$('#scripts').live('pagebeforecreate', function (event) {
    //get all scriptss in database
    pw.scripts.getAllScripts(
        //success callback
        function (transaction, results) {
            console.log(results.rows.length + " scripts retrieved");
            console.log("rendering scripts list");
            var sList = $("#scriptList"); //save a reference to the element for efficiency
			//clear the assets list to start
			sList.html("");
			//loop through rows and add them to script list
			for (var i = 0; i < results.rows.length; i++) {
				var row = results.rows.item(i);
				var sid = row['sid'];
				var path = row['path'];

				addProjectScriptMarkup(sid, path);
			}	
        },
        function (transaction, error) {
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    );
});
/************************/
/*END DISPLAYING SCRIPTS*/
/************************/

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

/*************************/
/*END DISPLAYING PROJECTS*/
/*************************/

// Listen for any attempts to call changePage().
$(document).bind("pagebeforechange", function( e, data ) {

    // We only want to handle changePage() calls where the caller is
    // asking us to load a page by URL.
    if ( typeof data.toPage === "string" ) {
        // We are being asked to load a page by URL, but we only
        // want to handle URLs that request the data for a specific
        // category.
        var u = $.mobile.path.parseUrl( data.toPage ),
            re = /^#project-details\?pid=/,
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

                    //loop through rows and add them to asset list
                    for (var i = 0; i < results.rows.length; i++) {
                        var row = results.rows.item(i);
                        var aid = row['aid'];
                        var path = row['path'];
                        var fav = row['fav'];

                        /*
                        //initially a favorite
                        var fav = 1;
                        var theme = 'e';
                        //if NOT labeled as a favorite
                        if(row['fav'] !== 1){
                            fav = 0;
                            theme = 'c';
                        }
                        */
                        addProjectAssetMarkup(aid, path, fav);
                        //formattedAsset = assetTemplate.format(aid, path, theme);
                        //aList.append(formattedAsset);
                    }

                    //aList.trigger('create');
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

