
pw.scripts = (function(){
    var my = {};

    my.script = function(data){
        this.sid = data['sid'];
        //this.filename = data.filename;
        this.path = data['path'];
        this.alias = data['alias'];
        this.date_created = data['date_created'];
        //this.arglist = [];
        this.arguments = [{
            id : 1,
            label : "hurf durf label 1"
        }, {
            id : 2,
            label : "hurf durf label 2"
        }]
        return this;
    }

    function scriptFromSqlResults(results){
        scriptObj = new my.script();
    }

    my.getScript = function(sid, onSuccess, onError){
        var sql = "SELECT * FROM scripts WHERE sid = " + sid;
        if(sid == undefined){
            onError("sid must be specified when calling getScript()");
            return false;
        }else{
            pw.db.execute(sql, function(transaction, results){
                var myScript = null;
                if(results.rows.length){
                    var item = results.rows.item(0);
                    myScript = new my.script(item);
                }
                onSuccess(myScript);
            }, onError);
        }
    }

    //gets all scripts from the database and packages each up as a script object
    //argument options is an object with two functions named 'success' and 'callback'. Executed on success or fail respectively.
    my.getAllScripts = function(options){
        var sql = "SELECT * FROM scripts WHERE 1=1 ORDER BY date_created DESC",
        returnObj = {
            scripts : [] //array of script objects to return
        };

        pw.db.execute(sql, function(transaction, results){
            console.log(results.rows.length + " scripts retrieved");
            //create script objects out of each script
            if(results.rows.length){
                for(var i = 0; i < results.rows.length; i++){
                    var newScript = new my.script(results.rows.item(i));
                    console.log("in the getter scope: " + JSON.stringify(newScript));
                    returnObj.scripts.push(newScript);
                }
            }

            options.success(returnObj); //call the success callback
        }, options.error);
    }

    my.addScript = function(path, onSuccess, onError){
        //regex to extract filename works for both \ and / file separators
        var alias = path.replace(/^.*[\\\/]/, '');
        //just the file extension ex: jpg txt csv
        //var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO scripts (path, alias, date_created) VALUES('{0}', '{1}', DATETIME('NOW'))".format(path, alias);
        pw.db.execute(sql, onSuccess, onError);
    }

    my.deleteScripts = function(sids, onSuccess, onError){
        //remove scripts
        var sql = "DELETE FROM scripts WHERE sid=";
        for (var i = 0; i < sids.length; i++) {
            //treat the last aid differently
            if (i === sids.length-1){
                sql += sids[i];
            }
            else{
                sql += sids[i] + " OR sid=";
            }
        }
        pw.db.execute(sql, onSuccess, onError);
    }

    my.deleteScript = function(sid, onSuccess, onError){
        iSid = parseInt(sid);
        if(iSid >= 0 && iSid){
            var sql = "DELETE FROM scripts WHERE sid={0}".format(sid);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("script ID {0} is not a positive integer.".format(sid));
        }
    }

    return my;
}());