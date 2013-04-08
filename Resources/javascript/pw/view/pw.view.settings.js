$(document).on('pagebeforecreate', '#settings', function (event) {
    //fire the getters off manually
    pw.settings;
    pw.tags;
});


$(document).on('settingsRetrieved', function(e){
    //TODO get rid of settings
	displaySettings();
	renderRuntimeList();
});

$(document).on('tagsRetrieved', function(e){
    displayTags();
});

//clear list of added runtime and close the dialog
function clearRuntimePicker(){
    $("#runtimePickerList").html("");
    $("#addRuntimePopup").popup("close");
    return false;
}

//removes the asset from the list of assets to be added
$(document).on("click", "#runtimePickerList li .cancel", function(e){
    $(this).parent().parent().remove();
    e.preventDefault();
})

$(document).on("click", "#addRuntimePopup .close", function(e){
    clearRuntimePicker();
    e.preventDefault();
});

//launches the file browser dialogue when adding an a runtime
$("input.chooseRuntime").click(function(){
		$("#runtimeInput").trigger('click');
});

$("#runtimeInput").change(function(){
        var path = $(this).val();
		if(path != ""){
			//clear the list since only one runtime can be choosen at a time
			$("#runtimePickerList").html("");
			$("#runtimePickerList").append("<li data-path='"+path+"'>" +
			"<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
			"<input type='text' value='"+path+"'/></li>");
		}
        $("#runtimePickerList").trigger('create');
});

//bind to the click event of the create new runtime button
$(document).on('click', "#addRuntimePopup :submit", function(){
    var alias = $("#addRuntimePopup .runtimeAlias").val();
    if(alias == ""){
        alert('Runtime must have an alias.');
    }else{
        var file = $("#runtimePickerList li").first();
        var path = file.attr("data-path");
        //add the runtime to the database and then add to the page
        pw.runtimes.addRuntime(alias, path, function(transaction, results){
            renderRuntimeList();
        });
        clearRuntimePicker();
    }
});

//bind to the click event of the delete runtime button
//$("#deleteRuntime").click(function(){
//NOT SURE WHY THIS WORKS AND THE ABOVE DOES NOT....
jQuery("body").on("click", "#deleteRuntime", function(event){
    var rid = $(this).attr('data-id');
    if(rid){
        pw.runtimes.deleteRuntime(rid, function(transaction, results){
            $("#runtimeList [data-listid='" + rid +"']").remove(); //remove runtime chosen
            console.log("deleted runtime with id {0}".format(rid));
        },function(transaction, error){
            console.log("error deleting runtime {0}: {1}".format(rid, error.message));
        })
    }
    $("#runtimeList").trigger('create'); //we removed some stuff so refresh the list
});

//update the runtime values in the db when they are changed.  No need to press a save button
$(document).on("blur", ".runtimeProperties > li input", function(e){
    var options = {
        name : $(this).attr("name"),
        id : $(this).attr("data-id"),
        value : $(this).val()
    };
    updateRuntimeValue(options);
    //update the name of the collapsible if the alias was updated
    if(options.name == "alias"){
        $("#runtimeList [data-listid='" + options.id +"']").children("h3").find(".ui-btn-text").text(options.value);
    }
});

//clear list of added assets and close the dialog
function clearRuntimePicker(){
    $("#runtimePickerList").html("");
    $("#addRuntimePopup .runtimeAlias").val("");
    $("#addRuntimePopup").popup("close");
    return false;
}

function renderRuntimeList(){
    //get all runtimes in database
    pw.runtimes.getAllRuntimes({
        success: function(data){
            console.log("rendering runtimes list");
            var template = $("#tplRuntimesListing").html(),
                html = Mustache.to_html(template, data),
                rList = $("#runtimeList");
            //refresh the runtimes list to start
            rList.html(html).trigger('create');
        },
        fail : function(error){
            alert("there was an error when attempting to retrieve the runtimes: ", error.code);
        }
    });
}

function updateRuntimeValue(options){
    var myRuntime = pw.runtimes.getRuntime({
        id: options.id,
        success : function(runtime){
            runtime.update({
                name : options.name,
                value : options.value
            });
        }
    });
}

function displaySettings(){

    /*
     $("#python2path").val(pw.settings.paths.python2);
     $("#python3path").val(pw.settings.paths.python3);

     $("#python2path").blur(function(e){
     pw.settings.paths.python2 = $(this).val();
     pw.settings.update();
     });
     $("#python3path").blur(function(e){
     pw.settings.paths.python3 = $(this).val();
     pw.settings.update();
     });
     */

    $("#settingsWaiting").hide();
    $("#settingsArea").show();
}

function displayTags(){
    $("#tagsArea .tagList").html("Tags retrieved!");
    console.log(JSON.stringify(pw.tags));
}