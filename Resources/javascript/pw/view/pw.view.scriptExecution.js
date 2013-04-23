//Execute on project details page load
$(document).on('pagebeforeshow', '#scriptExe', function (event) {
    $("#scriptOut").html("");//clear old script output on a page refresh

    //create the options method to pass to getScript() then called getScript()
    optionsObj = {
        //pw.activeScript is always the script that is currently active
		id : pw.activeScript,
        success : function(script){
            //script is the script that is returned by getScript() that is called below
			if(script){
                //set the active script so we can reuse it later
                pw.activeScriptObject = script;
                //get the runtime that the script uses
                var myRuntime = pw.runtimes.getRuntime({
                    id: script.rid,
                    name: script.alias,
                    success : function(runtime){
                        //inject the paths into the run button for executing
                        $('#run').attr('data-path', script.path);
                        $('#run').attr('data-runtime', runtime.path);

                        //add in the assets for the current project so that mustache can pick them up
                        pw.projects.getProjectEx({pid:pw.activeProject}, function(myProject){
                            pw.activeProjectObject = myProject;
                            script.assets = pw.activeProjectObject.properties.assets;

                            //TODO clear all the previous arguments out
                            var argList = $("#scriptExeAssetList");
                            //clear the assets list to start
                            argList.html("");

                            //use mustache to fill out all of the assets
							var template = $("#tplScriptExeAssetList").html(),
                                html = Mustache.to_html(template, script),
                                aList = $("#scriptExeAssetList");
                            //clear the assets list to start
                            aList.html(html).trigger('create');
                        }, function(error){
                            console.log("ERROR: {0}".format(JSON.stringify(error)));
                        });
                    }
                });

            }
        }
    }
	//finally call getScript(). This was done ass backwards where we created the options object first with what to do onSuccess baked in and then called getScript(). 
    pw.scripts.getScript(optionsObj);
});

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

//bind to the click event of the Run Script button
$(document).on('click', "#run", function(){
    console.log("Run Script button clicked");
    $('#runScript').popup("close");
    $("#scriptOut").html("");//clear the html of the output
    $("#matchedFilesPopup").html("");

    //grab the embedded path of the script and runtime
    var sPath =  $('#run').attr('data-path');
    var rPath =  $('#run').attr('data-runtime');
    var argPaths = []; //array to hold all of the script arguments
    argPaths.push(sPath); //the script path is the first argument
    var argString = "";//this is what we will push to the argPaths, we will just keep appending to it
    var valid = true;
	//for each argument of the script
    $('#scriptExeAssetList .argument').each(function(index){
        if(valid){
            var req = parseInt($(this).attr('data-required')),
                argSwitch = $(this).attr('data-switch'),
                type = parseInt($(this).attr('data-type')),
                multi = parseInt($(this).attr('data-multi')),
                label = $(this).attr('data-label'),
                argVal = "";
			
			//TODO test whether the switch is working
			//trying to push the switch first, but I think it will show up as "-i" "C:\Test.txt"
			//and I don't know if this will work
			if(argSwitch){
				argPaths.push(argSwitch);
                //argString += "{0} ".format(argSwitch);
			}
			
			//This if else_if ladder handles the 3 major cases of argument possibilities
			//string argument
			if(type == 1){
				argVal = $(this).find('input[id*="argStringValue"]').val();
				//alert(argVal);
				//breakout if a required asset isn't supplied
				if (!argVal && req){
                    alert("You have to enter a string for the required argument '{0}'!".format(label));
                    valid = false;
                }else{
                    argPaths.push(argVal);
                    //argString += "{0} ".format(argVal);
                }
			}
			//radio select
			else if(multi == 0 && type == 0){
				argVal = $(this).find('input[id*="asset"]:checked').attr('data-path');
				//alert(argVal);
				//breakout if a required asset isn't supplied
				if (!argVal && req){
                    alert("You have to select an asset to input for a required argument '{0}'!".format(label));
                    valid = false;
                }else{
                    //argVal = "\"{0}\"".format(argVal); //put quotes around it
                    argPaths.push(argVal);
                    //argString += " {0}".format(argVal);
                }
			}
			//multiselect with checkboxes
			else if(multi == 1 && type == 0){
                argVal = "";
				var sep = $(this).find('input[id*="separator"]').val() || " ";
                var checkedAssets = $(this).find('input[id*="asset"]:checked');
                if (!checkedAssets.length && req){
                    alert("You have to select an asset to input for a required argument '{0}'!".format(label));
                    valid = false;
                }else{
                    //argPaths.push(argVal);
                    checkedAssets.each(function(index, value){
                        /*
                         var currSep = (index > 0) ? sep : ""; //put the separator before the asset only if we're not on the first one
                         argVal += "{0}\"{1}\"".format(currSep, $(this).attr('data-path'));
                         */

                        if(index > 0){
                            argPaths.push(sep);
                        }
                        argPaths.push("{0}".format($(this).attr('data-path')));
                    });
                }
			}
        }
    });

    if (valid){
        //add extra arguments to the end of the command
        var extraArgs = $("#extraArguments").val(),
            outputDirectory = $("#scriptExeAssetList .scriptExeOutputDir").val();
            fileRegex = $("#scriptExeRegex").val();

        if(!pw.activeScriptObject.produces_output || !outputDirectory){
            outputDirectory = path.dirname(sPath);
        }

        //TODO: Test this
        if(extraArgs){
            argPaths.push(extraArgs);
        }

        try{
            //Node-webkit calls, spawns a child process aka runs the script
			console.log(rPath + " " + argPaths.join(' '));
			var scriptExe = spawn(rPath, argPaths, {cwd:outputDirectory});

            //outputs the data to under the run script button output textarea
			scriptExe.stdout.on('data', function (data) {
                if(data){
                    console.log(data);
                    var dataHTML = data.toString();
                    dataHTML = dataHTML.replace(/\n/g, '<br />');
                    $("#scriptOut").append(data.toString());
                }
            });

            scriptExe.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
                $("#scriptOut").append("<div class='error'>ERROR: " + data + "</div>");
            });

            scriptExe.on('close', function (code) {
                //if this is supposed to output files then try to find them and add them
                var matchedFiles = new Array();
                if(pw.activeScriptObject.produces_output){
                    fs.readdir(outputDirectory, function(err, fileList){
                        if(!err){
                            //successfully read the directory, now get files and filter
                            matchedFiles = fileList.filter(minimatch.filter(fileRegex, {matchBase: true}));
                            console.log("Matched Files: {0}".format(JSON.stringify(matchedFiles)));

                            if(matchedFiles.length > 0){
                                var template = $("#tplmatchedFilesPopup").html(),
                                    html = Mustache.to_html(template,
                                            {
                                                matchedFiles: matchedFiles,
                                                outputDirectory: outputDirectory
                                            }),
                                    myPopup = $("#matchedFilesPopup");
                                //clear the assets list to start
                                myPopup.html(html).trigger('create');
                                myPopup.popup("open");
                            }
                        }else{
                            $("#scriptOut").append("<div class='error'>Error reading directory {0}</div>".format(outputDirectory));
                        }
                    });
                }

                window.LOCAL_NW.desktopNotifications.notify('css/images/greencheck.png', 'Script Completed', 'The script has completed execution', function(){
                    //do something on click
                });
            });

		}catch(err){
            var html = "<span class='error'>Error using Runtime on this script! <br/>Runtime Path: " +rPath+ "<br/>Script Path: " +argPaths[0] + "<br/>Error Details: " + JSON.stringify(err) + "</span>";
            html += "<br/>argPaths: " + JSON.stringify(argPaths);
			$("#scriptOut").append(html);
		}
    }
});

//logic for when the user clicks add selected and add none
$(document).on("click", "div.addSelected", function(e){
    $("#matchedFilesPopup .matchedFile:checked").each(function(e){
        var p = path.join($(this).attr("data-path"), $(this).attr("data-filename"));
        //console.log(p);
        pw.activeProjectObject.addAsset({path:p, pid: pw.activeProjectObject.properties.pid});
    });
    $("#matchedFilesPopup").popup("close");
});

$(document).on("click", "div.addNone", function(e){
    $("#matchedFilesPopup").popup("close");
});

//Clear the log output
$(document).on('click', "#clearLog", function(){
    $("#scriptOut").html('');
});

//update the output directory location with the field's value
$(document).on("click", ".sideButton > a", function(e){
    e.preventDefault();

    var newValue = $(this).parents("label").siblings("input").first().val();
    try{
       var outputLoc = path.dirname(newValue);
       $(".scriptExeOutputDir").val(outputLoc);
    }catch(e){
        newPath = path.dirname(newValue);
        console.log("error setting output location. Maybe not a valid path? {0}".format(newValue));
    }

    return false;
});