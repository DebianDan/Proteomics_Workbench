//bind to the click event of the delete asset button
$("#deleteAssetPopup .delete").click(function(){
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
});

//clear list of added assets and close the dialog
function clearAssetPicker(){
    $("#assetPickerList").html("");
    $("#addAssetPopup").popup("close");
    return false;
}

//adds an asset to the project details page (display only)
function addProjectAssetMarkup(aid, path, fav){
    var filename = path.replace(/^.*[\\\/]/, '');
    if(!fav){
        fav = 0;
    }
    var theme = (fav == 0) ? 'c' : 'e';

    var itemList = $("#assetList ul.itemList");
    if(itemList){
        var markup = assetTemplate.format(aid, filename, theme, fav, path);
        itemList.prepend(markup);
    }
    itemList.trigger('create');
}

//removes the asset from the list of assets to be added
$(document).on("click", "#assetPickerList li .cancel", function(e){
    $(this).parent().parent().remove();
    e.preventDefault();
})

$(document).on("click", "#addAssetPopup .close", function(e){
    clearAssetPicker();
    e.preventDefault();
});

//launches the file browser dialogue when adding an asset
$("input.chooseFiles").click(function(){
		$("#assetInput").trigger('click');
});

$("#assetInput").change(function(){
        $(this).val().split(";").forEach(function(path){
			if(path != ""){
				$("#assetPickerList").append("<li data-path='"+path+"'>" +
					"<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
					"<input type='text' value='"+path+"'/></li>");
			}
        });
        $("#assetPickerList").trigger('create');
});

//bind to the click event of the add assets button
$("#addAssetPopup .save").click(function(){
    //get the paths for the added files
    $("#assetPickerList li").each(function(e){
        var assetPath = $(this).attr("data-path");
        //add the asset to the database and then add to the page
        pw.activeProjectObject.addAsset({path:assetPath, pid: pw.activeProjectObject.properties.pid},
            function(newAsset){
                addProjectAssetMarkup(newAsset.properties.aid, newAsset.properties.path, 0);
            }
        );
    });
    clearAssetPicker();
});

$(document).on("click", ".fav", function(e){
    e.preventDefault();
    var self = this; //keep reference to this scope
    var success = function(transaction, results){
            console.log("favorite toggle success");
            $(self).buttonMarkup({theme:theme}); //set the theme color based on toggle status
            $(self).attr("data-fav", Math.abs(fav-1)); //toggle value
        },
        fail = function(transaction, error){
            console.log("favorite toggle fail: " + error.message);
        };

    var aid = $(this).attr("data-aid"), //get asset id
        fav = parseInt($(this).attr("data-fav")), //is this favorited? (0 or 1)
        theme = (fav == 0) ? 'e' : 'c'; //if not favorited set to e, otherwise c

    if(fav == 0){
        pw.assets.addFavorite(pw.activeProject, aid, success, fail);
    }else{
        pw.assets.removeFavorite(pw.activeProject, aid, success, fail);
    }
    return false;
});

//Sorts the assets based on the users choice
$(document).on("change", "select[name=sortAssetsBy]", function(){
	 var success = function(sortedAssets){
			var project = {"properties":{"assets":sortedAssets}};
			var template = $("#tplProjectDetailsAssets").html(),
				html = Mustache.to_html(template, project);
				$("#assetList").html(html).trigger('create');
        },
        fail = function(transaction, error){
			console.log("Sorting assets failed: " + error.message);
        };
		
	pw.projects.getSortedAssets({"pid":parseInt(pw.activeProject), "sortBy" : parseInt($(this).val())}, success, fail);
	
});