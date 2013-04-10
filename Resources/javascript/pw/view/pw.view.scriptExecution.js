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
                //get the runtime that the script uses
                var myRuntime = pw.runtimes.getRuntime({
                    id: script.rid,
					name: script.alias,
                    success : function(runtime){

                        // Get the page we are going to dump our content into.
                        var $page = $( pageSelector );
                        //put the content into the page
/*
                        //can be deleted later, just for DEBUG
                        var markup = "Script Name: " + script.alias + "<br/>";
                        //markup += "Script Details: " + script.path + "<br/>";
                        markup += "Date Created: " + script.date_created + "<br/>";
                        //markup += "SID: " + script.sid + "<br/>";

                        var moreDetails = "Script Name: " + script.alias + "<br/>";
                        moreDetails += "Path: " + script.path + "<br/>";
                        moreDetails += "Date Created: " + script.date_created + "<br/>";
                        moreDetails += "SID: " + script.sid + "<br/>";

                         //Forces the project details to be above the asset list
                         $("#pScriptDetails").html( markup );
                         $("#pScriptDetailsMore").html( moreDetails );
*/
                        //THIS IS A HACK, FIND A BETTER WAY TO DO THIS!!!!!!!!!!!
                        //inject the path into the run button for executing
                        $('#run').attr('data-path', script.path);
                        $('#run').attr('data-runtime', runtime.path);

                        //add in the assets for the current project so that mustache can pick them up
                        script.assets = pw.activeProjectObject.properties.assets;

                        //TODO clear all the previous arguments out
                        var argList = $("#scriptExeAssetList");
                        //clear the assets list to start
                        argList.html("");

                        var template = $("#tplScriptExeAssetList").html(),
                            html = Mustache.to_html(template, script),
                            aList = $("#scriptExeAssetList");
                        //clear the assets list to start
                        aList.html(html).trigger('create');

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
                });

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
    var rPath =  $('#run').attr('data-runtime');
    var argPaths = [];
    argPaths.push(sPath); //hack to get it working
    var valid = true;
    $('#scriptExeAssetList .argument').each(function(index){
        if(valid){
            var req = $(this).attr('data-required'),
			argSwitch = $(this).attr('data-switch'),
			type = $(this).attr('data-type'),
			multi = $(this).attr('data-multi');
			
			//TODO figure out how to use Switch without "-i"
			//trying to push the switch first, but I think it will show up as "-i" "C:\Test.txt"
			//and I don't know if this will work
			if(argSwitch){
				argPaths.push(argSwitch);
			}
			
			//string argument
			if(type == 1){
				var argVal = $(this).find('input[id*="argStringValue"]').val();
				alert(argVal);
				//breakout if a required asset isn't supplied
				if (!argVal && req){
                    alert("You have to select an asset to input for a required argument!");
                    valid = false;
                }else{
                    argPaths.push(argVal);
                }
			}
			//radio select
			else if(multi == 0 && type == 0){
				var argVal = $(this).find('input[id*="asset"]:checked').attr('data-path');
				alert(argVal);
				//breakout if a required asset isn't supplied
				if (!argVal && req){
                    alert("You have to select an asset to input for a required argument!");
                    valid = false;
                }else{
                    argPaths.push(argVal);
                }
			}
			//multiselect with checkboxes
			else if(multi == 1 && type == 0){
				var sep = $(this).find('input[id*="separator"]').val();
				var argVal = null;
				var first = true;
				//makes a big string using the supplied seperator and strips off the beginning and ending quotes
				//so that when spawn is called on C:\Test.txt','C:\Test.txt'C:\Test.txt it will be wrapped correctly and
				//trick the command line into thinking these are seperate arguments
				
				//could push them seperately, but then there is no way to use the seperator...
				$(this).find('input[id*="asset"]:checked').each(function(){
					if(first){
						argVal = $(this).attr('data-path')+"'";
						first = false;
					}else if(sep){
						argVal += sep + "'" + $(this).attr('data-path')+ "'";
					}else{
						argVal += " " + "'" + $(this).attr('data-path')+ "'";
					}
				});	
				//strip off last "
				argVal = argVal.substring(0, argVal.length - 1);
				alert(argVal);
				//breakout if a required asset isn't supplied
				if (!argVal && req){
                    alert("You have to select an asset to input for a required argument!");
                    valid = false;
                }else{
                    argPaths.push(argVal);
                }
			}
        }
    });

    if (valid){
        //add extra arguments to the end of the command
        var extraArgs = $("#extraArguments").val();
        if(extraArgs != ""){
            argPaths.push(extraArgs);
        }

        var spawn = require('child_process').spawn;
        try{
			var scriptExe = spawn(rPath, argPaths);
		}catch(err){
			$("#scriptOut").text("Error using Runtime on this script!\n Runtime Path:" +rPath+ "\nScript Path:" +argPaths[0]);
		}

        scriptExe.stdout.on('data', function (data) {
            console.log(data);
            $("#scriptOut").val(data);
        });

        scriptExe.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
			$("#scriptOut").text("ERROR: " + data);
        });

        scriptExe.on('close', function (code) {
            console.log('child process exited with code ' + code);
            window.LOCAL_NW.desktopNotifications.notify('css/images/greencheck.png', 'Script Completed', 'The script has completed execution', function(){
                //do something on click
            });
        });
    }
});

//Clear the log output
$(document).on('click', "#clearLog", function(){
    console.log("Script Log has been cleared.")
    $("#scriptOut").val('');
});