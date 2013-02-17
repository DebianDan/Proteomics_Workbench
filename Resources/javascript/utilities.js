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

//the HTML template for the assets inside of a project -- use with String.format()
var assetTemplate = '<input type="checkbox" data-aid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-aid="{0}">{1}' +
    '<a class="itemButton fav" data-aid="{0}" data-fav="{3}" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="{2}">Favorite</a>' +
    '<span class="itemButton editButton" data-aid="{0}" data-role="button" data-icon="gear" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="c">Edit</span>' +
    '<div class="editPanel" data-aid="{0}">Edit Asset Info</div>' +
    '</label>';

//the HTML template for the scripts -- use with String.format()
var scriptTemplate = '<input type="checkbox" data-sid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-sid="{0}">{1}' +
    '<a class="itemButton editButton script" data-sid="{0}" data-role="button" data-icon="gear" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="c">Edit</a>' +
    '</label>';

var editPanelTemplate = '<div class="editPanel" data-sid="{0}">Edit Script Info</div>';

var projectTemplate = '<li data-pid="{0}"><a href=\"#project-details?pid={0}">{1}</li>';