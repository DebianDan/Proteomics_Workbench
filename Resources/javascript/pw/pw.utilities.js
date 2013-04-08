//String.format() utility function, replaces {0} ... {n} in string with supplied arguments based on argument position
//first, checks if it isn't implemented yet
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function chooseFile(name, callback) {
    var chooser = $(name);
    chooser.trigger('click');
    chooser.change(callback);
}


//this will be fired when anything with the class dirBrowserButton is clicked
//if that element has a data-target attribute, that will be assumed to be the ID of the input whose value will be updated with the selected directory path
$(document).on('click', '.dirBrowserButton', function(e){
    //see if there is a data-for attribute so we can update that
    var targetID = $(this).attr("data-target");
    chooseFile("#directoryInput", function(evt){
        var newValue = $(this).val();
        if(targetID){
            updateInputAndBlur(targetID, newValue);
        }
    });
    return false;
});

$(document).on('click', '.fileBrowserButton', function(e){
    //see if there is a data-for attribute so we can update that
    var targetID = $(this).attr("data-target");
    chooseFile("#fileInput", function(evt){
        var newValue = $(this).val();
        if(targetID){
            updateInputAndBlur(targetID, newValue);
        }
    });
    return false;
});

function updateInputAndBlur(targetID, newValue){
    var target = $('#'+targetID);
    //make sure target element exists before updating
    if(target.length > 0){
        target.val(newValue);
        target.blur(); //call blur so that the element is updated
    }
}

function getTagsSelectMarkup(){
    var selectTemplate = '<select class="tagBox" data-role="none" style="width:350px;" multiple data-placeholder="Tags">{0}</select>',
    optionTemplate = '<option value="{0}">{1}</option>',
    options = "",
    markup = "";

    for(var prop in pw.tags){
        options += optionTemplate.format(prop, pw.tags[prop]);
    }

    markup = selectTemplate.format(options);
    return markup;
}