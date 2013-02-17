
pw.scripts = {
    script : function(filename, path){
        this.filename = filename;
        this.path = path;
        return this;
    },
    getScript : function(sid, onSuccess, onError){
        var sql = "SELECT sid, path, filename, filetype, path, date_created FROM scripts WHERE sid = " + sid;
        if(sid == undefined){
            onError("sid must be specified when calling getScript()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllScripts : function(onSuccess, onError){
        var sql = "SELECT * FROM scripts WHERE 1=1 ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
    },
    addScript : function(path, onSuccess, onError){
        //regex to extract filename works for both \ and / file separators
        var filename = path.replace(/^.*[\\\/]/, '');
        //just the file extension ex: jpg txt csv
        var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO scripts (path, filename, filetype, date_created) VALUES('" + path +"', '" +filename+"', '"+filetype+"', DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteScripts : function(sids, onSuccess, onError){
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
    },
    deleteScript : function(sid, onSuccess, onError){
        iSid = parseInt(sid);
        if(iSid >= 0 && iSid){
            var sql = "DELETE FROM scripts WHERE sid={0}".format(sid);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("script ID {0} is not a positive integer.".format(sid));
        }
    }
}