//I'm going to continue to follow the pattern of the 'projects' object above but
//part of me feels like 'asset' should be an object on its own containing references to
//the functions that can change it (setFavorite(), etc). Then the 'project' object can have an array
//of asset objects...
pw.assets = {
    asset : function(name, path){
        this.name = name;
        this.path = path;
        return this;
    },
    getAsset : function(aid, onSuccess, onError){
        var sql = "SELECT aid, pid, path, filename, filetype, path, date_created FROM assets WHERE aid = " + aid;
        if(aid == undefined){
            onError("aid must be specified when calling getAsset()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllAssets : function(pid, onSuccess, onError){
        var sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+pid+" ORDER BY assets.date_created DESC";
        if(pid == undefined){
            onError("pid must be specified when calling getAllAssets()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    addAsset : function(pid, path, onSuccess, onError){
        //regex to extract filename works for both \ and / file separators
        var filename = path.replace(/^.*[\\\/]/, '');
        //just the file extension ex: jpg txt csv
        var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO assets (pid, path, filename, filetype, date_created) VALUES('" + pid + "', '" + path +"', '" +filename+"', '"+filetype+"', DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteAssets : function(aids, onSuccess, onError){
        //remove assets and also remove if its in favorites
        var sql = "DELETE FROM assets WHERE aid=";
        var sqlFav = "DELETE FROM favorites WHERE aid=";
        for (var i = 0; i < aids.length; i++) {
            //treat the last aid differently
            if (i === aids.length-1){
                sql += aids[i];
                sqlFav += aids[i];
            }
            else{
                sql += aids[i] + " OR aid=";
                sqlFav += aids[i] + " OR aid=";
            }
        }
        pw.db.execute(sql, onSuccess, onError);
        pw.db.execute(sqlFav, onSuccess, onError);
    },
    deleteAsset : function(aid, onSuccess, onError){
        iAid = parseInt(aid);
        if(iAid >= 0 && iAid){
            var sqlFav = "DELETE FROM favorites WHERE aid={0}".format(aid);
            var sql = "DELETE FROM assets WHERE aid={0}".format(aid);
            pw.db.execute(sqlFav);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("asset ID {0} is not a positive integer.".format(aid));
        }
    },
    //Add functionality
    addFavorite : function(pid, aid, onSuccess, onError){
        var sql = "INSERT INTO favorites VALUES(" + pid + ", "+ aid + ")";
        pw.db.execute(sql, onSuccess, onError);
    },
    removeFavorite : function(pid, aid, onSuccess, onError){
        var sql = "DELETE FROM favorites WHERE pid=" + pid + " AND aid="+ aid;
        pw.db.execute(sql, onSuccess, onError);
    }
}