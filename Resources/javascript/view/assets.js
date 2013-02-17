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

    var aList = $("#assetList");
    if(aList){
        var markup = assetTemplate.format(aid, filename, theme, fav);
        aList.append(markup);
    }
    aList.trigger('create');
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
    var path = Ti.UI.openFileChooserDialog(function(path){
        //callback after dialog close
        for(i = 0; i < path.length; i++){
            $("#assetPickerList").append("<li data-path='"+path[i]+"'>" +
                "<input type='button' value='remove' data-role='button' data-icon='minus' data-iconpos='notext' data-mini='true' data-inline='true' class='cancel' />" +
                "<input type='text' value='"+path[i]+"'/></li>");
        }
    }, {multiple:true,title:'Select data file(s) to add to project'});
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