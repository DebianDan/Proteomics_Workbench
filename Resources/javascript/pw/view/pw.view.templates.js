/*
This file was more relevant before we began to use mustache.js (see https://github.com/janl/mustache.js/) for more details.
This was used to store templates of the html and then were populated using the string.format() function in the pw.utilites.js file.
*/

var projectTemplate = '<li data-pid="{0}"><a href=\"#project-details?pid={0}">{1}</li>';

//the HTML template for the assets inside of a project -- use with String.format()
var assetTemplate = '<li><input type="checkbox" data-aid="{0}" name="checkbox-{0}" id="checkbox-{0}" data-theme="c" />' +
    '<label for="checkbox-{0}" data-aid="{0}">{1}' +
    '<a class="itemButton fav" data-aid="{0}" data-fav="{3}" data-role="button" data-icon="star" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="{2}">Favorite</a>' +
    '<span class="itemButton detailsButton" data-aid="{0}" data-id="{0}" data-role="button" data-icon="gear" data-iconpos="notext" data-mini="true" data-inline="true" data-theme="c">Edit</span>' +
    '</label>' +
    '<div id="detailsPane-{0}" class="detailsPane hideDefault" data-id="{0}">' +
    '<a class="openFile" data-role="button" data-mini="true" data-path="{4}">Open File</a>' +
    '<a class="openFileLocation" data-role="button" data-mini="true" data-path="{4}">Show In Folder</a>' +
    '</div></li>';

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
	
var scriptProjectDetailsTemplate = '<li data-sid="{0}"><a href="#scriptExe?sid={0}">{1}</a></li>';

var scriptExeAssetTemplate = '<input type="radio" name="scriptAsset{3}" id="aid{0}" value="aid{0}" data-path="{1}" data-theme="c"><label for="aid{0}">{2}</label>';

//{1} is the multi select tag markup
var argumentTemplate = '<li><input type="text" placeholder="Argument Label" class="argLabel" /><input type="text" placeholder="Argument Switch (eg: -i)" class="argSwitch" />{1}<textarea placeholder="Argument Description" type="text" class="argDescription" value="{0}" /></li>';

