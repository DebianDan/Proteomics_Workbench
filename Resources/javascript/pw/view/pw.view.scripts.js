//clear list of added assets and close the dialog
function clearScriptPicker(){
    $("#scriptPickerList").html("");
    $("#addScriptPopup").popup("close");
    return false;
}

//adds a script to the scripts page (display only)
function addProjectScriptMarkup(sid, path){
    var filename = path.replace(/^.*[\\\/]/, '');
    var sList = $("#scriptList");
    if(sList){
        var markup = scriptTemplate.format(sid, filename);
        sList.append(markup);
    }
    sList.trigger('create');
}

//takes the settings button DOM element as input
function showScriptSettings(e){
    $(e).parents('label')
}

$(document).on("getDetails", "#scriptList .detailsPane", function(e){
    /*e.preventDefault();
     var self = this;
     pw.scripts.getScript(e.id, function(script){
     if(script){
     console.log(JSON.stringify(script));
     var detailsPaneMarkup = $(scriptDetailsTemplate.format(script.alias, script.sid, script.path, createArgumentsMarkup(script)));
     $(self).html(detailsPaneMarkup);
     $('.tagBox', self).chosen(); //apply the chosen plugin to the multi select box
     //$('.scriptArguments', self).listview('refresh');
     //detailsPaneMarkup.trigger('create');
     }
     });*/
});

function createArgumentsMarkup(script){
    var tagBox = getTagsSelectMarkup();
    return argumentTemplate.format("test",tagBox);
}

//removes the script from the list of scripts to be added
$(document).on("click", "#scriptPickerList li .cancel", function(e){
    $(this).parent().parent().fadeOut("fast", function(e){
        e.remove(); //remove elements with the specified attribute
    });
    e.preventDefault();
})

$(document).on("click", "#addScriptPopup .close", function(e){
    clearScriptPicker();
    e.preventDefault();
});

/*
 $(document).on("click", ".addInputArgument", function(e){
 //add an
 });
 */

//launches the file browser dialogue when adding a script
$("input.chooseScripts").click(function(){
    /*
    var path = Ti.UI.openFileChooserDialog(function(path){
        //callback after dialog close
        for(i = 0; i < path.length; i++){
            $("#scriptPickerList").append("<li data-path='"+path[i]+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path[i]+"'/></li>");
        }
    }, {multiple:true,title:'Select script to add'});
    $("#scriptPickerList").trigger('create');
    */

    chooseFile("#multipleInput", function(evt){
        $(this).val().split(";").forEach(function(path){
            $("#scriptPickerList").append("<li data-path='"+path+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path+"'/></li>");
        });
        $("#scriptPickerList").trigger('create');
    });
});

//bind to the click event of the add scripts button
$("#addScriptPopup .save").click(function(){
    console.log("add script button clicked");
    //get the paths for the added files
    $("#scriptPickerList li").each(function(e){
        var path = $(this).attr("data-path");
        //add the asset to the database and then add to the page
        pw.scripts.addScript(path, function(transaction, results){
            //addProjectScriptMarkup(results.insertId, path);
            renderScriptList();
        },function(t,e){
            console.log("Error when trying to add script: {0}".format(e.message));
        });
    });
    clearScriptPicker();
});

$(document).on("click", ".deleteScript", function(e){
    var sid = $(this).attr('data-id');
    pw.scripts.deleteScript(sid, function(){
        $("#scriptsList .script-" + sid).fadeOut("fast", function(e){
            e.remove();
        })
    })
})

//bind to the click event of the delete script button
$("#deleteScriptPopup .delete").click(function(){
    var sids = new Array(); //array of asset id's to delete (keeping this so we can do something else if large number of deletes)
    $('#scriptList input[data-sid]:checked').each(function () { //get all inputs that are checked and have an attribute of data-sid
        var sid = $(this).attr('data-sid');
        if(sid){
            var self = this;
            sids.push(sid);
            pw.scripts.deleteScript(sid, function(transaction, results){
                $("#scriptList [data-sid='" + sid +"']").fadeOut("fast", function(e){
                    e.remove(); //remove elements with the specified attribute
                });
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
     console.log("delete script button clicked");
     var numChecked = $( "input:checked" ).length;
     if (numChecked === 0){
     alert('Choose at least 1 script to Delete.');
     }
     else{
     //fill up an array of all the script sid to be deleted

     pw.scripts.deleteScripts(sids,
     //success callback
     function(transaction, results){
     //Remove all deleted scripts completely from the list
     for (var i = 0; i < sids.length; i++) {
     //find div that wraps all of the scripts, empty, remove
     var checkBox = $("#scriptList").find("input[name='sid-"+sids[i]+"']").parent();
     checkBox.empty();
     checkBox.remove();
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


function renderScriptList(){
    //get all scripts in database
    pw.scripts.getAllScripts({
        success: function(data){
            console.log("rendering scripts list");
            var template = $("#tplScriptsListing").html(),
                html = Mustache.to_html(template, data),
                sList = $("#scriptsList");
            //clear the assets list to start
            sList.html(html).trigger('create');
            $(".scriptProperties select[id*=runtimeChooser]").each(function(){
                var scriptRID = $(this).attr("data-rid");
                if(scriptRID != "{{rid}}"){
                    //remove the default choose scripts and select the correct runtime
                    $(this).find("option[value="+ scriptRID +"]").attr('selected','selected');
                    $(this).selectmenu('refresh');
                }

            });

        },
        fail : function(error){ //TODO: check to make sure arguments list is correct for this function
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    });
}

function updateScriptValue(options){
    var myScript = pw.scripts.getScript({
        id: options.id,
        success : function(script){
            script.update({
                name : options.name,
                value : options.value
            });
        }
    });
}

function updateArgumentValue(options){
    var myArgument = pw.scripts.getArgument({
        id: options.id,
        success : function(a){
            a.update({
                name : options.name,
                value : options.value
            });
        }
    });
}

$(document).on("click", ".addInputArgument", function(e){
    //options argument to pass to getScript()
    var self = this;
    var options = {
        id : $(self).attr("data-id"),
        success : function(script){
            script.addArgument({
                id : $(self).attr("data-id"),
                success : function(newArg){
                    console.log("successfully added input argument: {0}".format(JSON.stringify(newArg)));
                    //we have successfully added the argument to the database
                    //now we need to create the entry in the form
                    //get the template for the entry first
                    var template = $("#tplScriptsListing .argumentsList div.arg")[0].outerHTML, //using outerHTML gives us the wrapping element itself (in this case the <li>) which jquery doesn't do
                        html = $(Mustache.to_html(template, newArg));
                    //check to see if the arg list was empty
                    var isEmpty = $(self).prev().children('div.arg');
                    if (!isEmpty.length){
                        console.log("The argument list was empty..");
                        $(self).prev().prepend(html);
                    }else{
                        //add the new argument after the last arg in the list
                        isEmpty.last().after(html);
                    }
                    //update the list
                    $(self).prev().trigger('create');
                    $(self).parent().trigger('create');
                }
            });
        }
    }
    //get the script
    pw.scripts.getScript(options);
});

$(document).on("click", ".deleteArg", function(e){
    var self = this,
        options = {
            id : $(this).attr("data-id"),
            success : function(myArg){
                myArg.remove({
                    success : function(){
                        $(self).closest(".arg").fadeOut("fast", function(e){
                            e.remove(); //remove elements with the specified attribute
                        });
                    }
                });
            }
        }
    pw.scripts.getArgument(options);
});

$(document).on("blur", ".scriptProperties > li:not(.argumentContainer) :input", function(e){
    var options = {
        name : $(this).attr("name"),
        id : $(this).attr("data-id"),
        value : $(this).val()
    };
    updateScriptValue(options);
});

//updates the runtime that the particular script uses when it is changed
$(document).on("change", ".scriptProperties select[id*=runtimeChooser]", function(){
    var options ={
        name : "rid",
        id : $(this).attr("data-id"),
        value : $(this).val()
    };
    updateScriptValue(options);
});


$(document).on("blur", ".argumentsList input[type=text]", function(e){
    var options = {
        name : $(this).attr("name"),
        id : $(this).attr("data-id"),
        value : $(this).val()
    };
    updateArgumentValue(options);
});


$(document).on("change", ".argumentsList input[type=checkbox]", function(e){
    var options ={
        name : $(this).attr("name"),
        id : $(this).attr("data-id"),
        value : ($(this).is(":checked")) ? 1 : 0
    };
    updateArgumentValue(options);
});

//execute on scripts page load
$(document).on('pagebeforecreate', '#scripts', function (event) {

    //testing mustache to fill in arguments
    //template = $("#tplInputArgs").html();
    //var html = Mustache.to_html(template, testScript);
    //$(template).prepend(html);
    //$("#inputArgumentsList").html(html);
    //$("#argumentsList").trigger("create");
    //$.mobile.activePage.trigger('create');
    //console.log(html);
    renderScriptList();
});