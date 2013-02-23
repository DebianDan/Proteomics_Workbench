
pw.scripts = (function(){
    var my = {};

    var scriptHash = {}; //store the scripts after they're generated
    var argumentHash = {}; //store the arguments after they're generated

    var script = function(data){
        this.sid = data['sid'];
        //this.filename = data.filename;
        this.path = data['path'];
        this.alias = data['alias'];
        this.date_created = data['date_created'];
        //this.arglist = [];
        this.arguments = [new argument({
            id : 1,
            label : "hurf durf label 1",
            description: "description 1",
            required: 1
        }), new argument({
            id : 2,
            label : "hurf durf label 2",
            required: 0
        })]
        this.update = function(options){
            console.log('update called on script {0} updating column {1} to {2}'.format(this.sid, options.name, options.value));
        }
        scriptHash[this.sid] = this;
        return scriptHash[this.sid];
    }

    var argument = function(data){
        defaults = {
            id: -1,
            alias: "",
            label : "",
            description: "",
            required : 0
        }
        $.extend(this, defaults, data); //mix properties of data with defaults & this context
        this.update = function(options){
            console.log('update called on arg {0} to update column {1} to {2}'.format(this.id, options.name, options.value));
        }
        this.test = function(){
            alert("TEST!");
        }

        argumentHash[this.id] = this;
        return argumentHash[this.id];
    }

    my.getArgument = function(options){
        var returnObject = {},
            sql = "SELECT * FROM arguments WHERE id = {0}".format(options.id);
        if(options.id == undefined){
            onError("id must be specified in options object when calling getArgument()");
            return false;
        }else{
            if(argumentHash[options.id]){ //attempt to get it locally first
                options.success(argumentHash[options.id]);
            }else{ //we have to get it from the database
                pw.db.execute(sql, function(transaction, results){
                    var myArgument = null;
                    if(results.rows.length){
                        var item = results.rows.item(0);
                        myArgument = new argument(item);
                    }
                    options.success(myArgument);
                }, options.error);
            }
        }
    }

    my.getScript = function(options){
        var sql = "SELECT * FROM scripts WHERE sid = {0}".format(options.id);
        if(options.id == undefined){
            options.error("id must be specified in options object when calling getScript()");
            return false;
        }else{
            if(scriptHash[options.id]){ //attempt to get it locally first
                options.success(scriptHash[options.id]);
            }else{ //we have to get it from the database
                pw.db.execute(sql, function(transaction, results){
                    var myScript = null;
                    if(results.rows.length){
                        var item = results.rows.item(0);
                        myScript = new script(item);
                    }
                    options.success(myScript);
                }, options.error);
            }
        }
    }

    //gets all scripts from the database and packages each up as a script object
    //argument options is an object with two functions named 'success' and 'callback'. Executed on success or fail respectively.
    my.getAllScripts = function(options){
        var sql = "SELECT * FROM scripts WHERE 1=1 ORDER BY date_created DESC",
        returnObj = {
            scripts : [] //array of script objects to return
        };

        //clear out old scripts and arguments each time this is called
        scriptHash = {};
        argumentHash = {};

        pw.db.execute(sql, function(transaction, results){
            console.log(results.rows.length + " scripts retrieved");
            //create script objects out of each script
            if(results.rows.length){
                for(var i = 0; i < results.rows.length; i++){
                    var newScript = new script(results.rows.item(i));

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