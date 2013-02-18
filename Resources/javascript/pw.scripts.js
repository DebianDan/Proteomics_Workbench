
pw.scripts = (function(){
    var my = {};

    my.script = function(data){
        this.sid = data.sid;
        //this.filename = data.filename;
        this.path = data.path;
        this.alias = data.alias;
        this.date_created = data.date_created;
        this.arglist = [];
        return this;
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
                    myScript = new my.script({sid : item['sid'],
                        path : item['path'],
                        alias : item['alias'],
                        date_created : item['date_created']
                        });
                }
                onSuccess(myScript);
            }, onError);
        }
    }

    my.getAllScripts = function(onSuccess, onError){
        var sql = "SELECT * FROM scripts WHERE 1=1 ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
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