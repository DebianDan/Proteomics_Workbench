//before the page loads, fire the 2 custom events below which are settingsRetrieved and tagsRetrieved
$(document).on('pagebeforecreate', '#settings', function (event) {
    //fire the getters off manually
    pw.settings;
    pw.tags;
});

$(document).on('settingsRetrieved', function(e){
	//disables the standard message "waiting to load runtimes"
	displaySettings();
	//gets all Runtimes from the DB and displays them using mustache.js
	renderRuntimeList();
});

//NOT fully implemented, just writes a debug message to the console
$(document).on('tagsRetrieved', function(e){
    //This is where tags will be retrieved and displayed
	displayTags();
});

//clear list of added runtimes and closes the dialog
function clearRuntimePicker(){
    $("#runtimePickerList").html("");
    $("#addRuntimePopup").popup("close");
    return false;
}

//removes the asset from the list of assets to be added when dialog is cancelled
$(document).on("click", "#runtimePickerList li .cancel", function(e){
    $(this).parent().parent().remove();
    e.preventDefault();
})

//clear list of added runtimes and closes the dialog
$(document).on("click", "#addRuntimePopup .close", function(e){
    clearRuntimePicker();
    e.preventDefault();
});

//launches the file browser dialogue when adding an a runtime
$("input.chooseRuntime").click(function(){
		$("#runtimeInput").trigger('click');
});

//in the dialog popup when the runtime is changed clear the input and add the newly chosen one
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

//bind to the click event of the create new runtime button in the add runtime dialog
//when submitted check if a runtime is chosen if so get the path from custom attribute "data-path"
//this is when the public runtime model is called by pw.runtimes.addRuntime() and renderRuntimeList() happens on success
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
//get the embedded rid of the Runtime to be deleted and call pw.runtimes.deleteRuntime()
//this is the API that we provide in all of the .model files, which makes it simple to add, delete, read, and update any particular item
//after it has been deleted find it in the HTML markup and remove it so it's no longer on the page
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
            //grab the mustache.js template from in the HTML and create list by passing the array of runtimes
			//that were retrieved by getAllRuntimes() and populate the div with id "runtimeList"
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

//when updating any value associated with a runtime
function updateRuntimeValue(options){
    //first get the runtime based on the RUNTIMEid
	var myRuntime = pw.runtimes.getRuntime({
        id: options.id,
        success : function(runtime){
            //runtime is the object returned by getRuntime and .update is the private field available to update the name and value
			//see pw.model.runtimes.js for more information
			runtime.update({
                name : options.name,
                value : options.value
            });
        }
    });
}

function displaySettings(){
    $("#settingsWaiting").hide();
    $("#settingsArea").show();
}

function displayTags(){
    $("#tagsArea .tagList").html("Tags retrieved!");
    console.log(JSON.stringify(pw.tags));
}