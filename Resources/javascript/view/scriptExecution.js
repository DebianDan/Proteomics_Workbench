//adds an asset to the Script Execution page (display only)
function addAssetScriptExeMarkup(list, aid, argId, path, fav){
    var filename = path.replace(/^.*[\\\/]/, '');
    var sList = $(list);
    if(sList){
		//TODO add favorite
        var markup = scriptExeAssetTemplate.format(aid, path, filename, argId);
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

    //options method to pass to getScript()
    optionsObj = {
        id : sid,
        success : function(script){
            if(script){
				// Get the page we are going to dump our content into.
                var $page = $( pageSelector );
                //put the content into the page

                 //can be deleted later, just for DEBUG
                var markup = "Script Name: " + script.alias + "<br/>";
                //markup += "Script Details: " + script.path + "<br/>";
                markup += "Date Created: " + script.date_created + "<br/>";
                //markup += "SID: " + script.sid + "<br/>";
				
				var moreDetails = "Script Name: " + script.alias + "<br/>";
                moreDetails += "Path: " + script.path + "<br/>";
                moreDetails += "Date Created: " + script.date_created + "<br/>";
                moreDetails += "SID: " + script.sid + "<br/>";

                //THIS IS A HACK, FIND A BETTER WAY TO DO THIS!!!!!!!!!!!
                //inject the path into the run button for executing
                $('#run').attr('data-path', script.path);

                //Forces the project details to be above the asset list
                $("#pScriptDetails").html( markup );
				$("#pScriptDetailsMore").html( moreDetails );

				//TODO clear all the previous arguments out
				var argList = $("#scriptExeAssetList");
				//clear the assets list to start
				argList.html("");
				var template = $("#tplScriptExeAssetList").html(),
						html = Mustache.to_html(template, script),
						aList = $("#scriptExeAssetList");
				//clear the assets list to start
				aList.html(html).trigger('create');
                
				//for (the # of arguments) {
                //display a argument box like below
				script.arguments.forEach(function(arg){
                    for(property in arg){
                        if(typeof arg[property] != "function"){
                            console.log("...property {0} is {1}".format(property, arg[property]));
                        }
                    }
						
					//Display all the assets for the active project
					//Have to do this everytime because we will be running different queries for
					//different arguments in the future.  i.e. filter csv, then filter xml
					pw.assets.getAllAssets(pw.activeProject,
						//success callback
						function (transaction, results) {
							console.log(results.rows.length + " assets retrieved");
							console.log("rendering assets list");
							
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
								//(convention #scriptExeAssetList0 #scriptExeAssetList1 etc..)
								aList = "#scriptExeAssetList" + arg.id;
								addAssetScriptExeMarkup(aList, aid, arg.id, path, fav);
							}
						},
						function (transaction, error) {
							alert("there was an error when attempting to retrieve the assets: ", error.code);
						}
					);	
                });

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
        }
    }
    pw.scripts.getScript(optionsObj);
}

//bind to the click event of the Run Script button
$(document).on('click', "#run", function(){
    console.log("Run Script button clicked");
	$('#runScript').popup("close");
	//TODO find a better way to get path to the script
    var sPath =  $('#run').attr('data-path');
	var argPaths = [];
	var valid = true;
	$('#scriptExeAssetList [id*="scriptExeAssetList"]').each(function(index){
		if(valid){
			//find the required args
			if ($(this).attr('data-required') == 1){
				//alert if not checked
				//get the argument path for the asset from the data-path attribute of the radio button
				var temp = $(this).find('input[name*="scriptAsset"]:checked').attr('data-path');
				if (temp == null){
					//breakout if a required asset isn't filled
					alert("You have to select an asset to input for a required argument!");
					valid = false;
				}else{
					argPaths.push(temp);
				}
			}else{
				//if not required, but checked add it
				var temp = $(this).find('input[name*="scriptAsset"]:checked').attr('data-path');
				if (temp != null){
					argPaths.push(temp);
				}
			}
		}
	});
	//alert(argPaths.length);
	
	if (valid){
		//Creating a notification for Script Start
		var note = Ti.Notification.createNotification({
			'title' : 'Script Status',
			'message' : 'Script is currently running!',
			'timeout' : 0,
			//'callback' : doSomething
			'icon' : 'app://css/images/ajax-loader.gif'        
		});

		//take an asset as an argument to a python script
		var myScript = Ti.Process.createProcess({
			   //args:[] can take the array of argPaths
			   args:['python',sPath,argPaths]
		});
		
		//USEFUL FOR DEBUGGING, OUTPUTS THE STDOUT LINE BY LINE
		myScript.setOnReadLine(function(data) {
			$("#scriptOut").append(data.toString() + "\r\n");
		}); 
		
		//can poll to see if the process is running, will return a Boolean
		//myScript.isRunning();
		
		
		myScript.setOnExit(function(){
			note.setMessage("Script has finished running!");
			note.setIcon('app://css/images/greencheck.png');
			//TODO set a callback for when the Notification is clicked
			//note.setCallback(function(){});
			note.show();
			console.log("Script Finished Running");
		});	   
		//Launches the process  
		myScript.launch();
		//show start notification
		note.show();
	}
});

//Clear the log output
$(document).on('click', "#clearLog", function(){
	console.log("Script Log has been cleared.")
	$("#scriptOut").html("");
});