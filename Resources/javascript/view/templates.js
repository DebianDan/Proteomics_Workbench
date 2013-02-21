var projectTemplate = '<li data-pid="{0}"><a href=\"#project-details?pid={0}">{1}</li>';

//the HTML template for the assets inside of a project -- use with String.format()
var assetTemplate = '<input type="checkbox" data-aid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-aid="{0}">{1}' +
    '<a class="itemButton fav" data-aid="{0}" data-fav="{3}" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="{2}">Favorite</a>' +
    '<span class="itemButton detailsButton" data-aid="{0}" data-id="{0}" data-role="button" data-icon="gear" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="c">Edit</span>' +
    '</label>';

//the HTML template for the scripts -- use with String.format()
var scriptTemplate = '<input type="checkbox" data-sid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-sid="{0}">{1}' +
    //'<span class="itemButton detailsButton script" data-sid="{0}" data-id="{0}" data-role="button" data-icon="gear" data-mini="true" data-inline="true" data-theme="c">Edit</span>' +
    '<span class="ui-icon ui-icon-gear ui-icon-shadow">&nbsp;</span>' +
    '</label>';

var detailsPaneTemplate = '<div class="detailsPane">Details Pane</div>';

var scriptDetailsTemplate = '<span>Alias: </span><input type="text" name="alias" value="{0}" /><br/>' +
    '<label for="path-{1}">Path: </label><input type="text" name="path" id="path-{1}" value="{2}" /><br/>' +
    '<h4>Arguments</h4><ul data-role="listview" data-theme="b" data-content-theme="d" class="scriptArguments scriptArguments-{1}">{3}</ul><a data-role="button" href="#">Add Argument</a>';

//{1} is the multi select tag markup
var argumentTemplate = '<li><input type="text" placeholder="Argument Label" class="argLabel" /><input type="text" placeholder="Argument Switch (eg: -i)" class="argSwitch" />{1}<textarea placeholder="Argument Description" type="text" class="argDescription" value="{0}" /></li>';

