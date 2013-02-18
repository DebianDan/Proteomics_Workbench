(function() {
    var _settings, //private variable to hold the returned database object
    _defaults = {
        paths : {python2 : "C:\\Python32\\python.exe",
            python3 : "C:\\Python32\\python.exe"
        },
        update : function(onSuccess, onFail){
            pw.db.execute("DELETE FROM settings");
            pw.db.execute("INSERT INTO settings VALUES('{0}')".format(JSON.stringify(pw.settings)), onSuccess, onFail);
         }
    };

    //we define this getter so that it will only try to retrieve the database one time
    pw.__defineGetter__("settings", function(){
        if(_settings == undefined){ //only retrieve the database & create tables on program start
            console.log("getting settings from the db");
            _settings = _defaults;
            getSettings(_settings);
        }
        return _settings;
    });

    getSettings = function(settingsObj){
        pw.db.execute("SELECT * FROM settings", function(t, results){
            if(results.rows.length){
                //only want the first item
                var row = results.rows.item(0),
                settingsString = row['settingsString'];
                console.log("settings string: {0}".format(settingsString));
                temp = JSON.parse(settingsString);
                $.extend(true, settingsObj, temp);
            }
            var e = $.Event("settingsRetrieved");
            $(document).trigger(e);
        },function(t, error){
            console.log("getting the settings failed: {0}".format(error.message));
        });
    }
}(pw));