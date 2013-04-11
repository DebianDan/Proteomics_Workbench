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