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