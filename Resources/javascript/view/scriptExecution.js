//adds an asset to the Script Execution page (display only)
function addAssetScriptExeMarkup(aid, path, fav){
    var filename = path.replace(/^.*[\\\/]/, '');
    var sList = $("#scriptExeAssetList");
    if(sList){
		//TODO add favorite
        var markup = scriptExeAssetTemplate.format(aid, path, filename);
        sList.append(markup);
    }
    sList.trigger('create');
}

function showScriptExecution( urlObj, options )
{
    var sid = urlObj.hash.replace( /.*sid=/, "" ),

    // The pages we use to display our content are already in
    // the DOM. The id of the page we are going to write our
    // content into is specified in the hash before the '?'.
        pageSelector = urlObj.hash.replace( /\?.*$/, "" );

    pw.scripts.getScript(sid, function(script){
        console.log("SID: " + sid);
        if(script){
            // Get the page we are going to dump our content into.
            var $page = $( pageSelector );
            //put the content into the page
			
			/*//Fill in the fields for Edit Project
			$("#editProjectPopup .newTitle").val(row['name']);
			$("#editProjectPopup .newDescription").val(row['description']);
			*/

            //can be deleted later, just for DEBUG
            var markup = "Script Name: " + script.alias + "<br/>";
            markup += "Script Details: " + script.path + "<br/>";
            markup += "Date Created: " + script.date_created + "<br/>";
            markup += "SID: " + script.sid + "<br/>";

			//THIS IS A HACK, FIND A BETTER WAY TO DO THIS!!!!!!!!!!!
			//inject the path into the run button for executing
            $('#run').attr('data-path', script.path);

            //Forces the project details to be above the arguements
            $("#pScriptDetails").html( markup );

		// Will have to do this for each arguement
			//Display all the assets for the active project
            pw.assets.getAllAssets(pw.activeProject,
                //success callback
                function (transaction, results) {
                    console.log(results.rows.length + " assets retrieved");
                    console.log("rendering assets list");
                    var aList = $("#scriptExeAssetList"); //save a reference to the element for efficiency

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
                        addAssetScriptExeMarkup(aid, path, fav);
                    }
                },
                function (transaction, error) {
                    alert("there was an error when attempting to retrieve the assets: ", error.code);
                }
            );
			//
			
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

//bind to the click event of the Run Script button
$(document).on('click', "#run", function(){
    console.log("Run Script button clicked");
	//TODO find a better way to get path to the script
    var path =  $('#run').attr('data-path');
	//get the argument path for the asset from the data-path attribute of the radio button
	var argPath = $('#scriptExeAssetList input[name="scriptAsset"]:checked').attr('data-path');       
	if (argPath == null){
		alert("You have to select an asset to input!");
		$('#runScript').popup("close");
	}else{
		//take an asset as an argument to a python script
		var myScript = Ti.Process.createProcess({
			   args:['python',path,argPath]
		});
		
		//USEFUL FOR DEBUGGING, ALERTS THE STDOUT LINE BY LINE
		myScript.setOnReadLine(function(data) {
			alert(data.toString());
		});
		
		myScript.setOnExit(function(){
			alert("This was triggered on Exit.");
			console.log("Python Script Finished Running");
		});	   
		//Launches the process  
		myScript.launch();
		
		//can poll to see if the process is running, will return a Boolean
		//myScript.isRunning();
	}
});