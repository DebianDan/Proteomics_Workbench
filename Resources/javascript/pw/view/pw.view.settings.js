$(document).on('pagebeforecreate', '#settings', function (event) {
    //fire the getters off manually
    pw.settings;
    pw.tags;
});


$(document).on('settingsRetrieved', function(e){
    displaySettings();
});

$(document).on('tagsRetrieved', function(e){
    displayTags();
});

//launches the file browser dialogue when adding an a runtime
$("input.chooseRuntime").click(function(){
    var path = Ti.UI.openFileChooserDialog(function(path){
        //callback after dialog close
        for(i = 0; i < path.length; i++){
            $("#runtimePickerList").append("<li data-path='"+path[i]+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path[i]+"'/></li>");
        }
    }, {multiple:false,title:'Select runtime executable'});
    $("#runtimePickerList").trigger('create');
});

//bind to the click event of the create new runtime button
$(document).on('click', "#addRuntimePopup :submit", function(){
    var alias = $("#addRuntimePopup .runtimeAlias").val();
	if(alias == ""){
        alert('Runtime must have an alias.');
    }
	else{
	$("#runtimePickerList li").first(function(e){
        var path = $(this).attr("data-path");
        //add the runtime to the database and then add to the page
        pw.runtimes.addRuntime(alias, path, function(transaction, results){
            renderRuntimeList();
        });
    });
    clearAssetPicker();
});

//bind to the click event of the delete runtime button
$(".deleteRuntime").click(function(){
	var rid = $(this).attr('data-id');
	if(rid){
		pw.runtimes.deleteRuntime(rid, function(transaction, results){
			//TODO
			$("#runtimeList [data-id='" + rid +"']").remove(); //remove elements with the specified attribute
			console.log("deleted runtime with id {0}".format(rid));
		},function(transaction, error){
			console.log("error deleting runtime {0}: {1}".format(rid, error.message));
		})
	}
    $("#runtimeList").trigger('create'); //we removed some stuff so refresh the list
});

//clear list of added assets and close the dialog
function clearRuntimePicker(){
    $("#runtimePickerList").html("");
    $("#addRuntimePopup").popup("close");
    return false;
}

function renderRuntimeList(){
    //get all runtimes in database
    pw.runtime.getAllRuntimes({
        success: function(data){
            console.log("rendering runtimes list");
            var template = $("#tplRuntimesListing").html(),
                html = Mustache.to_html(template, data),
                rList = $("#runtimeList");
            //clear the assets list to start
            rList.html(html).trigger('create');

        },
        fail : function(error){ //TODO: check to make sure arguments list is correct for this function
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    });
}

function displaySettings(){
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

    $("#settingsWaiting").hide();
    $("#settingsArea").show();
}

function displayTags(){
    $("#tagsArea .tagList").html("Tags retrieved!");
    console.log(JSON.stringify(pw.tags));
}